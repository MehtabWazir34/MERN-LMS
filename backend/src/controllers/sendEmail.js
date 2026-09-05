import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Requires: npm i nodemailer
// Requires these keys added to config/env.js (see .env.example):
// smtpHost, smtpPort, smtpUser, smtpPass, clientURL

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: Number(env.smtpPort) === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

export const sendVerificationEmail = async (to, name, verifyLink) => {
  await transporter.sendMail({
    from: `"LMS" <${env.smtpUser}>`,
    to,
    subject: "Verify your email — LMS",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Hi ${name},</h2>
        <p>Thanks for signing up. Please verify your email address to activate your account.</p>
        <p>
          <a href="${verifyLink}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
            Verify Email
          </a>
        </p>
        <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
      </div>
    `
  });
};
