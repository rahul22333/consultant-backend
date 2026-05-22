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
app.use(express.json());

app.use(helmet());

// ✅ Routes
app.use("/api/slots", slotRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// rate limit
const limiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 100,

  message: {
    success: false,
    message:
      "Too many requests, try again later.",
  },
});

app.use(limiter);

//Strict Payment Limiter
const paymentLimiter = rateLimit({

  windowMs: 5 * 60 * 1000,

  max: 10,

  message: {
    success: false,
    message:
      "Too many payment attempts",
  },
});

app.use(
  "/api/payment",
  paymentLimiter,
  paymentRoutes
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});