import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name:{type: String, required: true},
    email:{
        type: String, required: true, lowercase: true, unique: true
    },
    password:{
        type: String, 
        required: function(){ return this.authMethod === 'local'}, 
        select: false
        },
    authMethod: { type: String, default: "local", methods:["local", "google"]},

    pic:{type: String, default:""},
    role: {type: String, default:"admin", immutabel: true},
    verifiedStatus:{type: Boolean, default:"false"},
    googleAuthId:{type: String, default:""}
},{timestamps: true});

export const adminModel = mongoose.model("Admin", adminSchema);