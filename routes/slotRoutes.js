// routes/slotRoutes.js

import express from "express";

import {
  getSlotsByDate,
  lockSlot,
  unlockSlot,
  getPublicPrice,
} from "../controllers/slotController.js";

const router = express.Router();

router.get("/", getSlotsByDate);
router.get("/price", getPublicPrice);

// 🔒 LOCK SLOT
router.post("/lock", lockSlot);
router.post(
  "/unlock",
  unlockSlot
);

export default router;