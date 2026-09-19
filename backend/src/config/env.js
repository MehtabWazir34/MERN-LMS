// import dotenv from 'dotenv';
// dotenv.config();
// console.log(process.env.MONGODB_URI);
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // backend/src/config → backend/.env
const requiredEnv = ['MONGODB_URI', 'JWTKey_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
// console.log(process.env.ADMIN_REGISTER_SECRET);

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
  googleClientID: process.env.googleClientID,
googleClientSECRET: process.env.googleClientSECRET,
adminRegisterSecret: process.env.ADMIN_REGISTER_SECRET,
maxAdmins: process.env.MAX_ADMINS,
smtpHost: process.env.SMTP_HOST,
smtpPort: process.env.SMTP_PORT,
smtpUser: process.env.SMTP_USER,
smtpPass: process.env.SMTP_PASS,
smtpFrom: process.env.SMTP_FROM,
};