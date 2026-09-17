import axios from "axios";
import { getToken, clearSession } from "../utils/tokenStorage";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/lms",
  headers: { "Content-Type": "application/json" },
});

// authCheck.js reads req.headers["authorization"] as "Bearer <token>" —
// it does not read a cookie, so this interceptor (not withCredentials)
// is what actually authenticates every protected request.
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// This is where the "no /me verification on load" decision actually gets
// enforced: an expired/invalid token isn't caught until the first real
// protected request 401s, at which point we force a clean logout.
// Guarded on "a token was actually attached" so a plain wrong-password
// 401 from /login (no Authorization header sent) doesn't trigger this —
// that's just a failed login attempt, not a dead session.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) {
      clearSession();
      if (window.location.pathname !== "/signin") {
        window.location.assign("/signin");
      }
    }
    return Promise.reject(error);
  }
);