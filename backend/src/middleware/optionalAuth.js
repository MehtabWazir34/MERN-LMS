import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Unlike authCheck, this NEVER blocks the request. If a valid Bearer
 * token is present, req.user gets set (so controllers like getCourseById
 * can show full content to an enrolled learner). If there's no token, or
 * it's invalid/expired, the request just continues as a guest — used on
 * public browsing routes (course listing, course detail) that behave
 * differently for logged-in users without requiring login.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) return next();

    const token = header.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.purpose) return next(); // ignore verification tokens here too

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    // invalid/expired token on a public route -> just treat as guest
    next();
  }
};
