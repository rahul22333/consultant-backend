import dotenv from "dotenv";
dotenv.config();

import Razorpay from "razorpay";
import crypto from "crypto";
import db from "../config/firebase.js";

// 🔒 NEVER trust frontend amount
const FIXED_PRICE = 500;

// 🔑 Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});


// ✅ CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: FIXED_PRICE * 100,
      currency: "INR",
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