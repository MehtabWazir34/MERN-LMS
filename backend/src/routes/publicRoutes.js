import express from 'express';
import { getServices } from '../controllers/serviceCtrls.js';
import { getProjects, projectBySlug } from '../controllers/projectCtrls.js';
import { getPolicies, getPolicy } from '../controllers/policyCtrls.js';
import { getAllMembers, getMemberById } from '../controllers/teamCtrls.js';
import { getPublicCourses, getPublicCourseById, getSitemapData } from '../controllers/publicCtrls.js';

// Read-only, no login. Everything here is GET and returns active content only.
const publicRouter = express.Router();

// Content changes rarely, so browsers may reuse a response for a minute.
publicRouter.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=60');
    next();
});

publicRouter.get('/services', getServices);

publicRouter.get('/projects', getProjects);
publicRouter.get('/projects/:slug', projectBySlug);

publicRouter.get('/policies', getPolicies);
publicRouter.get('/policies/:slug', getPolicy);

// Team has no isActive flag, so the same handlers as the admin side are safe to expose.
publicRouter.get('/team', getAllMembers);
publicRouter.get('/team/:id', getMemberById);

// Courses without the instructor, lecture videos or learner data.
publicRouter.get('/courses', getPublicCourses);
publicRouter.get('/courses/:id', getPublicCourseById);

publicRouter.get('/sitemap', getSitemapData);

export default publicRouter;