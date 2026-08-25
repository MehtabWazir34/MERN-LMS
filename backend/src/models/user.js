import mongoose from "mongoose";

const Schema = mongoose.Schema({
    name:{type: String, required: true},
    email:{type: String, required: true, unique: true, lowercase: true},
    password:{type: String, select: false},
    pic:{type: String, default:''},
    googleAuth:{type: String, default:""},
    role:{
        type: String, roles:["Admin", "Instructor", "Learner"]
    },
    courses:{
        type: [mongoose.Schema.Types.ObjectId], ref:"Course"
    }

}, {timestamps: true});

export const usersModel = mongoose.model("User", Schema);