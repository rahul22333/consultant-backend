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