import mongoose from 'mongoose';

import { env } from './env.js';

export const connectDatabase = async () => {
  try {
        await mongoose.connect(env.mongoUri);
        console.log(`DB Connected!`);
        
  } catch (error) {
    console.log(`Failed to connectDB! ${error}`);
  }

};