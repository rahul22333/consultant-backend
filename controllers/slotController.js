// controllers/slotController.js

import db from "../config/firebase.js";


// ✅ GENERATE DYNAMIC SLOTS (24-hour strings, timezone-independent)
const generateTimeSlots = (
  startHour = 16,
  startMinute = 30,
  endHour = 21,
  interval = 30
) => {
  const slots = [];
  let hour = startHour;
  let minute = startMinute;

  while (hour < endHour || (hour === endHour && minute === 0)) {
    if (hour === endHour && minute > 0) break;
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    slots.push(`${hh}:${mm}`);

    minute += interval;
    if (minute >= 60) {
      hour += Math.floor(minute / 60);
      minute = minute % 60;
    }
  }

  return slots;
};

// ✅ GET PRICE FROM DATABASE
export const getFixedPrice = async () => {
  try {
    const snapshot = await db.ref("settings/price").once("value");
    const val = snapshot.val();
    return val ? Number(val) : 200;
  } catch (error) {
    console.error("Error fetching price from Firebase:", error);
    return 200;
  }
};

// ✅ PUBLIC GET PRICE
export const getPublicPrice = async (req, res) => {
  try {
    const price = await getFixedPrice();
    res.json({ price });
  } catch (error) {
    res.json({ price: 200 });
  }
};


// ✅ GET SLOTS
export const getSlotsByDate = async (
  req,
  res
) => {

  try {

    const { date } = req.query;

    if (!date) {

      return res.status(400).json({
        error: "Date is required",
      });
    }

    // ✅ GENERATED SLOTS
    const defaultSlots =
      generateTimeSlots();

    // ✅ BOOKINGS
    const snapshot = await db
      .ref(`slots/${date}`)
      .once("value");

    const bookings =
      snapshot.val() || {};

    // ✅ LOCKS
    const lockSnapshot = await db
      .ref(`locks/${date}`)
      .once("value");

    const locks =
      lockSnapshot.val() || {};

    const now = Date.now();

    // ✅ FINAL RESPONSE
    const formatted = defaultSlots.map(
      (time) => {

        const booking =
          bookings?.[time];

        const lock =
          locks?.[time];

        const isLocked =
          lock &&
          lock.expiresAt > now;

        return {
          time,

          isBooked:
            booking?.isBooked ||
            isLocked ||
            false,
        };
      }
    );

    res.json(formatted);

  } catch (error) {

    console.error(
      "Get Slots Error:",
      error
    );

    res.status(500).json({
      error: "Server error",
    });
  }
};


// ✅ LOCK SLOT
export const lockSlot = async (
  req,
  res
) => {

  try {

    const { date, time } =
      req.body;

    if (!date || !time) {

      return res.status(400).json({
        success: false,

        message:
          "Date and time required",
      });
    }

    const lockRef = db.ref(
      `locks/${date}/${time}`
    );

    const result =
      await lockRef.transaction(
        (current) => {

          const now = Date.now();

          // no lock OR expired
          if (
            !current ||
            current.expiresAt < now
          ) {

            return {
              expiresAt:
                now + 5 * 60 * 1000,
            };
          }

          return;
        }
      );

    if (!result.committed) {

      return res.status(400).json({
        success: false,

        message:
          "Slot already locked",
      });
    }

    res.json({
      success: true,

      message: "Slot locked",
    });

  } catch (error) {

    console.error(
      "Lock Slot Error:",
      error
    );

    res.status(500).json({
      success: false,

      message: "Server error",
    });
  }
};


// ✅ UNLOCK SLOT
export const unlockSlot = async (
  req,
  res
) => {

  try {

    const { date, time } =
      req.body;

    if (!date || !time) {

      return res.status(400).json({
        success: false,

        message:
          "Date and time required",
      });
    }

    await db
      .ref(`locks/${date}/${time}`)
      .remove();

    res.json({
      success: true,

      message: "Slot unlocked",
    });

  } catch (error) {

    console.error(
      "Unlock Slot Error:",
      error
    );

    res.status(500).json({
      success: false,

      message: "Server error",
    });
  }
};


// ✅ PURGE EXPIRED LOCKS FROM DATABASE
export const purgeExpiredLocks = async () => {
  try {
    const locksRef = db.ref("locks");
    const snapshot = await locksRef.once("value");
    const dates = snapshot.val();
    if (!dates) return;

    const now = Date.now();
    const updates = {};

    for (const date in dates) {
      const slots = dates[date];
      for (const time in slots) {
        const lock = slots[time];
        if (lock && lock.expiresAt < now) {
          updates[`${date}/${time}`] = null;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await locksRef.update(updates);
      console.log(`[Firebase Cleanup] Purged ${Object.keys(updates).length} expired locks.`);
    }
  } catch (error) {
    console.error("Purge Expired Locks Error:", error);
  }
};
