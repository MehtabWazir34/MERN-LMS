import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import {
  markAttendance,
  updateAttendance,
  getCourseAttendance,
  getMyAttendance
} from '../controllers/attendanceCtrls.js';

const attendanceRouter = express.Router();

/* INSTRUCTOR / ADMIN (mutate) */
attendanceRouter.post('/', authCheck, restrictTo('instructor', 'admin'), markAttendance);
attendanceRouter.patch('/:id', authCheck, restrictTo('instructor', 'admin'), updateAttendance);
attendanceRouter.get('/course/:courseId', authCheck, restrictTo('instructor', 'admin'), getCourseAttendance);

/* LEARNER (read-only) */
attendanceRouter.get('/me', authCheck, restrictTo('learner'), getMyAttendance);

export default attendanceRouter;
