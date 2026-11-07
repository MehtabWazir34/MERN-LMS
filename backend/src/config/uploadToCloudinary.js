import fs from 'fs/promises';
import cloudinary from './cloudinary.js';

const removeLocal = (localFilePath) => fs.unlink(localFilePath).catch(() => { });

// upload_large splits the file into chunks, so big lecture videos don't hit
// the single-request size limit of a normal upload().
const uploadVideoChunked = (localFilePath, options) =>
    new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(localFilePath, options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });

/**
 * Full upload helper. Returns { url, publicId, duration } so the caller can
 * store the publicId (needed to delete the asset later).
 * resourceType: "image" | "video" | "auto"
 * The local temp file is always removed afterwards, success or failure.
 */
export const uploadAsset = async (localFilePath, folder = "lms", resourceType = "auto") => {
    try {
        const options = { folder, resource_type: resourceType };
        const result = resourceType === "video"
            ? await uploadVideoChunked(localFilePath, { ...options, chunk_size: 6000000 })
            : await cloudinary.uploader.upload(localFilePath, options);

        return {
            url: result.secure_url,
            publicId: result.public_id,
            duration: Math.round(result.duration || 0), // only present for videos
        };
    } catch (error) {
        throw new Error(`Failed to upload to cloudinary: ${error.message}`);
    } finally {
        await removeLocal(localFilePath);
    }
};

/**
 * Unchanged contract for existing callers (profile pics in the instructor,
 * learner and admin controllers): still returns just the secure URL string.
 */
export const uploadToCloudinary = async (localFilePath, folder = "lms") => {
    const { url } = await uploadAsset(localFilePath, folder);
    return url;
};

// Best-effort delete; never throws, so cleanup can't break the main request.
export const deleteAsset = async (publicId, resourceType = "image") => {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => { });
};