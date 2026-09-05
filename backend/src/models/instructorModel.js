import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
        type: String,
        required: function () { return this.authMethod === 'local' },
        select: false
    },
    pic: { type: String, default: '' },
    authMethod: { type: String, default: "local", enum: ['local', 'google'] },
    googleAuthId: { type: String, default: "" },
    role: { type: String, default: "instructor", immutable: true },
    about: { type: String, default: "" },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    verifiedStatus: { type: Boolean, default: false }
}, { timestamps: true });

export const instructorModel = mongoose.model("Instructor", Schema);