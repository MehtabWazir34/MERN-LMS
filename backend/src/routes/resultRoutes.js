import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import {
  addResult,
  updateResult,
  getCourseResults,
  getMyResults
} from '../controllers/resultCtrls.js';

const resultRouter = express.Router();

/* INSTRUCTOR / ADMIN (mutate) */
resultRouter.post('/', authCheck, restrictTo('instructor', 'admin'), addResult);
resultRouter.patch('/:id', authCheck, restrictTo('instructor', 'admin'), updateResult);
resultRouter.get('/course/:courseId', authCheck, restrictTo('instructor', 'admin'), getCourseResults);

/* LEARNER (read-only) */
resultRouter.get('/me', authCheck, restrictTo('learner'), getMyResults);

export default resultRouter;
