import express from "express";

import {
  getAllBookings,
  cancelBooking,
  getSettings,
  updateSettings,
} from "../controllers/adminController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();


// ✅ GET BOOKINGS
router.get(
  "/bookings",
  verifyAdmin,
  getAllBookings
);


// ✅ CANCEL BOOKING
router.delete(
  "/bookings/:id",
  verifyAdmin,
  cancelBooking
);

// ✅ GET SETTINGS
router.get(
  "/settings",
  verifyAdmin,
  getSettings
);

// ✅ UPDATE SETTINGS
router.post(
  "/settings",
  verifyAdmin,
  updateSettings
);

export default router;