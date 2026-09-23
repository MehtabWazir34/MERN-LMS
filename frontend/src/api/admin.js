import { http } from "./http";

const buildFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });
  return formData;
};

export const getAllInstructors = async (config = {}) => {
  const res = await http.get("/admin/instructors", config);
  return res.data; // { success, count, instructors }
};

// name/about/contactNumber/address/verifiedStatus/pic accepted by
// updateInstructorByAdmin — role, password, email, authMethod are
// intentionally locked server-side. Multipart since pic is a File.
export const updateInstructor = async (id, data) => {
  const formData = buildFormData(data);
  const res = await http.patch(`/admin/instructors/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

// name/contactNumber/address/verifiedStatus/pic accepted by updateLearnerByAdmin.
export const updateLearner = async (id, data) => {
  const formData = buildFormData(data);
  const res = await http.patch(`/admin/learners/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

// Requires the getLearnerAttendanceByAdmin/getLearnerResultsByAdmin
// additions pasted into adminCtrls.js + adminRoutes.js.
export const getLearnerAttendance = async (learnerId, config = {}) => {
  const res = await http.get(`/admin/learners/${learnerId}/attendance`, config);
  return res.data; // { success, count, records }
};

export const getLearnerResults = async (learnerId, config = {}) => {
  const res = await http.get(`/admin/learners/${learnerId}/results`, config);
  return res.data; // { success, count, results }
};