import { attendanceModel } from "../models/attendanceModel.js";
import { coursesModel } from "../models/courses.js";

const canManageCourse = (course, user) => {
  return user.role === "admin" || course.instructor.toString() === user.id;
};

// Normalize to midnight so the (learner, subject, date) unique index
// treats "today" as one slot regardless of what time attendance is marked.
const toDayStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const markAttendance = async (req, res) => {
  try {
    const { subject, learner, date, attendanceStatus } = req.body;
    if (!subject || !learner || !date || !attendanceStatus) {
      return res.status(400).json({ success: false, msg: "subject, learner, date and attendanceStatus are required" });
    }

    const course = await coursesModel.findById(subject);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only mark attendance for your own courses" });
    }

    const isEnrolled = course.enrolledLearners.some(
      (e) => e.learner.toString() === learner && e.status === "approved"
    );
    if (!isEnrolled) {
      return res.status(400).json({ success: false, msg: "This learner is not an approved student of this course" });
    }

    // Upsert on the (learner, subject, date) unique index in attendanceModel:
    // marking the same day twice corrects the existing record instead of
    // throwing a duplicate-key error. This is what makes attendance
    // "mutable" for the instructor without a separate edit call for
    // every correction.
    const record = await attendanceModel.findOneAndUpdate(
      { learner, subject, date: toDayStart(date) },
      { attendanceStatus, markedBy: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, msg: "Attendance marked!", record });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to mark attendance", ERR: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const record = await attendanceModel.findById(req.params.id).populate("subject");
    if (!record) return res.status(404).json({ success: false, msg: "Attendance record not found" });

    if (!canManageCourse(record.subject, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only edit attendance for your own courses" });
    }

    const { attendanceStatus } = req.body;
    if (!attendanceStatus) return res.status(400).json({ success: false, msg: "attendanceStatus is required" });

    record.attendanceStatus = attendanceStatus;
    await record.save();

    res.status(200).json({ success: true, msg: "Attendance updated!", record });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to update attendance", ERR: error.message });
  }
};

export const getCourseAttendance = async (req, res) => {
  try {
    const course = await coursesModel.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only view attendance for your own courses" });
    }

    const records = await attendanceModel
      .find({ subject: req.params.courseId })
      .populate("learner", "name email")
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch attendance", ERR: error.message });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const filter = { learner: req.user.id };
    if (req.query.courseId) filter.subject = req.query.courseId;

    const records = await attendanceModel
      .find(filter)
      .populate("subject", "title")
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch your attendance", ERR: error.message });
  }
};
