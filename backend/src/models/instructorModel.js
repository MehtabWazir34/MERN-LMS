import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name:{type: String, required: true},
    email:{type: String, required: true, unique: true, lowercase: true},
    password:{
        type: String, 
        required: function() { return this.authMethod === 'local'},
        select: false},
    pic:{type: String, default:''},
    authMethod:{ type : String, default:"local", methods:['local', 'google']},
    googleAuthId:{type: String, default:""},
    role:{
        type: String, default:"Instructor", immutable: true
    },
    about:{
        type: String, default:"",
    },
    courses:[{
        type: [mongoose.Schema.Types.ObjectId], ref:"coursesModel"
    }],
    verifiedStatus: {type: Boolean, default: false}

}, {timestamps: true});

export const instructorModel = mongoose.model("Instructor", Schema);