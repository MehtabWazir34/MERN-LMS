import { coursesModel } from "../models/courses.js";
import { instructorModel } from "../models/instructorModel.js";
import { learnerModel } from "../models/learnerModel.js";
import { uploadToCloudinary } from "../config/uploadToCloudinary.js";

// True if the logged-in user owns this course, or is an admin overriding it.
const canManageCourse = (course, user) => {
  return user.role === "admin" || course.instructor.toString() === user.id;
};

/* ============================================================
   COURSE CRUD
   ============================================================ */

export const createCourse = async (req, res) => {
  try {
    const { title, description, price } = req.body;
    if (!title || !description || price === undefined) {
      return res.status(400).json({ success: false, msg: "Title, description and price are required" });
    }

    let poster = "";
    if (req.file) {
      poster = await uploadToCloudinary(req.file.path, "course-posters");
    }

    const course = new coursesModel({ title, description, price, poster, instructor: req.user.id });
    await course.save();

    await instructorModel.findByIdAndUpdate(req.user.id, { $push: { courses: course._id } });

    res.status(201).json({ success: true, msg: "Course created!", course });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to create course", ERR: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await coursesModel.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only edit your own courses" });
    }

    const { title, description, price } = req.body;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = price;
    if (req.file) course.poster = await uploadToCloudinary(req.file.path, "course-posters");

    await course.save();
    res.status(200).json({ success: true, msg: "Course updated!", course });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to update course", ERR: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await coursesModel.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only delete your own courses" });
    }

    await course.deleteOne();
    await instructorModel.findByIdAndUpdate(course.instructor, { $pull: { courses: course._id } });
    await learnerModel.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );

    res.status(200).json({ success: true, msg: "Course deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to delete course", ERR: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    // Public browsing listing — no lecture/enrollment detail, just enough
    // to decide whether to open a course. Route for this should NOT
    // require authCheck.
    const courses = await coursesModel
      .find()
      .select("-videos -enrolledLearners")
      .populate("instructor", "name pic about");

    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch courses", ERR: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await coursesModel.findById(req.params.id).populate("instructor", "name pic about");
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    // Full lecture content is only for the owning instructor, an admin,
    // or a learner with an APPROVED enrollment. Everyone else gets a
    // preview without videos — the same model Udemy/Coursera use for
    // unpurchased courses. Route can be left public; req.user may be
    // undefined for guests, which this handles gracefully.
    const courseObj = course.toObject();
    const user = req.user;
    const isOwnerOrAdmin = user && (user.role === "admin" || course.instructor._id.toString() === user.id);
    const isApprovedLearner = user && course.enrolledLearners.some(
      (e) => e.learner.toString() === user.id && e.status === "approved"
    );

    if (!isOwnerOrAdmin && !isApprovedLearner) {
      delete courseObj.videos;
      delete courseObj.enrolledLearners;
    }

    res.status(200).json({ success: true, course: courseObj });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch course", ERR: error.message });
  }
};

/* ============================================================
   LECTURE VIDEOS
   ============================================================ */

export const addLectureVideo = async (req, res) => {
  try {
    const course = await coursesModel.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only add lectures to your own courses" });
    }

    const { title, description, duration, lectureNumber } = req.body;
    if (!title || !description || !req.file) {
      return res.status(400).json({ success: false, msg: "Title, description and a video file are required" });
    }

    const url = await uploadToCloudinary(req.file.path, "course-videos");
    course.videos.push({ title, description, url, duration, lectureNumber });
    await course.save();

    res.status(201).json({ success: true, msg: "Lecture added!", course });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to add lecture", ERR: error.message });
  }
};

export const updateLectureVideo = async (req, res) => {
  try {
    const { id, videoId } = req.params;
    const course = await coursesModel.findById(id);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only edit lectures on your own courses" });
    }

    const video = course.videos.id(videoId);
    if (!video) return res.status(404).json({ success: false, msg: "Lecture not found" });

    const { title, description, duration, lectureNumber } = req.body;
    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (duration !== undefined) video.duration = duration;
    if (lectureNumber !== undefined) video.lectureNumber = lectureNumber;
    if (req.file) video.url = await uploadToCloudinary(req.file.path, "course-videos");

    await course.save();
    res.status(200).json({ success: true, msg: "Lecture updated!", course });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to update lecture", ERR: error.message });
  }
};

export const deleteLectureVideo = async (req, res) => {
  try {
    const { id, videoId } = req.params;
    const course = await coursesModel.findById(id);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only remove lectures from your own courses" });
    }

    const video = course.videos.id(videoId);
    if (!video) return res.status(404).json({ success: false, msg: "Lecture not found" });

    video.deleteOne();
    await course.save();

    res.status(200).json({ success: true, msg: "Lecture removed!", course });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to remove lecture", ERR: error.message });
  }
};

/* ============================================================
   ENROLLMENT
   ============================================================ */

export const requestEnroll = async (req, res) => {
  try {
    const course = await coursesModel.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    const existing = course.enrolledLearners.find((e) => e.learner.toString() === req.user.id);
    if (existing) {
      return res.status(409).json({
        success: false,
        msg: `You already have a ${existing.status} enrollment request for this course`
      });
    }

    course.enrolledLearners.push({ learner: req.user.id, status: "pending" });
    await course.save();

    res.status(201).json({ success: true, msg: "Enrollment request sent!, waiting for instructor approval" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to request enrollment", ERR: error.message });
  }
};

export const respondToEnrollment = async (req, res) => {
  try {
    const { id, enrollmentId } = req.params;
    const { decision } = req.body; // "approved" | "rejected"

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ success: false, msg: "Decision must be 'approved' or 'rejected'" });
    }

    const course = await coursesModel.findById(id);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only manage enrollments for your own courses" });
    }

    const enrollment = course.enrolledLearners.id(enrollmentId);
    if (!enrollment) return res.status(404).json({ success: false, msg: "Enrollment request not found" });

    enrollment.status = decision;
    await course.save();

    // Keep the learner's own enrolledCourses list in sync so "my courses"
    // queries stay correct without re-scanning every course document.
    if (decision === "approved") {
      await learnerModel.findByIdAndUpdate(enrollment.learner, { $addToSet: { enrolledCourses: course._id } });
    } else {
      await learnerModel.findByIdAndUpdate(enrollment.learner, { $pull: { enrolledCourses: course._id } });
    }

    res.status(200).json({ success: true, msg: `Enrollment ${decision}!` });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to respond to enrollment", ERR: error.message });
  }
};

export const getEnrollmentRequests = async (req, res) => {
  try {
    const course = await coursesModel
      .findById(req.params.id)
      .populate("enrolledLearners.learner", "name email pic");

    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only view enrollments for your own courses" });
    }

    res.status(200).json({ success: true, enrolledLearners: course.enrolledLearners });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch enrollments", ERR: error.message });
  }
};
