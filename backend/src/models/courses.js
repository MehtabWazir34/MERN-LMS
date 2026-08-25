import mongoose from "mongoose";

const Schema = mongoose.Schema({
    title: { type: String, required: true,},
    description: { type: String, required: true,},
    instructor: { type: mongoose.Schema.Types.ObjectId, ref:"user", required: true,},
    price: { type: String, required: true,},
    duration: { type: String, required: true,},
},{timestamps: true});
export const coursesModel = mongoose.model("Course", Schema);