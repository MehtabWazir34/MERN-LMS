import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
        type: String,
        required: function () { return this.authMethod === 'local' },
        select: false
    },
    authMethod: { type: String, default: "local", enum: ["local", "google"] },
    googleAuthId: { type: String, default: "" },
    pic: { type: String, default: "" },
    role: { type: String, default: "learner", immutable: true },
    verifiedStatus: { type: Boolean, default: false },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
}, { timestamps: true });

export const learnerModel = mongoose.model("Learner", Schema);