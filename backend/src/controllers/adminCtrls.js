import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from "../config/env.js";
import { adminModel } from "../models/adminModel.js";

const getToken = async (userId)=>{
  const token = jwt.sign(userId, env.jwtSecret, env.jwtExpiresIn);
  return token;
}
export const registerAdmin= async (req, res) => {
  try {
    const {name, email, password, pic, role} = req.body;
    if(!name || !email ){
      return res.json({msg:"All fields must be filled"})
    };
    //check if user exsts
    let isUser = await adminModel.findOne({email});
    if(isUser){
      res.status(401).json({msg:"User already exsts,login plz"});
      return;
    };
    const hashPassword = await bcrypt.hash(password, 10);

    const user = new adminModel({
      name, email, 
      password: hashPassword, 
      role, pic,
    });
    await user.save();
    const token = await getToken(user._id)
    user.password = undefined;
    
    res.status(200).json({
      success: true,
      msg: "Admin registred ✅",
      token,
      user
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
      let user = await adminModel.findOne({email});
      if(!user){
        return res.status(404).json("Ooops! User not exsts!");
      };
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if(!isPasswordMatch){
        return res.json("Wrong password!");
      };
      const token = await getToken(user._id);
      await user.save();
      user.password = undefined

      res.status(200).json({
        success: true,
        msg: "admin loggedIn ✅",
        token,
        user
    });
    } catch (error) {
    res.status(500).json({msg: "Failed to Login user ❌😭",
      ERR: error.message
    })
    console.log({msg: "Failed to Login user❌",
      ERR: error.message
    })
    }   
};

export const googleAuthAdmin = async(req, res)=>{
  try {


    res.status(200).json({
      success: true,
      msg:"GoogleAuth signed"
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
    res.status(200).json({
      success: true,
      msg:"Logged out"
    })
  } catch (error) {
    res.json({success: false, msg:"Failed to logout"})
  }
}