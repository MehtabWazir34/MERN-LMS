import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { learnerModel } from "../models/learnerModel.js";
import { generateAuthToken, generateEmailVerifyToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import { makeVerifyEmailHandler } from "../utils/verifyEmailHandler.js";
import { isEmailTaken } from "../utils/checkEmailUnique.js";

const googleClient = new OAuth2Client(env.googleClientID);

export const registerLearner = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ success: false, msg: "Name, email and password are required" });
    }

    if (await isEmailTaken(email)) {
      return res.status(409).json({ success: false, msg: "This email is already registered on the platform" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const learner = new learnerModel({ name, email, password: hashPassword });
    await learner.save();

    const verifyToken = generateEmailVerifyToken(learner._id, "learner");
    await sendVerificationEmail(learner.email, learner.name, `${env.clientUrl}/verify-email?token=${verifyToken}`);

    const token = generateAuthToken(learner._id, "learner");
    learner.password = undefined;

    res.status(201).json({
      success: true,
      msg: "Registered! Please check your email to verify your account.",
      token,
      learner
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to register learner", ERR: error.message });
  }
};

export const verifyLearnerEmail = makeVerifyEmailHandler(learnerModel, "learner");

export const resendLearnerVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "Email is required" });

    const learner = await learnerModel.findOne({ email });
    if (!learner) return res.status(404).json({ success: false, msg: "No learner found with this email" });
    if (learner.verifiedStatus) return res.status(200).json({ success: true, msg: "Email is already verified" });

    const verifyToken = generateEmailVerifyToken(learner._id, "learner");
    await sendVerificationEmail(learner.email, learner.name, `${env.clientUrl}/verify-email?token=${verifyToken}`);

    res.status(200).json({ success: true, msg: "Verification email resent!" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to resend verification email", ERR: error.message });
  }
};

export const loginLearner = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: "Email and password are required" });
    }

    const learner = await learnerModel.findOne({ email }).select("+password");
    if (!learner) {
      return res.status(404).json({ success: false, msg: "No learner found with this email" });
    }

    if (learner.authMethod === "google") {
      return res.status(400).json({ success: false, msg: "This account uses Google sign-in, please continue with Google" });
    }

    const isPasswordMatch = await bcrypt.compare(password, learner.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, msg: "Incorrect password" });
    }

    if (!learner.verifiedStatus) {
      return res.status(403).json({ success: false, msg: "Please verify your email before logging in" });
    }

    const token = generateAuthToken(learner._id, "learner");
    learner.password = undefined;

    res.status(200).json({ success: true, msg: "Logged in!", token, learner });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to login learner", ERR: error.message });
  }
};

export const googleAuthLearner = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, msg: "idToken is required" });

    const googleTicket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientID });
    const { email, name, picture, sub: googleAuthId, email_verified } = googleTicket.getPayload();

    if (!email_verified) {
      return res.status(400).json({ success: false, msg: "Google account email is not verified" });
    }

    let learner = await learnerModel.findOne({ email });

    if (learner) {
      if (learner.authMethod !== "google") {
        return res.status(400).json({ success: false, msg: "This email is registered with a password, please login with password" });
      }
      const token = generateAuthToken(learner._id, "learner");
      return res.status(200).json({ success: true, msg: "Logged in with Google!", token, learner });
    }

    if (await isEmailTaken(email)) {
      return res.status(409).json({ success: false, msg: "This email is already registered on the platform" });
    }

    learner = new learnerModel({
      name, email,
      pic: picture || "",
      authMethod: "google",
      verifiedStatus: true,
      googleAuthId
    });
    await learner.save();

    const token = generateAuthToken(learner._id, "learner");
    res.status(201).json({ success: true, msg: "Registered with Google!", token, learner });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed Google auth for learner", ERR: error.message });
  }
};

export const logoutLearner = async (req, res) => {
  res.status(200).json({ success: true, msg: "Logged out!" });
};

/* ============================================================
   LEARNER SELF-SERVICE
   ============================================================ */

export const getMyEnrolledCourses = async (req, res) => {
  try {
    const learner = await learnerModel
      .findById(req.user.id)
      .populate("enrolledCourses", "title description poster price instructor");

    if (!learner) return res.status(404).json({ success: false, msg: "Learner not found" });

    res.status(200).json({ success: true, courses: learner.enrolledCourses });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch your courses", ERR: error.message });
  }
};
