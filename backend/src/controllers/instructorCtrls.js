import bcrypt from "bcryptjs";
import { OAuth2Client } from 'google-auth-library';
import { env } from "../config/env.js";
import { instructorModel } from "../models/instructorModel.js";
import { uploadToCloudinary } from "../config/uploadToCloudinary.js";
import { generateAuthToken, generateEmailVerifyToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import { makeVerifyEmailHandler } from "../utils/verifyEmailHandler.js";
import { isEmailTaken } from "../utils/checkEmailUnique.js";

// Note: course/lecture CRUD, enrollment approval, marking attendance and
// adding results are NOT here — they live in courseCtrls.js,
// attendanceCtrls.js and resultCtrls.js, shared with admin's override
// path via the same canManageCourse() ownership check. This file is auth
// only, matching adminCtrls.js and learnerCtrls.js.

const googleClient = new OAuth2Client(env.googleClientID);

export const registerInstructor = async (req, res) => {
  try {
    const { name, email, password, about } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, msg: "Name, email and password are required" });
    }

    if (await isEmailTaken(email)) {
      return res.status(409).json({ success: false, msg: "This email is already registered on the platform" });
    }

    let pic = "";
    if (req.file) {
      pic = await uploadToCloudinary(req.file.path, "profile-pics");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const instructor = new instructorModel({ name, email, password: hashPassword, about, pic });
    await instructor.save();

    const verifyToken = generateEmailVerifyToken(instructor._id, "instructor");
    await sendVerificationEmail(instructor.email, instructor.name, `${env.clientUrl}/verify-email?token=${verifyToken}`);

    const token = generateAuthToken(instructor._id, "instructor");
    instructor.password = undefined;

    res.status(201).json({
      success: true,
      msg: "Instructor registered! Please check your email to verify your account.",
      token,
      instructor
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to register instructor", ERR: error.message });
  }
};

export const verifyInstructorEmail = makeVerifyEmailHandler(instructorModel, "instructor");

export const resendInstructorVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "Email is required" });

    const instructor = await instructorModel.findOne({ email });
    if (!instructor) return res.status(404).json({ success: false, msg: "No instructor found with this email" });
    if (instructor.verifiedStatus) return res.status(200).json({ success: true, msg: "Email is already verified" });

    const verifyToken = generateEmailVerifyToken(instructor._id, "instructor");
    await sendVerificationEmail(instructor.email, instructor.name, `${env.clientUrl}/verify-email?token=${verifyToken}`);

    res.status(200).json({ success: true, msg: "Verification email resent!" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to resend verification email", ERR: error.message });
  }
};

export const loginInstructor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: "Email and password are required" });
    }

    const instructor = await instructorModel.findOne({ email }).select("+password");
    if (!instructor) {
      return res.status(404).json({ success: false, msg: "No instructor found, please register first" });
    }

    if (instructor.authMethod === "google") {
      return res.status(400).json({ success: false, msg: "This account uses Google sign-in, please continue with Google" });
    }

    const isCorrectPassword = await bcrypt.compare(password, instructor.password);
    if (!isCorrectPassword) {
      return res.status(401).json({ success: false, msg: "Incorrect password" });
    }

    if (!instructor.verifiedStatus) {
      return res.status(403).json({ success: false, msg: "Please verify your email before logging in" });
    }

    const token = generateAuthToken(instructor._id, "instructor");
    instructor.password = undefined;

    res.status(200).json({ success: true, msg: "Logged in!", token, instructor });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to login instructor", ERR: error.message });
  }
};

export const googleAuthInstructor = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, msg: "idToken is required" });

    const googleTicket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientID });
    const { email, name, picture, sub: googleAuthId, email_verified } = googleTicket.getPayload();

    if (!email_verified) {
      return res.status(400).json({ success: false, msg: "Google account email is not verified" });
    }

    let instructor = await instructorModel.findOne({ email });

    if (instructor) {
      if (instructor.authMethod !== "google") {
        return res.status(400).json({ success: false, msg: "This email is registered with a password, please login with password" });
      }
      const token = generateAuthToken(instructor._id, "instructor");
      return res.status(200).json({ success: true, msg: "Logged in with Google!", token, instructor });
    }

    if (await isEmailTaken(email)) {
      return res.status(409).json({ success: false, msg: "This email is already registered on the platform" });
    }

    instructor = new instructorModel({
      name, email,
      pic: picture || "",
      authMethod: "google",
      verifiedStatus: true,
      googleAuthId
    });
    await instructor.save();

    const token = generateAuthToken(instructor._id, "instructor");
    res.status(201).json({ success: true, msg: "Registered with Google!", token, instructor });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed Google auth for instructor", ERR: error.message });
  }
};

export const logoutInstructor = async (req, res) => {
  res.status(200).json({ success: true, msg: "Logged out!" });
};
