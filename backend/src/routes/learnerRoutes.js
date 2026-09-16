import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import {
  registerLearner,
  verifyLearnerEmail,
  resendLearnerVerification,
  loginLearner,
  googleAuthLearner,
  logoutLearner,
  getMyEnrolledCourses
} from '../controllers/learnerCtrls.js';

const learnerRouter = express.Router();

/* AUTH (public) */
learnerRouter.post('/register', registerLearner);
learnerRouter.get('/verify-email', verifyLearnerEmail);
learnerRouter.post('/resend-verification', resendLearnerVerification);
learnerRouter.post('/login', loginLearner);
learnerRouter.post('/google-auth', googleAuthLearner);

/* AUTH (protected) */
learnerRouter.post('/logout', authCheck, restrictTo('learner'), logoutLearner);

/* SELF-SERVICE (protected) */
learnerRouter.get('/my-courses', authCheck, restrictTo('learner'), getMyEnrolledCourses);

// Attendance/result history for a learner (getMyAttendance, getMyResults)
// live in attendanceRoutes.js and resultRoutes.js — kept with their
// domain instead of here, same reasoning as the models being separated.

export default learnerRouter;
