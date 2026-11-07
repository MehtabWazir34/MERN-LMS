import { http } from "./http";

// Allowed values, same as the course model on the server.
// Forms and filters import these so the lists exist in one place only.
export const COURSE_MODES = ["Online", "Onsite", "Hybrid"];
export const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];

/* PUBLIC BROWSING */

export const getAllCourses = async (config = {}) => {
  const res = await http.get("/course", config);
  return res.data; // { success, count, courses } - active courses only, each with seatsLeft
};

export const getCourseById = async (id, config = {}) => {
  const res = await http.get(`/course/${id}`, config);
  return res.data; // { success, course }
};

/* MANAGEMENT LISTS (instructor / admin) */

// Instructor: own courses, active and inactive. Admin: all courses, or one
// instructor's with { instructor: id }. Each course has approvedCount,
// pendingCount, seatsLeft and videosCount; no videos or learner list.
export const getManagedCourses = async (params = {}, config = {}) => {
  const res = await http.get("/course/manage", { ...config, params });
  return res.data; // { success, count, courses }
};

/* LEARNER */

export const requestEnroll = async (id, { contactNumber, address }) => {
  const res = await http.post(`/course/${id}/enroll`, { contactNumber, address });
  return res.data;
};

export const getMyEnrollments = async (config = {}) => {
  const res = await http.get("/course/my-enrollments", config);
  return res.data; // { success, count, enrollments: [{ course, status }] }
};

/* COURSE CRUD (create: instructor only; update/delete: owner or admin) */

// Arrays are sent as JSON strings (the server parses them), booleans as
// "true"/"false", and empty or missing values are left out.
const buildFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    if (value === "") return;
    formData.append(key, value);
  });
  return formData;
};

// No Content-Type header on purpose: for FormData, axios must set it itself
// (with the multipart boundary), and setting it by hand breaks the upload.

/**
 * @param {object} data {
 *   title, subtitle, overview, mode, category, duration, level, seats,
 *   price?, isActive?, technologies: string[], curriculum: string[],
 *   picture: File
 * }
 */
export const createCourse = async (data) => {
  const res = await http.post("/course", buildFormData(data),{
    headers:{"Content-Type": "multipart/form-data"}
  });
  return res.data; // { success, msg, course }
};

// Send only what changed. Without `picture` the current image stays.
export const updateCourse = async (id, data) => {
  const res = await http.patch(`/course/${id}`, buildFormData(data),{
    headers:{"Content-Type":"multipart/form-data"}
  });
  return res.data; // { success, msg, course }
};

export const deleteCourse = async (id) => {
  const res = await http.delete(`/course/${id}`);
  return res.data;
};

/* LECTURE VIDEOS (owner or admin) */

// Video uploads can be large and slow: no timeout, and callers may pass
// { onUploadProgress } in `config` to show a progress bar.
/**
 * @param {object} data { title, description, duration?, lectureNumber?, video: File }
 */
export const addLectureVideo = async (courseId, data, config = {}) => {
  const res = await http.post(`/course/${courseId}/videos`, buildFormData(data), { timeout: 0, ...config });
  return res.data; // { success, msg, course }
};

// `video` is optional here; without it the existing file stays.
export const updateLectureVideo = async (courseId, videoId, data, config = {}) => {
  const res = await http.patch(`/course/${courseId}/videos/${videoId}`, buildFormData(data), { timeout: 0, ...config });
  return res.data; // { success, msg, course }
};

export const deleteLectureVideo = async (courseId, videoId) => {
  const res = await http.delete(`/course/${courseId}/videos/${videoId}`);
  return res.data; // { success, msg, course }
};

/* ENROLLMENT MANAGEMENT (owner or admin) */

export const getEnrollmentRequests = async (courseId, config = {}) => {
  const res = await http.get(`/course/${courseId}/enroll`, config);
  return res.data; // { success, enrolledLearners }
};

export const respondToEnrollment = async (courseId, enrollmentId, decision) => {
  const res = await http.patch(`/course/${courseId}/enroll/${enrollmentId}`, { decision });
  return res.data; // { success, msg }
};