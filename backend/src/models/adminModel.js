import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name:{type: String, required: true},
    email:{
        type: String, required: true, lowercase: true, unique: true
    },
    password:{type: String, required: true, select: false},
    authMethod: { type: String, methods:["local", "google"], default: "local"},
    pic:{type: String, default:""},
    role: {type: String, default:"admin", immutabel: true},
    verifiedStatus:{type: Boolean, default:"false"},
    googleAuth:{type: String}
},{timestamps: true});

export const adminModel = mongoose.model("Admin", adminSchema);