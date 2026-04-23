const nodemailer = require("nodemailer");

// ==========================================
// CREATE TRANSPORTER (Hostinger SMTP)
// ==========================================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================================
// SEND VERIFICATION EMAIL
// ==========================================
const sendVerificationEmail = async ({ to, name, token }) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify your Driveodi account",
    html: `
      <h2>Welcome to Driveodi, ${name}</h2>
      <p>Please verify your email to activate your account.</p>
      <a href="${verificationUrl}" style="padding:10px 20px;background:#2f3e2f;color:white;border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p>If the button doesn't work:</p>
      <p>${verificationUrl}</p>
    `,
  });
};

module.exports = { sendVerificationEmail };