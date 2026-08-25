import mongoose from "mongoose";

const videosSchema = new mongoose.Schema({
    title:{type: String, required: true},
    description:{type: String, required: true},
    url:{type: String, required: true},
    duration:{type: Number, default: 0},
    lectureNumber:{type: Number, default: 0},
})
const Schema = new mongoose.Schema({
    title: { type: String, required: true,},
    description: { type: String, required: true,},
    instructor: { type: mongoose.Schema.Types.ObjectId, ref:"instructorModel", required: true,},
    poster:{type: String, default:""},
    price: { type: Number, required: true,},
    videos: [videosSchema],
},{timestamps: true});
export const coursesModel = mongoose.model("Course", Schema);