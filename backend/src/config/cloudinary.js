import {v2 as cloudinary} from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
    cloud_name:env.cloudinary_Name,
    api_key: env.cloudinary_API_KEY,
    api_secret: env.cloudinary_Secret_KEY,
})
export default cloudinary;