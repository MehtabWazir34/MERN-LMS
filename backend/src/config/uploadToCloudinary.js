import fs from 'fs';
import cloudinary from './cloudinary.js';

export const uploadToCloudinary = async (localFilePath, folder = "lms")=>{
    try {
        const result = await cloudinary.uploader.upload(localFilePath,{
            folder, 
            resource_type: 'auto'
        });
        fs.unlinkSync(localFilePath);
        return result.secure_url
    } catch (error) {
        fs.unlinkSync(localFilePath)
        throw new Error("Failed to upload to cloudinary", error.message);
    }
};
//resourcetype: auto--> auto check file type(video/img);
//unlink--> remove/delete that uploaded file from the fs after uploding to cloud to clean and save storage.