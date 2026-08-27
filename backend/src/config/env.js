import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = ['MONGODB_URI', 'JWTKey_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWTKey_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  cloudinary_Name: process.env.cloudinary_Name,
  cloudinary_API_KEY: process.env.cloudinary_API_KEY,
  cloudinary_Secret_KEY: process.env.cloudinary_Secret_KEY,
  googleClientID: process.googleClientID,
  googleClientSECRET: process.googleClientSECRET,
};