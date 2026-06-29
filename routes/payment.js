import express from "express";
import { createOrder, verifyPayment, handleWebhook } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/webhook", handleWebhook);

export default router;