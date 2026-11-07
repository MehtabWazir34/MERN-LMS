import mongoose from "mongoose";
import { coursesModel } from "../models/courses.js";

// GET /course/manage
// Instructor: their own courses, active and inactive.
// Admin: every course, or only one instructor's with ?instructor=<id>.
// Each course carries the numbers a dashboard card needs; the lecture videos
// and the learner list themselves are not sent.
export const getManagedCourses = async (req, res) => {
    try {
        const filter = {};

        if (req.user.role === "instructor") {
            filter.instructor = req.user.id;
        } else if (req.query.instructor) {
            if (!mongoose.isValidObjectId(req.query.instructor)) {
                return res.status(400).json({ success: false, msg: "Invalid instructor id" });
            }
            filter.instructor = req.query.instructor;
        }

        const docs = await coursesModel
            .find(filter)
            .populate("instructor", "name pic email")
            .sort({ createdAt: -1 });

        const courses = docs.map((doc) => {
            const course = doc.toObject();
            const approvedCount = doc.enrolledLearners.filter((e) => e.status === "approved").length;
            const pendingCount = doc.enrolledLearners.filter((e) => e.status === "pending").length;

            course.approvedCount = approvedCount;
            course.pendingCount = pendingCount;
            course.seatsLeft = Math.max(0, course.seats - approvedCount);
            course.videosCount = doc.videos.length;

            delete course.videos;
            delete course.enrolledLearners;
            delete course.__v;
            return course;
        });

        res.status(200).json({ success: true, count: courses.length, courses });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to fetch courses", ERR: error.message });
    }
};