import express from "express";

import {
  getAllBookings,
  cancelBooking,
} from "../controllers/adminController.js";

const router = express.Router();


// ✅ GET BOOKINGS
router.get(
  "/bookings",
  getAllBookings
);


// ✅ CANCEL BOOKING
router.delete(
  "/bookings/:id",
  cancelBooking
);

export default router;