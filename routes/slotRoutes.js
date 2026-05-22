// routes/slotRoutes.js
// routes/slotRoutes.js

import express from "express";

import {
  getSlotsByDate,
  lockSlot,
  unlockSlot ,
} from "../controllers/slotController.js";

const router = express.Router();

router.get("/", getSlotsByDate);

// 🔒 LOCK SLOT
router.post("/lock", lockSlot);
router.post(
  "/unlock",
  unlockSlot
);

export default router;