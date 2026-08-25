import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name: {type: String, required: true},
    email:{type: String, required: true, unique: true, lowercase: true},
    password: {type: String, required: true, select: false},
    authMethod:{type: String, default:"local", methods:["local", "google"]},
    pic:{type: String, default:""},
    verifiedStatus:{type: Boolean, default:false},
    enrolledCourses:[
        {type: mongoose.Schema.Types.ObjectId, ref:"coursesModel"}
    ]
}, {timestamps: true});

export const learnerModel = mongoose.model("Learners", Schema);