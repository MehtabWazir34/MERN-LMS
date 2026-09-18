import { http } from "./http";

export const addResult = async ({ subject, learner, resultTitle, obtainedMarks, totalMarks }) => {
  const res = await http.post("/result", { subject, learner, resultTitle, obtainedMarks, totalMarks });
  return res.data; // { success, msg, result }
};

export const updateResult = async (id, { obtainedMarks, totalMarks }) => {
  const res = await http.patch(`/result/${id}`, { obtainedMarks, totalMarks });
  return res.data; // { success, msg, result }
};

export const getCourseResults = async (courseId, config = {}) => {
  const res = await http.get(`/result/course/${courseId}`, config);
  return res.data; // { success, count, results }
};

export const getMyResults = async (courseId, config = {}) => {
  const res = await http.get("/result/me", {
    ...config,
    params: courseId ? { courseId } : undefined,
  });
  return res.data; // { success, count, results }
};