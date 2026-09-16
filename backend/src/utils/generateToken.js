import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Normal login/session token. Every role embeds { id, role } so authCheck
 * can do RBAC (restrictTo) without a DB lookup on every request.
 */
export const generateAuthToken = (id, role) => {
  return jwt.sign({ id, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

/**
 * Short-lived, single-purpose token mailed to the user to verify their
 * email. `purpose` is checked by authCheck so this can never be replayed
 * as a normal session token, and by verifyEmailHandler so an admin's
 * token can't be used to verify an instructor account etc.
 */
export const generateEmailVerifyToken = (id, role) => {
  return jwt.sign({ id, role, purpose: 'email-verify' }, env.jwtSecret, { expiresIn: '1d' });
};
