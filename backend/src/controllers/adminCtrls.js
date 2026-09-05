import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from "../config/env.js";
import { adminModel } from "../models/adminModel.js";
import { instructorModel } from "../models/instructorModel.js";
import { learnerModel } from "../models/learnerModel.js";
import { coursesModel } from "../models/courses.js";
import { uploadToCloudinary } from '../config/uploadToCloudinary.js';
import { generateAuthToken, generateEmailVerifyToken } from '../utils/generateToken.js';
import { sendVerificationEmail } from '../utils/sendEmail.js';
import { makeVerifyEmailHandler } from '../utils/verifyEmailHandler.js';
import { isEmailTaken } from '../utils/checkEmailUnique.js';

const googleClient = new OAuth2Client(env.googleClientID);

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;
    if (!name || !email || !password || !secretKey) {
      return res.status(400).json({ success: false, msg: "Name, email, password and secretKey are required" });
    }

    // --- Institute-level admin gate ---
    // Anyone who registers here becomes a full super-user, so the route is
    // locked behind a secret only the institute owner has (kept in .env,
    // never shipped to the frontend) — the same "bootstrap secret" idea
    // behind Django's createsuperuser or a WordPress first-install, adapted
    // to a public REST endpoint. A max-admin cap adds a second layer: even
    // if the secret leaks, it can't be used to mint unlimited admins.
    if (secretKey !== env.adminRegisterSecret) {
      return res.status(403).json({ success: false, msg: "Invalid admin registration key" });
    }

    const adminCount = await adminModel.countDocuments();
    if (adminCount >= env.maxAdmins) {
      return res.status(403).json({
        success: false,
        msg: "Maximum number of admin accounts reached for this institute. Ask an existing admin to review access."
      });
    }

    if (await isEmailTaken(email)) {
      return res.status(409).json({ success: false, msg: "This email is already registered on the platform" });
    }

    let pic = "";
    if (req.file) {
      pic = await uploadToCloudinary(req.file.path, "profile-pics");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const admin = new adminModel({ name, email, password: hashPassword, pic });
    await admin.save();

    const verifyToken = generateEmailVerifyToken(admin._id, "admin");
    await sendVerificationEmail(admin.email, admin.name, `${env.clientUrl}/verify-email?token=${verifyToken}`);

    const token = generateAuthToken(admin._id, "admin");
    admin.password = undefined;

    res.status(201).json({
      success: true,
      msg: "Admin registered! Please check your email to verify your account.",
      token,
      admin
    });
  } catch (error) {
    console.log({ msg: "Failed to register admin!", ERR: error.message });
    res.status(500).json({ success: false, msg: "Failed to register admin", ERR: error.message });
  }
};

export const verifyAdminEmail = makeVerifyEmailHandler(adminModel, "admin");

export const resendAdminVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "Email is required" });

    const admin = await adminModel.findOne({ email });
    if (!admin) return res.status(404).json({ success: false, msg: "No admin found with this email" });
    if (admin.verifiedStatus) return res.status(200).json({ success: true, msg: "Email is already verified" });

    const verifyToken = generateEmailVerifyToken(admin._id, "admin");
    await sendVerificationEmail(admin.email, admin.name, `${env.clientUrl}/verify-email?token=${verifyToken}`);

    res.status(200).json({ success: true, msg: "Verification email resent!" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to resend verification email", ERR: error.message });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: "Email and password are required" });
    }

    const admin = await adminModel.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(404).json({ success: false, msg: "No admin found with this email" });
    }

    if (admin.authMethod === "google") {
      return res.status(400).json({ success: false, msg: "This account uses Google sign-in, please continue with Google" });
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, msg: "Incorrect password" });
    }

    if (!admin.verifiedStatus) {
      return res.status(403).json({ success: false, msg: "Please verify your email before logging in" });
    }

    const token = generateAuthToken(admin._id, "admin");
    admin.password = undefined;

    res.status(200).json({ success: true, msg: "Admin logged in!", token, admin });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to login admin", ERR: error.message });
  }
};

export const googleAuthAdmin = async (req, res) => {
  try {
    const { idToken, secretKey } = req.body;
    if (!idToken) return res.status(400).json({ success: false, msg: "idToken is required" });

    const googleTicket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientID });
    const { email, name, picture, sub: googleAuthId, email_verified } = googleTicket.getPayload();

    if (!email_verified) {
      return res.status(400).json({ success: false, msg: "Google account email is not verified" });
    }

    let admin = await adminModel.findOne({ email });

    // Returning Google admin -> just log them in. (Old code rejected this
    // case entirely, so a Google-registered admin could never sign back in.)
    if (admin) {
      if (admin.authMethod !== "google") {
        return res.status(400).json({
          success: false,
          msg: "This email is registered with a password. Please login with your password instead."
        });
      }
      const token = generateAuthToken(admin._id, "admin");
      return res.status(200).json({ success: true, msg: "Admin logged in with Google!", token, admin });
    }

    // New admin via Google still has to pass the same institute gate as
    // manual registration — otherwise Google sign-in would be a backdoor
    // around the secret key.
    if (secretKey !== env.adminRegisterSecret) {
      return res.status(403).json({ success: false, msg: "Invalid admin registration key" });
    }
    const adminCount = await adminModel.countDocuments();
    if (adminCount >= env.maxAdmins) {
      return res.status(403).json({ success: false, msg: "Maximum number of admin accounts reached for this institute" });
    }
    if (await isEmailTaken(email)) {
      return res.status(409).json({ success: false, msg: "This email is already registered on the platform" });
    }

    admin = new adminModel({
      email, name,
      pic: picture || "",
      authMethod: "google",
      verifiedStatus: true, // direclty verified by google
      googleAuthId
    });
    await admin.save();

    const token = generateAuthToken(admin._id, "admin");
    res.status(201).json({ success: true, msg: "Admin registered with Google!", token, admin });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed Google auth for admin", ERR: error.message });
  }
};

export const logoutAdmin = async (req, res) => {
  // Stateless JWT: nothing to invalidate server-side without a token
  // blacklist / refresh-token table (deferred — MVP scope). The client
  // just discards the token. Endpoint kept so the frontend has a
  // consistent /logout call across all three roles.
  res.status(200).json({ success: true, msg: "Admin logged out!" });
};

//Instructors cruds ctrls
export const getAllInstructors = async (req, res) => {
  try {
    const instructors = await instructorModel.find().select("-password");
    res.status(200).json({ success: true, count: instructors.length, instructors });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch instructors", ERR: error.message });
  }
};

export const getInstructorById = async (req, res) => {
  try {
    const instructor = await instructorModel.findById(req.params.id).select("-password");
    if (!instructor) return res.status(404).json({ success: false, msg: "Instructor not found" });
    res.status(200).json({ success: true, instructor });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch instructor", ERR: error.message });
  }
};

export const updateInstructorByAdmin = async (req, res) => {
  try {
    // role, password, email and authMethod are intentionally NOT editable
    // here — role/auth changes deserve their own guarded flow, and this
    // is the same "never trust client-set role/verifiedStatus" principle
    // from the earlier privilege-escalation fix, just applied to admin's
    // own edit endpoint too.
    const { name, about, pic, verifiedStatus } = req.body;
    const instructor = await instructorModel.findByIdAndUpdate(
      req.params.id,
      { $set: { name, about, pic, verifiedStatus } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!instructor) return res.status(404).json({ success: false, msg: "Instructor not found" });
    res.status(200).json({ success: true, msg: "Instructor updated!", instructor });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to update instructor", ERR: error.message });
  }
};

export const deleteInstructorByAdmin = async (req, res) => {
  try {
    const instructor = await instructorModel.findByIdAndDelete(req.params.id);
    if (!instructor) return res.status(404).json({ success: false, msg: "Instructor not found" });

    // Courses are NOT cascade-deleted — removing an instructor shouldn't
    // wipe out course/attendance/result history for learners already
    // enrolled. We just flag how many courses are now orphaned so the
    // admin can decide (reassign, archive, etc).
    const orphanedCourses = await coursesModel.countDocuments({ instructor: req.params.id });

    res.status(200).json({ success: true, msg: "Instructor deleted!", orphanedCourses });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to delete instructor", ERR: error.message });
  }
};

//Learners CRUDs ctrls
export const getAllLearners = async (req, res) => {
  try {
    const learners = await learnerModel.find().select("-password");
    res.status(200).json({ success: true, count: learners.length, learners });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch learners", ERR: error.message });
  }
};

export const getLearnerById = async (req, res) => {
  try {
    const learner = await learnerModel.findById(req.params.id).select("-password");
    if (!learner) return res.status(404).json({ success: false, msg: "Learner not found" });
    res.status(200).json({ success: true, learner });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch learner", ERR: error.message });
  }
};

export const updateLearnerByAdmin = async (req, res) => {
  try {
    const { name, pic, verifiedStatus } = req.body;
    const learner = await learnerModel.findByIdAndUpdate(
      req.params.id,
      { $set: { name, pic, verifiedStatus } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!learner) return res.status(404).json({ success: false, msg: "Learner not found" });
    res.status(200).json({ success: true, msg: "Learner updated!", learner });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to update learner", ERR: error.message });
  }
};

export const deleteLearnerByAdmin = async (req, res) => {
  try {
    const learner = await learnerModel.findByIdAndDelete(req.params.id);
    if (!learner) return res.status(404).json({ success: false, msg: "Learner not found" });

    // Pull the learner out of every course's enrolledLearners list so an
    // instructor doesn't see a ghost student on their roster.
    await coursesModel.updateMany(
      { "enrolledLearners.learner": req.params.id },
      { $pull: { enrolledLearners: { learner: req.params.id } } }
    );

    res.status(200).json({ success: true, msg: "Learner deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to delete learner", ERR: error.message });
  }
};

//Admins ctrls
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await adminModel.find().select("-password");
    res.status(200).json({ success: true, count: admins.length, admins });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch admins", ERR: error.message });
  }
};

export const deleteAdminByAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, msg: "You cannot delete your own admin account" });
    }

    const totalAdmins = await adminModel.countDocuments();
    if (totalAdmins <= 1) {
      return res.status(400).json({ success: false, msg: "Cannot delete the last remaining admin" });
    }

    const admin = await adminModel.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, msg: "Admin not found" });

    res.status(200).json({ success: true, msg: "Admin removed!" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to delete admin", ERR: error.message });
  }
};
