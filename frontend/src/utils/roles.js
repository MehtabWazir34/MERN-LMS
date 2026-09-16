// Values must exactly match the `role` strings the backend issues in the
// JWT payload (see generateAuthToken calls in each *Ctrls.js) — these are
// used to pick the API base path AND, once AuthContext/ProtectedRoute
// land next, to gate routes. Don't rename casually.
export const ROLES = {
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  LEARNER: "learner",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.INSTRUCTOR]: "Instructor",
  [ROLES.LEARNER]: "Learner",
};

export const ROLE_LIST = Object.values(ROLES);