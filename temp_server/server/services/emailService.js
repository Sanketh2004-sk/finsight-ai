// ============================================================
// services/emailService.js — Email via Nodemailer
// Sends password reset emails and monthly reports
// ============================================================

const nodemailer = require("nodemailer");

// Create a reusable Nodemailer transporter
// Uses Gmail SMTP — configure via .env
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // false = TLS (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail: use App Password, not regular password
    },
  });
};

/**
 * sendPasswordResetEmail — Sends a reset link to the user
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} resetToken - One-time reset token
 */
const sendPasswordResetEmail = async (email, name, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "AiXpense <noreply@aixpense.com>",
    to: email,
    subject: "🔐 Reset Your AiXpense Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <h1 style="color: #6366f1; font-size: 28px; margin-bottom: 8px;">AiXpense</h1>
        <h2 style="color: #e2e8f0; font-size: 20px;">Reset Your Password</h2>
        <p style="color: #94a3b8;">Hi ${name},</p>
        <p style="color: #94a3b8;">We received a request to reset your AiXpense password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Reset Password</a>
        <p style="color: #64748b; font-size: 14px;">This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>
        <p style="color: #64748b; font-size: 12px;">Or copy this URL: ${resetUrl}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * sendMonthlyReport — Emails the monthly PDF report to user
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} period - e.g. "June 2025"
 */
const sendMonthlyReport = async (email, name, pdfBuffer, period) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || "AiXpense <noreply@aixpense.com>",
    to: email,
    subject: `📊 Your AiXpense Monthly Report — ${period}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <h1 style="color: #6366f1;">AiXpense Monthly Report</h1>
        <p style="color: #94a3b8;">Hi ${name},</p>
        <p style="color: #94a3b8;">Your financial report for <strong style="color: #e2e8f0;">${period}</strong> is attached. Open it to see your complete income, expenses, and spending insights.</p>
        <p style="color: #64748b; font-size: 13px;">Log in to your dashboard for interactive charts and AI-powered insights.</p>
      </div>
    `,
    attachments: [
      {
        filename: `AiXpense_Report_${period.replace(" ", "_")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

/**
 * sendNotificationEmail — General notification email
 */
const sendNotificationEmail = async (email, name, subject, htmlContent) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "AiXpense <noreply@aixpense.com>",
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <h1 style="color: #6366f1;">AiXpense</h1>
        <p style="color: #94a3b8;">Hi ${name},</p>
        ${htmlContent}
      </div>
    `,
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendMonthlyReport,
  sendNotificationEmail,
};
