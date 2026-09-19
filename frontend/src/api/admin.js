import { http } from "./http";

export const getAllInstructors = async (config = {}) => {
  const res = await http.get("/admin/instructors", config);
  return res.data; // { success, count, instructors }
};

// Only name/about/verifiedStatus are accepted by updateInstructorByAdmin —
// role, password, email, authMethod are intentionally locked server-side.
export const updateInstructor = async (id, data) => {
  const res = await http.patch(`/admin/instructors/${id}`, data);
  return res.data; // { success, msg, instructor }
};

export const deleteInstructor = async (id) => {
  const res = await http.delete(`/admin/instructors/${id}`);
  return res.data; // { success, msg, orphanedCourses } — courses aren't cascade-deleted
};

export const getAllLearners = async (config = {}) => {
  const res = await http.get("/admin/learners", config);
  return res.data; // { success, count, learners }
};

// Only name/pic/verifiedStatus accepted by updateLearnerByAdmin.
export const updateLearner = async (id, data) => {
  const res = await http.patch(`/admin/learners/${id}`, data);
  return res.data; // { success, msg, learner }
};

export const deleteLearner = async (id) => {
  const res = await http.delete(`/admin/learners/${id}`);
  return res.data; // { success, msg }
};

export const getAllAdmins = async (config = {}) => {
  const res = await http.get("/admin/admins", config);
  return res.data; // { success, count, admins }
};

// Backend also refuses self-delete and refuses deleting the last
// remaining admin — this is not the only enforcement, just the earliest
// UX surface for the same two rules.
export const deleteAdmin = async (id) => {
  const res = await http.delete(`/admin/admins/${id}`);
  return res.data; // { success, msg }
};