import mongoose from "mongoose";
import { coursesModel } from "../models/courses.js";
import projectModel from "../models/projects.js";
import policyModel from "../models/policies.js";
import { handleERR } from "../utils/uploadHelpers.js";

/* Public, read-only endpoints for the company site.
   Services, projects, policies and team reuse their own public handlers
   (serviceCtrls / projectCtrls / policyCtrls / teamCtrls); only the pieces
   that need a different shape than the LMS live here. */

const approvedCount = (course) =>
    course.enrolledLearners.filter((e) => e.status === "approved").length;

// Public course shape: no instructor, no lecture videos, no learner data.
// seatsLeft replaces the enrollment list.
const toPublicCourse = (doc) => {
    const course = doc.toObject();
    course.seatsLeft = Math.max(0, course.seats - approvedCount(doc));
    delete course.instructor;
    delete course.videos;
    delete course.enrolledLearners;
    delete course.__v;
    return course;
};

export const getPublicCourses = async (req, res) => {
    try {
        const docs = await coursesModel
            .find({ isActive: true })
            .select("-videos")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            msg: "Courses received",
            count: docs.length,
            courses: docs.map(toPublicCourse),
        });
    } catch (error) {
        handleERR(res, error, "Unable to get courses");
    }
};

export const getPublicCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, msg: "Invalid course id" });
        }

        const doc = await coursesModel.findOne({ _id: id, isActive: true }).select("-videos");
        if (!doc) return res.status(404).json({ success: false, msg: "Course not found" });

        res.status(200).json({ success: true, msg: "Course found", course: toPublicCourse(doc) });
    } catch (error) {
        handleERR(res, error, "Unable to get course");
    }
};

// Data for the company site's sitemap: only the identifiers and last-modified
// times of active pages. The company site builds the URLs itself.
export const getSitemapData = async (req, res) => {
    try {
        const [courses, projects, policies] = await Promise.all([
            coursesModel.find({ isActive: true }).select("_id updatedAt").lean(),
            projectModel.find({ isActive: true }).select("slug updatedAt").lean(),
            policyModel.find({ isActive: true }).select("slug effectiveDate updatedAt").lean(),
        ]);

        res.status(200).json({ success: true, msg: "Sitemap data received", courses, projects, policies });
    } catch (error) {
        handleERR(res, error, "Unable to get sitemap data");
    }
};