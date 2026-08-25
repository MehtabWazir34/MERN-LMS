import { Router } from 'express';
import { googleAuthAdmin, loginAdmin, logoutAdmin, registerAdmin,} from '../controllers/adminCtrls.js';
import { googleAuthInstructor, loginInstructor, logoutInstructor, registerInstructor } from '../controllers/instructorCtrls.js';
import { googleAuthLearner, loginLearner, logoutLearner, registerLearner } from '../controllers/learnerCtrls.js';
export const adminRoutes = Router();

authRoutes.get("/check", async(req, res)=>{
    return res.json({msg:"AUth is running!"})
})
adminRoutesRoutes.post("/register-admin", registerAdmin);
adminRoutesRoutes.post("/login-admin", loginAdmin);
adminRoutesRoutes.post("/logout-admin", logoutAdmin);
adminRoutesRoutes.post("/googleauth-admin", googleAuthAdmin);

export const instructorRoutes = Router();
instructorRoutes.post("/register-instructor", registerInstructor)
instructorRoutes.post("/login-instructor", loginInstructor)
instructorRoutes.post("/logout-instructor", logoutInstructor)
instructorRoutes.post("/googleauth-instructor", googleAuthInstructor)


export const learnerRoutes = Router();
learnerRoutes.post("/register-learner", registerLearner)
learnerRoutes.post("/login-learner", loginLearner)
learnerRoutes.post("/logout-learner", logoutLearner)
learnerRoutes.post("/googleauth-learner", googleAuthLearner)