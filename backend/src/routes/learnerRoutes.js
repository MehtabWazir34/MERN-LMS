import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import {
  registerLearner,
  verifyLearnerEmail,
  resendLearnerVerification,
  loginLearner,
  googleAuthLearner,
  logoutLearner,
  getMyEnrollments,
  updateMyProfile,
  
  // getMyEnrolledCourses,
  
} from '../controllers/learnerCtrls.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { getCourseById } from '../controllers/courseCtrls.js';
import { uploadImgsStorage } from '../config/multer.js';
// getMyEnrollments

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
learnerRouter.get('/my-courses', authCheck, restrictTo('learner'), getMyEnrollments);
learnerRouter.get('/my-enrollments', authCheck, restrictTo('learner'), getMyEnrollments);
learnerRouter.get('/:id', optionalAuth, getCourseById);
// Attendance/result history for a learner (getMyAttendance, getMyResults)
// live in attendanceRoutes.js and resultRoutes.js — kept with their
// domain instead of here, same reasoning as the models being separated.
learnerRouter.patch('/profile', authCheck, restrictTo('learner'), uploadImgsStorage.single('pic'), updateMyProfile);
export default learnerRouter;
