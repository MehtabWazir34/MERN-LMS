import express from 'express';
import { authCheck, restrictTo } from '../middleware/authCheck.js';
import { uploadImgsStorage } from '../config/multer.js';
import { MAX_IMAGES } from '../models/projects.js';
import { addService, updateService, removeService, getServicesAdmin } from '../controllers/serviceCtrls.js';
import { addProject, updateProject, deleteProject, getAllProjectsAdmin } from '../controllers/projectCtrls.js';
import { savePolicy, getPoliciesAdmin } from '../controllers/policyCtrls.js';

// Company-site content, managed by admins only.
// (Team members stay in teamRoutes.js, mounted at /lms/team.)
const contentRouter = express.Router();
contentRouter.use(authCheck, restrictTo('admin'));

/* SERVICES (JSON body) */
contentRouter.get('/services', getServicesAdmin);
contentRouter.post('/services', addService);
contentRouter.patch('/services/:id', updateService);
contentRouter.delete('/services/:id', removeService);

/* PROJECTS (multipart: images, up to MAX_IMAGES files in the "images" field) */
contentRouter.get('/projects', getAllProjectsAdmin);
contentRouter.post('/projects', uploadImgsStorage.array('images', MAX_IMAGES), addProject);
contentRouter.patch('/projects/:projectId', uploadImgsStorage.array('images', MAX_IMAGES), updateProject);
contentRouter.delete('/projects/:projectId', deleteProject);

/* POLICIES (JSON body; PUT creates the page the first time and updates it afterwards)
   :slug is "terms-and-conditions" or "privacy-policy" */
contentRouter.get('/policies', getPoliciesAdmin);
contentRouter.put('/policies/:slug', savePolicy);

export default contentRouter;