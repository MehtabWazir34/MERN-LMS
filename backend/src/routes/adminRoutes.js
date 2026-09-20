import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import { uploadImgsStorage } from '../config/multer.js'; // adjust path/name to match your existing multer setup
import {
  registerAdmin,
  verifyAdminEmail,
  resendAdminVerification,
  loginAdmin,
  googleAuthAdmin,
  logoutAdmin,
  getAllInstructors,
  getInstructorById,
  updateInstructorByAdmin,
  deleteInstructorByAdmin,
  getAllLearners,
  getLearnerById,
  updateLearnerByAdmin,
  deleteLearnerByAdmin,
  getAllAdmins,
  deleteAdminByAdmin,
  getLearnerResultsByAdmin,
  getLearnerAttendanceByAdmin,
  updateMyProfile
} from '../controllers/adminCtrls.js';

const adminRouter = express.Router();

/*  public  */
adminRouter.post('/register', uploadImgsStorage.single('pic'), registerAdmin);
adminRouter.get('/verify-email', verifyAdminEmail);
adminRouter.post('/resend-verification', resendAdminVerification);
adminRouter.post('/login', loginAdmin);
adminRouter.post('/google-auth', googleAuthAdmin);

/*  protected  */
adminRouter.post('/logout', authCheck, restrictTo('admin'), logoutAdmin);

/*  MANAGEMENT (admin only)  */
adminRouter.get('/instructors', authCheck, restrictTo('admin'), getAllInstructors);
adminRouter.get('/instructors/:id', authCheck, restrictTo('admin'), getInstructorById);
adminRouter.patch('/instructors/:id', authCheck, restrictTo('admin'), updateInstructorByAdmin);
adminRouter.delete('/instructors/:id', authCheck, restrictTo('admin'), deleteInstructorByAdmin);

adminRouter.get('/learners', authCheck, restrictTo('admin'), getAllLearners);
adminRouter.get('/learners/:id', authCheck, restrictTo('admin'), getLearnerById);
adminRouter.patch('/learners/:id', authCheck, restrictTo('admin'), updateLearnerByAdmin);
adminRouter.delete('/learners/:id', authCheck, restrictTo('admin'), deleteLearnerByAdmin);
adminRouter.get('/learners/:id/attendance', authCheck, restrictTo('admin'), getLearnerAttendanceByAdmin);
adminRouter.get('/learners/:id/results', authCheck, restrictTo('admin'), getLearnerResultsByAdmin);

adminRouter.get('/admins', authCheck, restrictTo('admin'), getAllAdmins);
adminRouter.delete('/admins/:id', authCheck, restrictTo('admin'), deleteAdminByAdmin);
adminRouter.patch('/profile', authCheck, restrictTo('admin'), uploadImgsStorage.single('pic'), updateMyProfile);
export default adminRouter;
