import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from "../config/env.js";
import { adminModel } from "../models/adminModel.js";
import { OAuth2Client } from 'google-auth-library';
import { uploadToCloudinary } from '../config/uploadToCloudinary.js';

const getToken = async (userId)=>{
  const token = jwt.sign({id: userId}, env.jwtSecret,{expiresIn: env.jwtExpiresIn});
  return token;
};
const googleClient = new OAuth2Client(env.googleClientID);

export const registerAdmin= async (req, res) => {
  try {
    const {name, email, password, pic } = req.body;
    if(!name || !email || !password){
      return res.json({msg:"All fields must be filled"})
    };
    //check if user exsts
    let isAdmin = await adminModel.findOne({email});
    if(isAdmin){
      return res.status(401).json({msg:"Admin already exsts with this email,login plz"});
    };
    const hashPassword = await bcrypt.hash(password, 10);
    // const picURL = await uploadToCloudinary(req.file.path, "profile-pics")
  
    const admin = new adminModel({
      name, email, 
      password: hashPassword, 
      pic 
    });
    const token = await getToken(admin._id)
    await admin.save();
    admin.password = undefined;
    
    res.status(200).json({
      success: true,
      msg: "Admin registred ✅",
      token,
      admin
    });
  } catch (error) {
    res.status(500).json({msg: "Failed to register admin ❌😭",
      ERR: error.message
    })
    console.log({msg: "Failed to register admin❌",
      ERR: error.message
    })
  }
};

export const loginAdmin = async(req, res)=>{
  try {
      const {email, password} = req.body;
      if(!email || !password){
        res.status(401).json("Required to have both fields!");
        return;
      };
      let admin = await adminModel.findOne({email});
      if(!admin){
        return res.status(404).json("Ooops! admin not exsts!");
      };
      const isPasswordMatch = bcrypt.compare(password, admin.password);
      if(!isPasswordMatch){
        return res.json("Wrong password!");
      };
      const token = await getToken(admin._id);
      // await admin.save();
      admin.password = undefined;
      res.status(200).json({
        success: true,
        msg: "admin loggedIn ✅",
        token,
        admin
    });
    } catch (error) {
    res.status(500).json({msg: "Failed to Login admin ❌😭",
      ERR: error.message
    })
    // console.log({msg: "Failed to Login admin❌",
    //   ERR: error.message
    // })
    }   
};

export const googleAuthAdmin = async(req, res)=>{
  try {
      const { idToken } = req.body;
      if(!idToken) return res.json("Not found idTOken");
      const googleTicket = await googleClient.verifyIdToken({
        idToken,
        audience: env.googleClientID
      }); //get googleuser data
      const ticketPayLoad = googleTicket.getPayload() //open the tkt-> get actual google user data.
      const{email, name, picture, sub: googleAuthId} = ticketPayLoad;
      let admin = await adminModel.findOne({email});
      if(admin){
        return res.json({msg:"This email already exsts, login with password"})
      };
      admin = new adminModel({
        email, name, 
        pic: picture || "",
        authMethod: "google",
        verifiedStatus:"true",
        googleAuthId
      });
      const token = await getToken(admin._id);
      await admin.save();
      
    res.status(200).json({
      success: true,
      msg:"GoogleAuth signed",
      token,
      admin
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      msg:"Failed googleAuth sign"
    })
  }
}
export const logoutAdmin = async(req, res)=>{
  try {
    let id = req.user.id;
    if(!id) return res.json("userId not found");
    await adminModel.findByIdAndUpdate(id,{token:""})
    res.status(200).json({
      success: true,
      msg:"Admin Logged out"
    })
  } catch (error) {
    res.json({
      success: false, 
      msg:"Failed to logout",
      ERR: error.message
    })
  }
}