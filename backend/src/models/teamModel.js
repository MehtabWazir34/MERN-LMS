import mongoose from "mongoose";

const link = { type: String, trim: true, default: "" };

const teamSchema = new mongoose.Schema({
    picture: {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
    },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    badge: { type: String, trim: true, default: "" },
    experience: { type: Number, required: true, min: 0 },
    skills: {
        type: [String],
        validate: [(v) => v.length > 0, "At least one skill required"],
    },
    about: { type: String, required: true, trim: true, maxlength: 1000 },
    profiles: {
        linkedin: link,
        whatsapp: link,
        github: link,
        portfolio: link,
    },
    order: { type: Number, default: 0 },
}, { timestamps: true });

const teamModel = mongoose.model("teamModel", teamSchema);
export default teamModel;