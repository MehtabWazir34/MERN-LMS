import mongoose from "mongoose";

const servicesSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true, maxlength: 600 },
    techTags: {
        type: [{ type: String, trim: true }],
        validate: [(v) => v.length > 0, "At least one tag is required"],
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 999 },
}, { timestamps: true });

const servicesModel = mongoose.model("servicesModel", servicesSchema);
export default servicesModel;