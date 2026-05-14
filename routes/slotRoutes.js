// routes/slotRoutes.js
// routes/slotRoutes.js

import express from "express";

import {
  getSlotsByDate,
  lockSlot,
} from "../controllers/slotController.js";

const router = express.Router();

router.get("/", getSlotsByDate);

// 🔒 LOCK SLOT
router.post("/lock", lockSlot);

export default router;