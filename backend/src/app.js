import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
// import { errorHandler, notFound } from './middleware/error.middleware.js';
import { connectDatabase } from './config/database.js';
import { adminRoutes, authRoutes, instructorRoutes, learnerRoutes } from './routes/authRoutes.js';

export const app = express();
connectDatabase();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'LMS API is running' });
});

app.use('/lms', adminRoutes);
app.use('/lms', instructorRoutes);
app.use('/lms', learnerRoutes);


const myPort = env.port;
app.listen(myPort,()=>{
    console.log(`LMS running at ${myPort}`);
    
})