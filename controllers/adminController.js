import db from "../config/firebase.js";


// ✅ GET ALL BOOKINGS
export const getAllBookings = async (
  req,
  res
) => {

  try {

    const snapshot = await db
      .ref("bookings")
      .once("value");

    const data = snapshot.val();

    if (!data) {
      return res.json([]);
    }

    const bookings = Object.keys(data).map(
      (id) => ({
        id,
        ...data[id],
      })
    );

    // newest first
    bookings.sort(
      (a, b) =>
        b.createdAt - a.createdAt
    );

    res.json(bookings);

  } catch (error) {

    console.error(
      "Get Bookings Error:",
      error
    );

    res.status(500).json({
      error: "Server error",
    });
  }
};


// ✅ CANCEL BOOKING
export const cancelBooking =
  async (req, res) => {

    try {

      const { id } = req.params;

      // get booking
      const snapshot = await db
        .ref(`bookings/${id}`)
        .once("value");

      const booking =
        snapshot.val();

      if (!booking) {

        return res.status(404).json({
          error: "Booking not found",
        });
      }

      // delete booking
      await db
        .ref(`bookings/${id}`)
        .remove();

      // free slot
      await db
        .ref(
          `slots/${booking.date}/${booking.time}`
        )
        .remove();

      res.json({
        success: true,
      });

    } catch (error) {

      console.error(
        "Cancel Booking Error:",
        error
      );

      res.status(500).json({
        error: "Server error",
      });
    }
  };


// ✅ GET SETTINGS
export const getSettings = async (req, res) => {
  try {
    const snapshot = await db.ref("settings").once("value");
    const settings = snapshot.val() || { price: 200 };
    res.json(settings);
  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// ✅ UPDATE SETTINGS
export const updateSettings = async (req, res) => {
  try {
    const { price } = req.body;
    if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: "Invalid price value" });
    }
    await db.ref("settings").update({ price: Number(price) });
    res.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};