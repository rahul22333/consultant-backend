// controllers/slotController.js

import db from "../config/firebase.js";


// ✅ GENERATE DYNAMIC SLOTS
const generateTimeSlots = (
  startHour = 16,
  startMinute = 30,
  endHour = 21,
  interval = 30
) => {

  const slots = [];

  const start = new Date();

  start.setHours(startHour);
  start.setMinutes(startMinute);
  start.setSeconds(0);

  const end = new Date();

  end.setHours(endHour);
  end.setMinutes(0);
  end.setSeconds(0);

  while (start < end) {

    const formatted = start.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );

    slots.push(formatted);

    start.setMinutes(
      start.getMinutes() + interval
    );
  }

  return slots;
};


// ✅ GET SLOTS
export const getSlotsByDate = async (req, res) => {

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