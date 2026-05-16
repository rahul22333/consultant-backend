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

const app = express();

// ✅ Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://consultant-frontend-6m91.vercel.app/",
    ],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ❌ REMOVE THIS (was leaking env)
// console.log("ENV CHECK:", process.env);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});