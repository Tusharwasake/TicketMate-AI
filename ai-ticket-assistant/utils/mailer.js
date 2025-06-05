import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


export const sendMail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: parseInt(process.env.MAILTRAP_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: '"Inngest TMS" <no-reply@inngest-app.com>',
      to,
      subject,
      text,
      html: `<p>${text}</p>`, 
    });

    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Mail Error:", error.message);
    throw error;
  }
};
