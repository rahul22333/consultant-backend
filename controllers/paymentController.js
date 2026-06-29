import dotenv from "dotenv";
dotenv.config();

import Razorpay from "razorpay";
import crypto from "crypto";
import db from "../config/firebase.js";
import {
  sendBookingEmails,
} from "../services/sendEmail.js";
import { getFixedPrice } from "./slotController.js";

// 🔑 Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});


// ✅ CREATE ORDER (Accept details to store in Razorpay order notes)
export const createOrder = async (req, res) => {
  try {
    const { name, contact, date, time } = req.body;
    const price = await getFixedPrice();

    const order = await razorpay.orders.create({
      amount: price * 100,
      currency: "INR",
      notes: {
        name: name || "",
        contact: contact || "",
        date: date || "",
        time: time || "",
      },
    });

    res.json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ error: "Error creating order" });
  }
};


// ✅ VERIFY PAYMENT + LOCK SLOT + SAVE BOOKING
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      contact,
      date,
      time,
    } = req.body;

    // 🔐 STEP 1: Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // 🛑 STEP 2: Prevent duplicate processing (idempotency)
    const paymentRef = db.ref(`payments/${razorpay_payment_id}`);
    const existing = await paymentRef.once("value");

    if (existing.exists()) {
      return res.json({
        success: true,
        message: "Payment already processed",
      });
    }

    // 🔒 STEP 3: Atomic slot locking
    const slotRef = db.ref(`slots/${date}/${time}`);

    const result = await slotRef.transaction((currentData) => {
      if (!currentData || !currentData.isBooked) {
        return {
          isBooked: true,
          name,
          contact,
          paymentId: razorpay_payment_id,
          createdAt: Date.now(),
        };
      }
      return; // already booked
    });

    if (!result.committed) {
      return res.status(400).json({
        success: false,
        message: "Slot already booked",
      });
    }

    // 🧾 STEP 4: Save booking record
    const bookingRef = db.ref("bookings").push();

    await bookingRef.set({
      name,
      contact,
      date,
      time,
      paymentId: razorpay_payment_id,
      createdAt: Date.now(),
    });

    // ✅ STEP 5: Mark payment processed
    await paymentRef.set(true);
     // ✅ SEND EMAILS
await sendBookingEmails({
  name,
  contact,
  date,
  time,
  paymentId:
    razorpay_payment_id,
});

    // ✅ SUCCESS
    res.json({
      success: true,
      message: "Booking confirmed",
    });

  } catch (error) {
    console.error("Verify Payment Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ✅ WEBHOOK SIGNATURE VERIFICATION + MID-PAYMENT RESILIENCY
export const handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET is not configured.");
      return res.status(500).send("Webhook secret not set");
    }

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.rawBody || JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      console.warn("Invalid webhook signature.");
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;
    if (event === "payment.captured") {
      const payment = req.body.payload?.payment?.entity;
      if (!payment) {
        return res.status(400).send("No payment entity");
      }

      const paymentId = payment.id;
      const { name, contact, date, time } = payment.notes || {};

      if (!name || !contact || !date || !time) {
        console.warn("[Webhook] Missing metadata notes for payment:", paymentId);
        return res.json({ status: "skipped", message: "Missing notes" });
      }

      // Idempotency check
      const paymentRef = db.ref(`payments/${paymentId}`);
      const existing = await paymentRef.once("value");

      if (existing.exists()) {
        console.log(`[Webhook] Payment ${paymentId} already processed.`);
        return res.json({ status: "ok", message: "Already processed" });
      }

      // Lock slot + save booking atomically
      const slotRef = db.ref(`slots/${date}/${time}`);
      const result = await slotRef.transaction((currentData) => {
        if (!currentData || !currentData.isBooked) {
          return {
            isBooked: true,
            name,
            contact,
            paymentId,
            createdAt: Date.now(),
          };
        }
        return; // already booked
      });

      if (!result.committed) {
        console.warn(`[Webhook] Slot ${date} ${time} already booked. Processing refund manually needed.`);
        return res.status(400).json({ success: false, message: "Slot already booked" });
      }

      // Record booking
      const bookingRef = db.ref("bookings").push();
      await bookingRef.set({
        name,
        contact,
        date,
        time,
        paymentId,
        createdAt: Date.now(),
      });

      // Mark payment processed
      await paymentRef.set(true);

      // Send emails
      await sendBookingEmails({
        name,
        contact,
        date,
        time,
        paymentId,
      });

      console.log(`[Webhook] Successfully confirmed booking for ${name} on ${date} at ${time}`);
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("Webhook handler error");
  }
};