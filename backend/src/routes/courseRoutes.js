import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { uploadImgsStorage, uploadVideoStorage } from '../config/multer.js';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  addLectureVideo,
  updateLectureVideo,
  deleteLectureVideo,
  requestEnroll,
  respondToEnrollment,
  getEnrollmentRequests
} from '../controllers/courseCtrls.js';
import { getMyEnrollments } from '../controllers/learnerCtrls.js';

const courseRouter = express.Router();

/* PUBLIC BROWSING */
// optionalAuth (not authCheck) so guests can still browse, but a logged-in
// learner's approved enrollment unlocks full lecture content in getCourseById.
courseRouter.get('/', optionalAuth, getAllCourses);
courseRouter.get('/:id', optionalAuth, getCourseById);

/* COURSE CRUD (instructor only, admin can override) */
courseRouter.post('/', authCheck, restrictTo('instructor', 'admin'), uploadImgsStorage.single('poster'), createCourse);
courseRouter.patch('/:id', authCheck, restrictTo('instructor', 'admin'), uploadImgsStorage.single('poster'), updateCourse);
courseRouter.delete('/:id', authCheck, restrictTo('instructor', 'admin'), deleteCourse);

/* LECTURE VIDEOS(Future only) */
courseRouter.post('/:id/videos', authCheck, restrictTo('instructor', 'admin'), uploadVideoStorage.single('video'), addLectureVideo);
courseRouter.patch('/:id/videos/:videoId', authCheck, restrictTo('instructor', 'admin'), uploadVideoStorage.single('video'), updateLectureVideo);
courseRouter.delete('/:id/videos/:videoId', authCheck, restrictTo('instructor', 'admin'), deleteLectureVideo);

/* ENROLLMENT */
courseRouter.post('/:id/enroll', authCheck, restrictTo('learner'), requestEnroll);
courseRouter.get('/:id/enroll', authCheck, restrictTo('instructor', 'admin'), getEnrollmentRequests);
courseRouter.patch('/:id/enroll/:enrollmentId', authCheck, restrictTo('instructor', 'admin'), respondToEnrollment);
courseRouter.get("/", getAllCourses)
courseRouter.get('/my-enrollments', authCheck, restrictTo('learner'), getMyEnrollments);
courseRouter.get('/:id', optionalAuth, getCourseById);
export default courseRouter;
