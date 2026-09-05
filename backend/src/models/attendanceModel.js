import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "Learner", required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    attendanceStatus: { type: String, enum: ["A", "P", "L"], required: true },
    date: { type: Date, required: true }
}, { timestamps: true });

attendanceSchema.index({ learner: 1, subject: 1, date: 1 }, { unique: true });

export const attendanceModel = mongoose.model("Attendance", attendanceSchema);