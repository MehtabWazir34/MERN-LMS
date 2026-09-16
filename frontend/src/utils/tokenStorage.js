// Deliberately NOT AuthContext yet — that's the next phase. This is just
// the storage primitive the axios interceptor and the auth pages need
// right now so a logged-in user's token survives a page refresh.
const TOKEN_KEY = "lms_token";
const USER_KEY = "lms_user";

export const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};