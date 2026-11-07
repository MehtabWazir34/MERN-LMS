import mongoose from "mongoose";
import { coursesModel } from "../models/courses.js";
import { instructorModel } from "../models/instructorModel.js";
import { learnerModel } from "../models/learnerModel.js";
import { attendanceModel } from "../models/attendanceModel.js";
import { resultModel } from "../models/resultModel.js";
import { uploadAsset, deleteAsset } from "../config/uploadToCloudinary.js";
import { sendEnrollmentDecisionEmail, sendEnrollmentRequestEmail } from "../utils/sendEmail.js";
import { env } from "../config/env.js";
import { handleERR, parseArray, removeTempFile } from "../utils/uploadHelpers.js";

// True if the logged-in user owns this course, or is an admin overriding it.
const canManageCourse = (course, user) =>
  user.role === "admin" || course.instructor.toString() === user.id;

const approvedCount = (course) =>
  course.enrolledLearners.filter((e) => e.status === "approved").length;

// Who the course belongs to. An instructor always creates for themselves; an admin
// has to choose the instructor in the request (instructorId), and that instructor must exist.
const resolveOwner = async (req) => {
  if (req.user.role !== "admin") return { id: req.user.id };

  const { instructorId } = req.body;
  if (!instructorId || !mongoose.isValidObjectId(instructorId)) {
    return { error: "Choose the instructor this course belongs to" };
  }
  const instructor = await instructorModel.findById(instructorId).select("_id");
  if (!instructor) return { error: "Instructor not found" };
  return { id: instructor._id.toString() };
};

/* COURSE CRUD */

export const createCourse = async (req, res) => {
  let pictureFile;
  try {
    const { title, subtitle, overview, price, mode, category, duration, level, seats } = req.body;
    const technologies = parseArray(req.body.technologies);
    const curriculum = parseArray(req.body.curriculum);

    if (!req.file) {
      return res.status(400).json({ success: false, msg: "Course picture is required" });
    }

    if (!title || !subtitle || !overview || !mode || !category || !duration || !level || !seats
      || !technologies.length || !curriculum.length) {
      return res.status(400).json({ success: false, msg: "all fields are required" });
    }

    const owner = await resolveOwner(req);
    if (owner.error) return res.status(400).json({ success: false, msg: owner.error });

    pictureFile = await uploadAsset(req.file.path, "course-pictures", "image");

    const course = new coursesModel({
      title, subtitle, overview, mode, category, duration, level, seats, technologies, curriculum,
      price: price ?? 0,
      picture: { url: pictureFile.url, publicId: pictureFile.publicId },
      instructor: owner.id,
    });
    await course.save();

    await instructorModel.findByIdAndUpdate(owner.id, { $push: { courses: course._id } });

    res.status(201).json({ success: true, msg: "Course created!", course });
  } catch (error) {
    if (pictureFile) await deleteAsset(pictureFile.publicId);
    handleERR(res, error, "Failed to create course");
  } finally {
    await removeTempFile(req.file); // covers early returns too
  }
};

export const updateCourse = async (req, res) => {
  let newPicture;
  try {
    const course = await coursesModel.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only edit your own courses" });
    }

    // Only an admin can move a course to another instructor.
    const previousOwnerId = course.instructor.toString();
    let newOwnerId = null;
    if (req.user.role === "admin" && req.body.instructorId && req.body.instructorId !== previousOwnerId) {
      const owner = await resolveOwner(req);
      if (owner.error) return res.status(400).json({ success: false, msg: owner.error });
      newOwnerId = owner.id;
      course.instructor = owner.id;
    }

    const fields = ["title", "subtitle", "overview", "price", "mode", "category", "duration", "level", "seats", "isActive"];
    for (const f of fields) {
      if (req.body[f] !== undefined) course[f] = req.body[f];
    }
    if (req.body.technologies !== undefined) course.technologies = parseArray(req.body.technologies);
    if (req.body.curriculum !== undefined) course.curriculum = parseArray(req.body.curriculum);

    // Can't shrink seats below the learners already approved.
    if (course.seats < approvedCount(course)) {
      return res.status(400).json({
        success: false,
        msg: `Seats can't be lower than the ${approvedCount(course)} learners already approved`,
      });
    }

    const oldPublicId = course.picture?.publicId;
    if (req.file) {
      newPicture = await uploadAsset(req.file.path, "course-pictures", "image");
      course.picture = { url: newPicture.url, publicId: newPicture.publicId };
    }

    await course.save();
    if (newPicture) await deleteAsset(oldPublicId); // only after the save succeeded

    if (newOwnerId) {
      await instructorModel.findByIdAndUpdate(previousOwnerId, { $pull: { courses: course._id } });
      await instructorModel.findByIdAndUpdate(newOwnerId, { $addToSet: { courses: course._id } });
    }

    res.status(200).json({ success: true, msg: "Course updated!", course });
  } catch (error) {
    if (newPicture) await deleteAsset(newPicture.publicId);
    handleERR(res, error, "Failed to update course");
  } finally {
    await removeTempFile(req.file);
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
    await Promise.all([
      attendanceModel.deleteMany({ subject: course._id }),
      resultModel.deleteMany({ subject: course._id }),
    ]);

    // Best-effort Cloudinary cleanup
    await deleteAsset(course.picture?.publicId);
    await Promise.all(course.videos.map((v) => deleteAsset(v.publicId, "video")));

    res.status(200).json({ success: true, msg: "Course deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to delete course", ERR: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    // Public listing: active courses only, no lecture content, no learner
    // details — just a seatsLeft number for the card.
    const docs = await coursesModel
      .find({ isActive: true })
      .select("-videos")
      .populate("instructor", "name pic about");

    const courses = docs.map((doc) => {
      const c = doc.toObject();
      c.seatsLeft = Math.max(0, c.seats - approvedCount(doc));
      delete c.enrolledLearners;
      return c;
    });

    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch courses", ERR: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await coursesModel.findById(req.params.id).populate("instructor", "name pic about");
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    const courseObj = course.toObject();
    courseObj.seatsLeft = Math.max(0, course.seats - approvedCount(course));

    const user = req.user;
    const isOwnerOrAdmin = user && (user.role === "admin" || course.instructor._id.toString() === user.id);
    const isApprovedLearner = user && course.enrolledLearners.some(
      (e) => e.learner.toString() === user.id && e.status === "approved"
    );

    // Everyone else gets the preview (overview, curriculum, etc.) without videos.
    if (!isOwnerOrAdmin && !isApprovedLearner) {
      delete courseObj.videos;
      delete courseObj.enrolledLearners;
    }

    res.status(200).json({ success: true, course: courseObj });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch course", ERR: error.message });
  }
};

/* LECTURE VIDEOS */

export const addLectureVideo = async (req, res) => {
  let uploaded;
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

    uploaded = await uploadAsset(req.file.path, "course-videos", "video");
    course.videos.push({
      title, description, lectureNumber,
      url: uploaded.url,
      publicId: uploaded.publicId,
      duration: duration ?? uploaded.duration,
    });
    await course.save();

    res.status(201).json({ success: true, msg: "Lecture added!", course });
  } catch (error) {
    if (uploaded) await deleteAsset(uploaded.publicId, "video"); // don't orphan the video if the save failed
    handleERR(res, error, "Failed to add lecture");
  } finally {
    await removeTempFile(req.file);
  }
};

export const updateLectureVideo = async (req, res) => {
  let uploaded;
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

    const oldPublicId = video.publicId;
    if (req.file) {
      uploaded = await uploadAsset(req.file.path, "course-videos", "video");
      video.url = uploaded.url;
      video.publicId = uploaded.publicId;
      if (duration === undefined) video.duration = uploaded.duration;
    }

    await course.save();
    if (uploaded) await deleteAsset(oldPublicId, "video"); // only after the save succeeded

    res.status(200).json({ success: true, msg: "Lecture updated!", course });
  } catch (error) {
    if (uploaded) await deleteAsset(uploaded.publicId, "video");
    handleERR(res, error, "Failed to update lecture");
  } finally {
    await removeTempFile(req.file);
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

    const publicId = video.publicId;
    video.deleteOne();
    await course.save();
    await deleteAsset(publicId, "video");

    res.status(200).json({ success: true, msg: "Lecture removed!", course });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to remove lecture", ERR: error.message });
  }
};

/* ENROLLMENT */

export const requestEnroll = async (req, res) => {
  try {
    const { contactNumber, address } = req.body;
    if (!contactNumber || !address) {
      return res.status(400).json({ success: false, msg: "Contact number and address are required" });
    }

    const course = await coursesModel.findById(req.params.id).populate("instructor", "name email");
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!course.isActive) {
      return res.status(400).json({ success: false, msg: "This course is not accepting enrollments" });
    }
    if (approvedCount(course) >= course.seats) {
      return res.status(409).json({ success: false, msg: "This course is full" });
    }

    const existing = course.enrolledLearners.find((e) => e.learner.toString() === req.user.id);

    if (existing) {
      if (existing.status !== "rejected") {
        return res.status(409).json({
          success: false,
          msg: `You already have a ${existing.status} enrollment request for this course`,
        });
      }
      existing.status = "pending";
      existing.contactNumber = contactNumber;
      existing.address = address;
    } else {
      course.enrolledLearners.push({ learner: req.user.id, status: "pending", contactNumber, address });
    }

    await course.save();

    // Best-effort notification — an email failure must never fail the request.
    const learner = await learnerModel.findById(req.user.id).select("name");
    sendEnrollmentRequestEmail(
      course.instructor.email,
      course.instructor.name,
      learner?.name || "A learner",
      course.title,
      `${env.clientUrl}/instructor/courses/${course._id}/manage`
    ).catch((err) => console.log({ msg: "Failed to send enrollment request notification", ERR: err.message }));

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

    // Seat check only when this approval would add a new seat.
    if (decision === "approved" && enrollment.status !== "approved" && approvedCount(course) >= course.seats) {
      return res.status(409).json({ success: false, msg: "No seats left — increase seats before approving" });
    }

    enrollment.status = decision;
    await course.save();

    if (decision === "approved") {
      await learnerModel.findByIdAndUpdate(enrollment.learner, { $addToSet: { enrolledCourses: course._id } });
    } else {
      await learnerModel.findByIdAndUpdate(enrollment.learner, { $pull: { enrolledCourses: course._id } });
    }

    const learnerDoc = await learnerModel.findById(enrollment.learner).select("name email");
    const learnerUrl = decision === "approved" ? `${env.clientUrl}/courses/${course._id}` : `${env.clientUrl}/courses`;

    sendEnrollmentDecisionEmail(learnerDoc.email, learnerDoc.name, course.title, decision, learnerUrl)
      .catch((err) => console.log({ msg: "Failed to send enrollment decision notification", ERR: err.message }));

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