import { http } from "./http";

export const getAllCourses = async () => {
  const res = await http.get("/course");
  return res.data; // { success, count, courses }
};

export const getCourseById = async (id) => {
  const res = await http.get(`/course/${id}`);
  return res.data; // { success, course }
};

// Learner-only per restrictTo('learner') on this route — a non-learner
// calling this gets a 403 from the backend, which the caller surfaces
// via err.response.data.msg like any other error.
export const requestEnroll = async (id) => {
  const res = await http.post(`/course/${id}/enroll`);
  return res.data;
};