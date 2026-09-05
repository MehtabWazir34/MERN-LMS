import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Builds a verify-email route handler for a given model + role.
 * One implementation shared across Admin/Instructor/Learner instead of
 * copy-pasting the same logic three times.
 *
 * Usage: export const verifyAdminEmail = makeVerifyEmailHandler(adminModel, "admin");
 */
export const makeVerifyEmailHandler = (model, expectedRole) => {
  return async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ success: false, msg: "Verification token missing" });
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      if (decoded.purpose !== 'email-verify' || decoded.role !== expectedRole) {
        return res.status(400).json({ success: false, msg: "Invalid verification token" });
      }

      const user = await model.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, msg: "Account not found" });
      }
      if (user.verifiedStatus) {
        return res.status(200).json({ success: true, msg: "Email already verified" });
      }

      user.verifiedStatus = true;
      await user.save();

      res.status(200).json({ success: true, msg: "Email verified successfully!" });
    } catch (error) {
      res.status(400).json({
        success: false,
        msg: "Verification link is invalid or has expired",
        ERR: error.message
      });
    }
  };
};
