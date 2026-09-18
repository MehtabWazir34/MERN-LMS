import { http } from "./http";

export const markAttendance = async ({ subject, learner, date, attendanceStatus }) => {
  const res = await http.post("/attendance", { subject, learner, date, attendanceStatus });
  return res.data; // { success, msg, record }
};

export const updateAttendance = async (id, attendanceStatus) => {
  const res = await http.patch(`/attendance/${id}`, { attendanceStatus });
  return res.data; // { success, msg, record }
};

export const getCourseAttendance = async (courseId, config = {}) => {
  const res = await http.get(`/attendance/course/${courseId}`, config);
  return res.data; // { success, count, records }
};

export const getMyAttendance = async (courseId, config = {}) => {
  const res = await http.get("/attendance/me", {
    ...config,
    params: courseId ? { courseId } : undefined,
  });
  return res.data; // { success, count, records }
};