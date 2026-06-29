import dotenv from "dotenv";
dotenv.config();

console.log(
  "PROJECT ID:",
  process.env.FIREBASE_PROJECT_ID
);

import express from "express";
import cors from "cors";

import paymentRoutes from "./routes/payment.js";
import slotRoutes from "./routes/slotRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import helmet from "helmet";

import rateLimit from "express-rate-limit";
import { purgeExpiredLocks } from "./controllers/slotController.js";

const app = express();

// ✅ Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://consultant-frontend-6m91.vercel.app",
    ],
    credentials: true,
  })
);

// Capture raw body for signature verification in webhooks
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(helmet());

// ✅ 1. Global Rate Limiter (Moved to top)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, try again later.",
  },
});
app.use(limiter);

// ✅ 2. Strict Payment Limiter (Moved to top)
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many payment attempts",
  },
});

// ✅ Routes
app.use(
  "/api/payment",
  paymentLimiter,
  paymentRoutes
);
app.use("/api/slots", slotRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ✅ Schedule lock purge
purgeExpiredLocks(); // run once on startup
setInterval(purgeExpiredLocks, 10 * 60 * 1000); // run every 10 minutes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});