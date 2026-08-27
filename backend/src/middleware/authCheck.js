import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const authCheck = async(req, res, next)=>{
  try {
    let header = req.headers["authorization"];
    if(!header || !header.startsWith("Bearer ")){
      return res.json({success: false})
    }
    let token = header.split(' ')[1];
    if(!token){
      return res.json({success: false, msg:"token not found!, login to get"})
    };
    const verifyToken = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: verifyToken.id
    };
    next();
    // res.status(200).json({
    //   success: true,
    //   msg:"authCheck passed"
    // })
  } catch (error) {
    res.json({
      success: false,
      msg:"TOken not found!",
      ERR: error.message
    })
  }
}