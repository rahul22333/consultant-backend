import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

// ✅ EMAIL CHECK
const isEmail = (value) => {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
};


const formatTimeTo12Hour = (time24) => {
  if (!time24 || !time24.includes(":")) return time24;
  const [hoursStr, minutesStr] = time24.split(":");
  const hours = parseInt(hoursStr, 10);
  const modifier = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const formattedHours = String(displayHours).padStart(2, "0");
  return `${formattedHours}:${minutesStr} ${modifier}`;
};

// ✅ SEND BOOKING EMAILS
export const sendBookingEmails =
  async ({
    name,
    contact,
    date,
    time,
    paymentId,
  }) => {

    try {
      const formattedTime = formatTimeTo12Hour(time);

      // ✅ USER EMAIL
      if (isEmail(contact)) {

        await resend.emails.send({

          from:
            "Consultation <onboarding@resend.dev>",

          to: contact,

          subject:
            "Booking Confirmed 🎉",

          html: `
            <h2>Booking Confirmed</h2>

            <p>Hello ${name},</p>

            <p>Your consultation has been booked successfully.</p>

            <hr />

            <p><strong>Date:</strong> ${date}</p>

            <p><strong>Time:</strong> ${formattedTime}</p>

            <p><strong>Payment ID:</strong> ${paymentId}</p>
          `,
        });

        console.log(
          "User email sent"
        );
      }

      // ✅ DOCTOR EMAIL
      await resend.emails.send({

        from:
          "Consultation <onboarding@resend.dev>",

        to: process.env.DOCTOR_EMAIL,

        subject:
          "New Consultation Booking",

        html: `
          <h2>New Booking Received</h2>

          <p><strong>Name:</strong> ${name}</p>

          <p><strong>Contact:</strong> ${contact}</p>

          <p><strong>Date:</strong> ${date}</p>

          <p><strong>Time:</strong> ${formattedTime}</p>

          <p><strong>Payment ID:</strong> ${paymentId}</p>
        `,
      });

      console.log(
        "Doctor email sent"
      );

    } catch (error) {

      console.error(
        "Email Error:",
        error
      );
    }
  };