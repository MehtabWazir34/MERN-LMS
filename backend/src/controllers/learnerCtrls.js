import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js"
import jwt from 'jsonwebtoken';
import {learnerModel} from '../models/learnerModel.js';
import bcrypt from "bcryptjs";
const getToken = async(learnerId)=>{
    return jwt.sign({id: learnerId}, env.jwtSecret, {expiresIn: env.jwtExpiresIn})
};

const googleClient = new OAuth2Client(env.googleClientID);

export const registerLearner = async(req, res)=>{
    try {
        const { email, name, password, about } = req.body;
        if(!email || !name || !password ) {
            return res.json({success: false, msg:"All must be filled"});
        };
        let learner = await learnerModel.findOne({email});
        if(learner){
            return res.json({success: false, msg:"Learner emails exsts, login plz"})
        };
        // const salt = bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, 10);
        learner = new learnerModel({
            name, email, password: hashPassword,
            about,
        });
        const token = await getToken(learner._id);
        await learner.save();
        learner.password = undefined;
        res.json({
            success: true,
            msg:"Registered ✅",
            token, learner
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
}
export const loginLearner = async(req, res)=>{
    try {
        const { email, password} = req.body;
        if(!email || !password){
            return res.json({msg:"Email and password are must"})
        };
        let isLearner = await learnerModel.findOne({email});
        if(!isLearner){
            return res.status(404).json({msg:"Not found learner with this email"})
        };
        let isPasswordMatch = bcrypt.compare(password, isLearner.password);
        if(!isPasswordMatch){
            return res.json({msg:"Incorrect password"})
        };
        const token = await getToken(isLearner._id);

        res.json({
            success: true,
            msg:"LoggedIn ✅",
            token, isLearner
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
}
export const googleAuthLearner = async(req, res)=>{
    try {
        const { idToken } = req.body;
        if(!idToken){
            return res.json({msg:"IdToken not found"})
        };
        const goggleTicket = await googleClient.verifyIdToken({
            idToken,
            audience: env.googleClientID
        });
        const openTktPayload =  goggleTicket.getPayload();
        const { email, name, picture, sub: googleAuthId} = openTktPayload;
        let learner = await learnerModel.findOne({email});
        if(learner) return res.json({msg:"Learner email exts, login with password"});
        learner = new learnerModel({
            name, email, pic: picture || "", googleAuthId,
            authMethod:"google",
            verifiedStatus:"true",
        });
        const token = await getToken(learner._id);
        await learner.save();
        res.json({
            success: true,
            msg:"googleAuth signed ✅",
            token, learner
        })
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        })
    }
};
export const logoutLearner = async(req, res)=>{
    try {
        let id = req.user.id;
        if(!id) return res.json({msg:"learnerId not found"});
        await learnerModel.findByIdAndUpdate(id, {token: ''})
        res.json({
            success: true,
            msg:"Logged Out ✅",
        });
    } catch (error) {
        res.json({
            success: false,
            ERR: error.message
        });
    }
};
