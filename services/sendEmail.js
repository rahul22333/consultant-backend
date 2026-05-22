import nodemailer from "nodemailer";

const transporter =
  nodemailer.createTransport({

    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,

      pass: process.env.EMAIL_PASS,
    },
  });


// ✅ SEND BOOKING EMAIL
export const sendBookingEmails =
  async ({
    name,
    contact,
    date,
    time,
    paymentId,
  }) => {

    try {

      // ✅ USER EMAIL
      const userMail = {

        from: process.env.EMAIL_USER,

        to: contact,

        subject:
          "Consultation Booking Confirmed",

        html: `
          <h2>Booking Confirmed 🎉</h2>

          <p>Hello ${name},</p>

          <p>Your consultation has been booked successfully.</p>

          <hr />

          <p><strong>Date:</strong> ${date}</p>

          <p><strong>Time:</strong> ${time}</p>

          <p><strong>Payment ID:</strong> ${paymentId}</p>

          <hr />

          <p>Thank you.</p>
        `,
      };

      // ✅ DOCTOR EMAIL
      const doctorMail = {

        from: process.env.EMAIL_USER,

        to: process.env.DOCTOR_EMAIL,

        subject:
          "New Consultation Booking",

        html: `
          <h2>New Booking Received</h2>

          <p><strong>Name:</strong> ${name}</p>

          <p><strong>Contact:</strong> ${contact}</p>

          <p><strong>Date:</strong> ${date}</p>

          <p><strong>Time:</strong> ${time}</p>

          <p><strong>Payment ID:</strong> ${paymentId}</p>
        `,
      };

      // ✅ SEND BOTH
      await transporter.sendMail(
        userMail
      );

      await transporter.sendMail(
        doctorMail
      );

      console.log(
        "Emails sent successfully"
      );

    } catch (error) {

      console.error(
        "Email Error:",
        error
      );
    }
  };