import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
// import { errorHandler, notFound } from './middleware/error.middleware.js';
import { connectDatabase } from './config/database.js';
import adminRouter from './routes/adminRoutes.js';
import attendanceRouter from './routes/attendanceRoutes.js';
import courseRouter from './routes/courseRoutes.js';
import instructorRouter from './routes/instructorRoutes.js';
import resultRouter from './routes/resultRoutes.js';
import learnerRouter from './routes/learnerRoutes.js';


export const app = express();

connectDatabase();
console.log(env.clientUrl);

app.use(helmet());
app.use(cors(
  { origin: env.clientUrl || "http://localhost:5173", 
    credentials: true }

));
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
app.use('/lms/attendance', attendanceRouter);
app.use('/lms/result', resultRouter);


const myPort = env.port;
app.listen(myPort,()=>{
    console.log(`LMS running at ${myPort}`);
    
})