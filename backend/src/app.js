import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';

import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import adminRouter from './routes/adminRoutes.js';
import attendanceRouter from './routes/attendanceRoutes.js';
import courseRouter from './routes/courseRoutes.js';
import instructorRouter from './routes/instructorRoutes.js';
import resultRouter from './routes/resultRoutes.js';
import learnerRouter from './routes/learnerRoutes.js';
import teamRouter from './routes/teamRoutes.js';
import publicRouter from './routes/publicRoutes.js';
import contentRouter from './routes/contentRoutes.js';

export const app = express();

connectDatabase();

app.use(helmet());

// The company site's origin is allowed on /lms/public only (read-only, no cookies).
// Every other route accepts the LMS client alone, with credentials.

const corsOptions = (req, callback) => {
  const isPublic = req.path.startsWith('/lms/public');
  callback(null, {
    origin: isPublic
      ? [env.clientUrl, env.companySiteUrl].flat().filter(Boolean)
      : (env.clientUrl),
    credentials: !isPublic,
  });
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'LMS API is running' });
});

app.use('/lms/admin', adminRouter);
app.use('/lms/instructor', instructorRouter);
app.use('/lms/learner', learnerRouter);
app.use('/lms/course', courseRouter);
app.use('/lms/team', teamRouter);
app.use('/lms/attendance', attendanceRouter);
app.use('/lms/result', resultRouter);
app.use('/lms/public', publicRouter);   // company site, read-only
app.use('/lms/content', contentRouter); // admin: services, projects, policies

// Unknown route
app.use((req, res) => {
  res.status(404).json({ success: false, msg: 'Route not found' });
});

// Upload messages thrown by the multer fileFilters in config/multer.js
const UPLOAD_FILTER_MESSAGES = new Set(["Only imgs are allowed", "You can upload videos only"]);

// Error handler: upload problems and bad request bodies get a clear 400
// instead of Express's default HTML error page.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    const msg = {
      LIMIT_FILE_SIZE: "File is too large",
      LIMIT_FILE_COUNT: "Too many files",
      LIMIT_UNEXPECTED_FILE: "Too many files, or the file was sent under the wrong field name",
    }[err.code] || "Upload failed";
    return res.status(400).json({ success: false, msg });
  }

  if (UPLOAD_FILTER_MESSAGES.has(err.message)) {
    return res.status(400).json({ success: false, msg: err.message });
  }

  const status = err.status || err.statusCode || 500; // body-parser sets 400 on bad JSON
  if (status >= 500) console.log("Unhandled error:", err);
  res.status(status).json({
    success: false,
    msg: status >= 500 ? "Something went wrong on the server" : err.message,
  });
});

const myPort = env.port;
app.listen(myPort, () => {
  console.log(`LMS running at ${myPort}`);
});