import { http } from "./http";

export const getAllCourses = async (config = {}) => {
  const res = await http.get("/course", config);
  return res.data; // { success, count, courses }
};

export const getCourseById = async (id, config = {}) => {
  const res = await http.get(`/course/${id}`, config);
  return res.data; // { success, course }
};

// Learner-only per restrictTo('learner') on this route — a non-learner
// calling this gets a 403 from the backend, which the caller surfaces
// via err.response.data.msg like any other error.
export const requestEnroll = async (id, { contactNumber, address }) => {
  const res = await http.post(`/course/${id}/enroll`, { contactNumber, address });
  return res.data;
};

// Requires the getMyEnrollments addition pasted into courseCtrls.js /
// courseRoutes.js (registered BEFORE the '/:id' route).
export const getMyEnrollments = async (config = {}) => {
  // const res = await http.get("/course/my-enrollments", config);
  
  // return res.data; // { success, count, enrollments }
  try {
    const res = await http.get("/course/my-enrollments", config);
    return res.data;
  } catch (error) {
    console.log("ERR:", error.message);
  }
};

// Local to this file on purpose — auth.js already has its own identical
// helper for register(); duplicating six lines here avoids touching a
// file that's already confirmed working.
const buildFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });
  return formData;
};

/**
 * Instructor-only per restrictTo('instructor', 'admin') on this route,
 * with canManageCourse enforcing ownership server-side on update/delete.
 * @param {object} data - { title, description, price, poster? }
 */
export const createCourse = async (data) => {
  const formData = buildFormData(data);
  const res = await http.post("/course", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// All fields optional here — only send what changed. Omitting `poster`
// leaves the existing one untouched (updateCourse only overwrites it
// `if (req.file)`).
export const updateCourse = async (id, data) => {
  const formData = buildFormData(data);
  const res = await http.patch(`/course/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteCourse = async (id) => {
  const res = await http.delete(`/course/${id}`);
  return res.data;
};

/**
 * Lecture videos — instructor-only (or admin override), same
 * canManageCourse ownership check as course CRUD. Multer expects the
 * file under the field name "video" (uploadVideoStorage.single('video')
 * in courseRoutes.js) — pass it as `data.video`.
 * @param {object} data - { title, description, duration?, lectureNumber?, video: File }
 */
export const addLectureVideo = async (courseId, data) => {
  const formData = buildFormData(data);
  const res = await http.post(`/course/${courseId}/videos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { success, msg, course } — course.videos has the updated array
};

// `video` in data is optional — omitting it leaves the existing file
// untouched (updateLectureVideo only overwrites it `if (req.file)`).
export const updateLectureVideo = async (courseId, videoId, data) => {
  const formData = buildFormData(data);
  const res = await http.patch(`/course/${courseId}/videos/${videoId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { success, msg, course }
};

export const deleteLectureVideo = async (courseId, videoId) => {
  const res = await http.delete(`/course/${courseId}/videos/${videoId}`);
  return res.data; // { success, msg, course }
};

/**
 * Enrollment management — instructor/admin only.
 */
export const getEnrollmentRequests = async (courseId, config = {}) => {
  const res = await http.get(`/course/${courseId}/enroll`, config);
  return res.data; // { success, enrolledLearners }
};

export const respondToEnrollment = async (courseId, enrollmentId, decision) => {
  const res = await http.patch(`/course/${courseId}/enroll/${enrollmentId}`, { decision });
  return res.data; // { success, msg }
};