import { env } from "../config/env"
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { instructorModel } from "../models/instructorModel";

const getToken = (userId)=>{
    const token = jwt.sign({id: userId, role: "instructor"}, env.jwtSecret, {expiresIn: env.jwtExpiresIn});
    return token
}
export const registerInstructor = async(req, res)=>{
    try {
        const {name, email, password, role, pic, verifiedStatus, about,} = req.body;
        if(
            !name || !email || !password ||
            !about 
        ){
            return res.json({msg:"All fields are required"})
        };
        const isInstructor = await instructorModel.findOne({email});
        if(isInstructor){
            return res.json({msg:"Instructor with this email already exsts, login"})
        };
        const saltedPassword = await bcrypt.hash(password, 10);
        const instructor = new instructorModel({
            name, email, password: saltedPassword, pic, verifiedStatus, role
        });
        const token = getToken(instructor._id);
        await instructor.save();
        instructor.password = undefined;
        
        res.json({
            success: true,
            msg:"Registered ✅",
            token, instructor
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
}
export const loginInstructor = async(req, res)=>{
    try {
        const { email , password} = req.body;
        if(!email || !password){
            return res.json({msg:"All fields are required"})
        };
        const insctructor = await instructorModel.findOne({email}).select("+password");
        if(!insctructor){
            return res.json({msg:"No insctructor found, register fisrt"})
        };
        const isCorrectPassword = await bcrypt.compare(password, insctructor.password);
        if(!isCorrectPassword){
            return res.json({msg:"Incorrect password"})
        };
        const token = getToken(insctructor._id);
        insctructor.password = undefined;
        res.json({
            success: true,
            msg:"LoggedIn ✅",
            token,
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
}
export const googleAuthInstructor = async(req, res)=>{
    try {
        
        res.json({
            success: true,
            msg:"googleAuth signed ✅",
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
};
export const logoutInstructor = async(req, res)=>{
    try {
        
        res.json({
            success: true,
            msg:"Logged Out ✅",
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
};
