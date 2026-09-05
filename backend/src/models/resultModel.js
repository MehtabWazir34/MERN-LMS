import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "Learner", required: true },
    resultTitle: { type: String, required: true },
    obtainedMarks: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 0 },
}, { timestamps: true });

resultSchema.index({ subject: 1, learner: 1, resultTitle: 1 }, { unique: true });

export const resultModel = mongoose.model("Result", resultSchema);