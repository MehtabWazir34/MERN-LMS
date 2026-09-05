import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true },
    duration: { type: Number, default: 0 },
    lectureNumber: { type: Number, default: 0 },
});

const enrollmentSchema = new mongoose.Schema({
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "Learner", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    poster: { type: String, default: "" },
    price: { type: Number, required: true },
    videos: [videoSchema],
    enrolledLearners: [enrollmentSchema],
}, { timestamps: true });

export const coursesModel = mongoose.model("Course", courseSchema);