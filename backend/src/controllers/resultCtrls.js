import { resultModel } from "../models/resultModel.js";
import { coursesModel } from "../models/courses.js";

const canManageCourse = (course, user) => {
  return user.role === "admin" || course.instructor.toString() === user.id;
};

export const addResult = async (req, res) => {
  try {
    const { subject, learner, resultTitle, obtainedMarks, totalMarks } = req.body;
    if (!subject || !learner || !resultTitle || obtainedMarks === undefined || totalMarks === undefined) {
      return res.status(400).json({
        success: false,
        msg: "subject, learner, resultTitle, obtainedMarks and totalMarks are required"
      });
    }
    if (obtainedMarks > totalMarks) {
      return res.status(400).json({ success: false, msg: "obtainedMarks cannot exceed totalMarks" });
    }

    const course = await coursesModel.findById(subject);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only add results for your own courses" });
    }

    const isEnrolled = course.enrolledLearners.some(
      (e) => e.learner.toString() === learner && e.status === "approved"
    );
    if (!isEnrolled) {
      return res.status(400).json({ success: false, msg: "This learner is not an approved student of this course" });
    }

    // Upsert on the (subject, learner, resultTitle) unique index in
    // resultModel: posting "Midterm" again for the same student corrects
    // the existing score instead of erroring out — this is the "results
    // (mutable)" requirement, satisfied without a separate edit endpoint.
    const result = await resultModel.findOneAndUpdate(
      { subject, learner, resultTitle },
      { obtainedMarks, totalMarks, markedBy: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, msg: "Result saved!", result });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to save result", ERR: error.message });
  }
};

export const updateResult = async (req, res) => {
  try {
    const result = await resultModel.findById(req.params.id).populate("subject");
    if (!result) return res.status(404).json({ success: false, msg: "Result not found" });

    if (!canManageCourse(result.subject, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only edit results for your own courses" });
    }

    const { obtainedMarks, totalMarks } = req.body;
    const nextTotal = totalMarks !== undefined ? totalMarks : result.totalMarks;
    const nextObtained = obtainedMarks !== undefined ? obtainedMarks : result.obtainedMarks;

    if (nextObtained > nextTotal) {
      return res.status(400).json({ success: false, msg: "obtainedMarks cannot exceed totalMarks" });
    }

    result.obtainedMarks = nextObtained;
    result.totalMarks = nextTotal;
    await result.save();

    res.status(200).json({ success: true, msg: "Result updated!", result });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to update result", ERR: error.message });
  }
};

export const getCourseResults = async (req, res) => {
  try {
    const course = await coursesModel.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, msg: "Course not found" });

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, msg: "You can only view results for your own courses" });
    }

    const results = await resultModel.find({ subject: req.params.courseId }).populate("learner", "name email");

    res.status(200).json({ success: true, count: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch results", ERR: error.message });
  }
};

export const getMyResults = async (req, res) => {
  try {
    const filter = { learner: req.user.id };
    if (req.query.courseId) filter.subject = req.query.courseId;

    const results = await resultModel.find(filter).populate("subject", "title");

    res.status(200).json({ success: true, count: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch your results", ERR: error.message });
  }
};
