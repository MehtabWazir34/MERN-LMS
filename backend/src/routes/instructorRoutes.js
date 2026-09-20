import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import { uploadImgsStorage } from '../config/multer.js';
import {
  registerInstructor,
  verifyInstructorEmail,
  resendInstructorVerification,
  loginInstructor,
  googleAuthInstructor,
  logoutInstructor,
  updateMyProfile
} from '../controllers/instructorCtrls.js';

const instructorRouter = express.Router();

/* AUTH (public) */
instructorRouter.post('/register', uploadImgsStorage.single('pic'), registerInstructor);
instructorRouter.get('/verify-email', verifyInstructorEmail);
instructorRouter.post('/resend-verification', resendInstructorVerification);
instructorRouter.post('/login', loginInstructor);
instructorRouter.post('/google-auth', googleAuthInstructor);

/* AUTH (protected) */
instructorRouter.post('/logout', authCheck, restrictTo('instructor'), logoutInstructor);

// Course/lecture management, enrollment approval, attendance and results
// for an instructor's own courses live in courseRoutes.js, attendanceRoutes.js
// and resultRoutes.js — guarded there by restrictTo('instructor', 'admin')
// plus the ownership check inside each controller.
instructorRouter.patch('/profile', authCheck, restrictTo('instructor'), uploadImgsStorage.single('pic'), updateMyProfile);
export default instructorRouter;
