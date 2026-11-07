import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    publicId: { type: String, default: "" }, // needed to delete the video from Cloudinary later
    duration: { type: Number, default: 0 },
    lectureNumber: { type: Number, default: 0 },
});

const enrollmentSchema = new mongoose.Schema({
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "Learner", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    contactNumber: { type: String, default: "" },
    address: { type: String, default: "" },
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
    picture: {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
    },
    mode: { type: String, enum: ["Online", "Onsite", "Hybrid"], required: true },
    category: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true, maxlength: 150 },
    overview: { type: String, required: true, trim: true, maxlength: 1500 },
    duration: { type: String, required: true, trim: true }, // "12 Weeks" / "3 Months"
    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
        required: true,
    },
    seats: { type: Number, required: true, min: 1 },
    technologies: {
        type: [String],
        validate: [(v) => v.length > 0, "At least one technology required"],
    },
    curriculum: {
        type: [String],
        validate: [(v) => v.length > 0, "At least one curriculum point required"],
    },
    isActive: { type: Boolean, default: true },

    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    price: { type: Number, default: 0, min: 0 }, 
    videos: [videoSchema],
    enrolledLearners: [enrollmentSchema],
}, { timestamps: true });

export const coursesModel = mongoose.model("Course", courseSchema);