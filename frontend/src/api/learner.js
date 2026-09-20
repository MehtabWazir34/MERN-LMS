import { http } from "./http.js";

export const getMyEnrolledCourses = async (config = {}) => {
  const res = await http.get("/learner/my-courses", config);
  console.log("Data:", res.data);
  console.log("conf:", config);
  
  return res.data; // { success, courses } — courses are NOT instructor-populated here
};