import mongoose from "mongoose";

export const POLICY_SLUGS = ["terms-and-conditions", "privacy-policy"];
export const MAX_SECTIONS = 40;

const sectionSchema = new mongoose.Schema({
    heading: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, required: true, trim: true, maxlength: 6000 }, // plain text, paragraphs blank line se
}, { _id: false });

const policySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, enum: POLICY_SLUGS },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    intro: { type: String, trim: true, default: "", maxlength: 1500 },
    sections: {
        type: [sectionSchema],
        validate: [(v) => v.length > 0 && v.length <= MAX_SECTIONS, `Between 1 and ${MAX_SECTIONS} sections are required`],
    },
    effectiveDate: { type: Date, default: Date.now }, // page par "Last updated"
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const policyModel = mongoose.model("policyModel", policySchema);
export default policyModel;