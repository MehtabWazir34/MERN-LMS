import mongoose from "mongoose";

export const MAX_IMAGES = 8;

const slugify = (text) =>
    String(text).toLowerCase().normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    subTitle: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 800 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, required: true, trim: true },
    techTags: {
        type: [{ type: String, trim: true }],
        validate: [(v) => v.length > 0, "At least one tag is required"],
    },
    features: {
        type: [{ type: String, trim: true }],
        validate: [(v) => v.length > 0, "At least one feature is required"],
    },
    images: {
        type: [{
            url: { type: String, required: true },
            publicId: { type: String, required: true },
        }],
        validate: [(v) => v.length >= 1 && v.length <= MAX_IMAGES, `Between 1 and ${MAX_IMAGES} images are required`],
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 999 },       // chhota number = pehle
}, { timestamps: true });

// Slug sirf pehli baar banta hai, title badalne par URL nahi badalta
projectSchema.pre("validate", async function () {
    if (this.slug) return;
    const base = slugify(this.title);
    let slug = base;
    let n = 1;
    while (await this.constructor.exists({ slug })) slug = `${base}-${++n}`;
    this.slug = slug;
});

const projectModel = mongoose.model("projectModel", projectSchema);
export default projectModel;