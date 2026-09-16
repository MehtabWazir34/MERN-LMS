import { http } from "./http";
import { ROLES } from "../utils/roles";

// Each role's routes live at /lms/{admin,instructor,learner} with an
// identical action shape (register, verify-email, resend-verification,
// login, google-auth) — see adminRoutes.js / instructorRoutes.js /
// learnerRoutes.js. hasPic mirrors which register routes carry
// uploadImgsStorage.single('pic'); learner's does not.
const ROLE_CONFIG = {
  [ROLES.ADMIN]: { base: "/admin", hasPic: true },
  [ROLES.INSTRUCTOR]: { base: "/instructor", hasPic: true },
  [ROLES.LEARNER]: { base: "/learner", hasPic: false },
};

/**
 * @param {string} role - one of ROLES
 * @param {object} data - { name, email, password, pic?, secretKey? }
 *   `secretKey` is admin-only — checked against env.adminRegisterSecret
 *   in registerAdmin, alongside a MAX_ADMINS cap.
 */
export const register = async (role, data) => {
  const { base, hasPic } = ROLE_CONFIG[role];

  if (hasPic) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    });
    const res = await http.post(`${base}/register`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
  console.log(await http.post(`${base}/register`));
  
  const res = await http.post(`${base}/register`, data);
  return res.data;
};

export const login = async (role, { email, password }) => {
  const { base } = ROLE_CONFIG[role];
  const res = await http.post(`${base}/login`, { email, password });
  return res.data;
};

export const googleAuth = async (role, idToken) => {
  const { base } = ROLE_CONFIG[role];
  const res = await http.post(`${base}/google-auth`, { idToken });
  return res.data;
};

// role is read from the decoded token by the caller (VerifyEmailPage) —
// the emailed link itself is role-agnostic (`/verify-email?token=...`).
export const verifyEmail = async (role, token) => {
  const { base } = ROLE_CONFIG[role];
  const res = await http.get(`${base}/verify-email`, { params: { token } });
  return res.data;
};

export const resendVerification = async (role, email) => {
  const { base } = ROLE_CONFIG[role];
  const res = await http.post(`${base}/resend-verification`, { email });
  return res.data;
};