import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authCheck = async (req, res, next) => {
  try {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, msg: "No token provided, please login" });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, msg: "Token not found, please login" });
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    // Email-verification tokens are single-purpose (see utils/verifyEmailHandler.js)
    // and must never be accepted here as a login session token.
    if (decoded.purpose) {
      return res.status(401).json({ success: false, msg: "Invalid session token" });
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      msg: "Invalid or expired token, please login again",
      ERR: error.message
    });
  }
};

/**
 * Role-based route guard. Always use AFTER authCheck.
 * Example: router.delete("/instructor/:id", authCheck, restrictTo("admin"), deleteInstructorByAdmin)
 */
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: "You do not have permission to perform this action"
      });
    }
    next();
  };
};
