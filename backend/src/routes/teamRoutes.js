import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import { uploadImgsStorage } from '../config/multer.js';
import { createMember, getAllMembers, getMemberById, updateMember, deleteMember } from '../controllers/teamCtrls.js';

const teamRouter = express.Router();
teamRouter.use(authCheck, restrictTo('admin'));

teamRouter.get('/', getAllMembers);
teamRouter.get('/:id', getMemberById);
teamRouter.post('/', uploadImgsStorage.single('picture'), createMember);
teamRouter.patch('/:id', uploadImgsStorage.single('picture'), updateMember);
teamRouter.delete('/:id', deleteMember);

export default teamRouter;