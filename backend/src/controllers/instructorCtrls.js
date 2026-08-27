import { env } from "../config/env.js"
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { instructorModel } from "../models/instructorModel.js";

const getToken = (userId)=>{
    const token = jwt.sign({id: userId, role: "instructor"}, env.jwtSecret, {expiresIn: env.jwtExpiresIn});
    return token
};
import {OAuth2Client} from 'google-auth-library';
import { uploadToCloudinary } from "../config/uploadToCloudinary.js";

const googleClient = new OAuth2Client(env.googleClientID);

export const registerInstructor = async(req, res)=>{
    try {
        const { name, email, password, pic, about,} = req.body;
        if(!name || !email || !password 
            // || !about
          ){
            return res.json({msg:"All fields are required"})
        };
        const isInstructor = await instructorModel.findOne({email});
        if(isInstructor){
            return res.json({msg:"Instructor with this email already exsts, login"})
        };
        const picURL = await uploadToCloudinary(req.file.path, "profile-pics")
       
        const saltedPassword = await bcrypt.hash(password, 10);
        const instructor = new instructorModel({
            name, 
            email, 
            password: saltedPassword, 
            about,
            pic: picURL || ""
            // verifiedStatus, 
            // role
        });
        await instructor.save();
        const token = getToken(instructor._id);
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
};

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
        const isCorrectPassword = bcrypt.compare(password, insctructor.password);
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
};

export const googleAuthInstructor = async(req, res)=>{
    try {
        const {idToken} = req.body;
        if(!idToken) return res.json({success:false, msg:"token required"});
        const googleTicket = await googleClient.verifyIdToken({
            idToken,
            audience: env.googleClientID
        });

        const loadTkt = googleTicket.getPayload();
        const {email, name, picture, sub: googleAuthId} = loadTkt;
        let instructor = await instructorModel.findOne({email});
        if(instructor){
            return res.json({
                success: false,
                msg:"Email alredy exsts! plz logged in with password"
            });
        };
        instructor = new instructorModel({
            name, email, pic: picture, authMethod:"google",
            verifiedStatus:"true",
            googleAuthId
        });
        const token = getToken(instructor._id);

        res.json({
            success: true,
            msg:"googleAuth signed ✅",
            token,
            instructor
        });
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
};

export const logoutInstructor = async(req, res)=>{
    try {
        let id = req.user.id;
        let instructor = await instructorModel.findByIdAndUpdate(id,{token:''})
        if(!instructor) return res.json({success: false});

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
