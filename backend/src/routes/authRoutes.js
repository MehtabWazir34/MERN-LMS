import { Router } from 'express';
import { googleAuthAdmin, loginAdmin, logoutAdmin, registerAdmin,} from '../controllers/adminCtrls.js';
import { googleAuthInstructor, loginInstructor, logoutInstructor, registerInstructor } from '../controllers/instructorCtrls.js';
import { googleAuthLearner, loginLearner, logoutLearner, registerLearner } from '../controllers/learnerCtrls.js';
import { authCheck } from '../middleware/authCheck.js';

import uploadImgsStorage from '../config/multer.js';
// uploadVideoStorage

export const adminRoutes = Router();

adminRoutes.get("/check", async(req, res)=>{
    return res.json({msg:"AUth is running!"})
})
adminRoutes.post("/register-admin", uploadImgsStorage.single("pic"),  registerAdmin);
adminRoutes.post("/login-admin", loginAdmin);
adminRoutes.post("/logout-admin", authCheck, logoutAdmin);
adminRoutes.post("/googleauth-admin", googleAuthAdmin);

export const instructorRoutes = Router();
instructorRoutes.post("/register-instructor", uploadImgsStorage.single("pic"), registerInstructor)
instructorRoutes.post("/login-instructor", loginInstructor)
instructorRoutes.post("/logout-instructor", authCheck, logoutInstructor)
instructorRoutes.post("/googleauth-instructor", googleAuthInstructor)


export const learnerRoutes = Router();
learnerRoutes.post("/register-learner", uploadImgsStorage.single("pic"), registerLearner)
learnerRoutes.post("/login-learner", loginLearner)
learnerRoutes.post("/logout-learner", authCheck, logoutLearner)
learnerRoutes.post("/googleauth-learner", googleAuthLearner)