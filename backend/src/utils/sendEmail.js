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
    from: `"LMS" <${env.smtpFrom ?? "no-reply@lms.test"}>`,
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
export const sendEnrollmentRequestEmail = async (to, instructorName, learnerName, courseTitle, url) => {
  await transporter.sendMail({
    from: `"LMS" <${env.smtpFrom ?? "no-reply@lms.test"}>`,
    to,
    subject: `New enrollment request — ${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Hi ${instructorName},</h2>
        <p><strong>${learnerName}</strong> has requested to enroll in your course "<strong>${courseTitle}</strong>".</p>
        <p>
          <a href="${url}" style="background:#2C5F4F;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
            Review request
          </a>
        </p>
      </div>
    `
  });
};

export const sendEnrollmentDecisionEmail = async (to, learnerName, courseTitle, decision, url) => {
  const isApproved = decision === "approved";
  await transporter.sendMail({
    from: `"LMS" <${env.smtpFrom ?? "no-reply@lms.test"}>`,
    to,
    subject: `Your enrollment request was ${decision} — ${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Hi ${learnerName},</h2>
        <p>Your request to enroll in "<strong>${courseTitle}</strong>" has been <strong>${isApproved ? "approved" : "rejected"}</strong>.</p>
        ${isApproved ? "<p>You can now access the course content.</p>" : "<p>You're welcome to browse other courses.</p>"}
        <p>
          <a href="${url}" style="background:#2C5F4F;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
            ${isApproved ? "Go to course" : "Browse courses"}
          </a>
        </p>
      </div>
    `
  });
};