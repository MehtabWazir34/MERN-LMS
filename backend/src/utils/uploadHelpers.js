import fs from 'fs/promises';
import { uploadAsset, deleteAsset } from '../config/uploadToCloudinary.js';

/* parsing (form-data sends arrays/objects as strings) */

export const parseArray = (arry) => {
    if (arry === '' || arry === undefined || arry === null) return [];
    if (Array.isArray(arry)) return arry;
    try {
        const arryParsed = JSON.parse(arry);
        return Array.isArray(arryParsed) ? arryParsed : [];
    } catch (error) {
        return [];
    }
};

// Array field -> trimmed, non-empty strings only
export const cleanList = (v) => parseArray(v).map((s) => String(s).trim()).filter(Boolean);

// form-data booleans arrive as "true"/"false" strings
export const toBool = (v) => v === true || v === "true";

const PROFILE_KEYS = ["linkedin", "whatsapp", "github", "portfolio"];

// JSON string or object -> only the allowed platforms, missing ones as ""
export const parseProfiles = (v) => {
    let obj = v;
    if (typeof v === "string") {
        try { obj = JSON.parse(v); } catch { obj = {}; }
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};
    return Object.fromEntries(
        PROFILE_KEYS.map((k) => [k, typeof obj[k] === "string" ? obj[k].trim() : ""])
    );
};

/* temp files */

export const removeTempFile = async (file) => {
    if (file?.path) await fs.unlink(file.path).catch(() => { });
};

export const removeTempFiles = async (files = []) => {
    await Promise.all(files.map((f) => removeTempFile(f)));
};

/* Cloudinary (multiple images) */

// Uploads several images. Returns [{ url, publicId }] ready to store.
// If one fails midway, the ones already uploaded are deleted again; temp files are always removed.
export const uploadMany = async (files, folder) => {
    const uploaded = [];
    try {
        for (const f of files) {
            const { url, publicId } = await uploadAsset(f.path, folder, "image");
            uploaded.push({ url, publicId });
        }
        return uploaded;
    } catch (err) {
        await Promise.all(uploaded.map((u) => deleteAsset(u.publicId)));
        throw err;
    } finally {
        await removeTempFiles(files);
    }
};

// images: [{ publicId }]
export const destroyImages = (images = []) =>
    Promise.all(images.map((i) => deleteAsset(i.publicId)));


export const handleERR = (res, error, msg) => {
    console.log("Error:", error);
    if (error.name === "ValidationError") {
        return res.status(400).json({ success: false, msg: "Invalid data", ERR: error.message });
    }
    return res.status(500).json({ success: false, msg, ERR: error.message });
};