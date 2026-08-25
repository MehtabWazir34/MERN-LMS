import { usersModel } from "../models/user.js";
import bcrypt from 'bcryptjs';
import {jwt} from 'jsonwebtoken';
import { env } from "../config/env.js";

const getToken = async (userId)=>{
  const token = jwt.sign(userId, env.jwtSecret, env.jwtExpiresIn);
  return token;
}
export const registerUser = async (req, res) => {
  try {
    const {name, email, password, pic, googleAuth, role} = req.body;
    if(!name || !email || !role){
      res.json("All fields must be filled")
      return;
    };
    //check if user exsts
    let isUser = await usersModel.findOne({email});
    if(isUser){
      res.status(401).json("User already exsts,login plz");
      return;
    };
    const hashPassword = await bcrypt.hash(password, 12);

    const user = new usersModel({
      name, email, password: hashPassword, role, pic, googleAuth
    });
    const token = await getToken(user._id)
    user.save();
    user.password = undefined;

    res.status(200).json({
      success: true,
      msg: "User registred ✅",
      token,
      user
    });
  } catch (error) {
    res.status(500).json({msg: "Failed to register user ❌😭",
      ERR: error.message
    })
    console.log({msg: "Failed to register user❌",
      ERR: error.message
    })
  }
};

export const loginUser = async(res, req)=>{
  try {
      const {email, password} = req.body;
      if(!email || !password){
        res.status(401).json("Required to have both fields!");
        return;
      };
      let user = await usersModel.find(user => user.email === email);
      if(!user){
        res.status(404).json("Ooops! User not exsts!");
        return
      };
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if(!isPasswordMatch){
        res.json("Wrong password!");
        return;
      };
      
      await user.save();

    res.status(200).json({
      success: true,
      msg: "User registred ✅",
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
    
}