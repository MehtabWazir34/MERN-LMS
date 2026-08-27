import multer from 'multer';
import fs from 'fs';
import path from 'path';
const imgsStorage = multer.diskStorage({
    destination: (req, file, callback)=>{
        let storeDir = path.join(process.cwd(), "temp", "imgUploads");
        if(!fs.existsSync(storeDir)){
            fs.mkdirSync(storeDir, {recursive: true});
        };
        callback(null, storeDir);
    },
    filename:(req, file, callback)=>{
        let uniqName = `${Math.round(Math.random() * 1e3)-Date.now()}${path.extname(file.originalname)}`;
        callback(null, uniqName);
    }

});
const imgsOnly = (req, file, callback)=>{
    let imgTypes = ["image/jpg", "image/png", "image/webp", "image/jpeg"];
    if(imgTypes.includes(file.mimetype)){
        callback(null, true)
    } else {
        callback(new Error("Only imgs are allowed"), false)
    };
};
const uploadImgsStorage = multer({
    storage: imgsStorage,
    fileFilter: imgsOnly,
    limits:{fileSize: 1024 * 1024 * 5}
});
export default uploadImgsStorage;

const videosStorage = multer.diskStorage({
    destination:(req, file, callback)=>{
        let storeDir = path.join(process.cwd(), "temp", "videoUploads")
        if(!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, {recursive: true});
        callback(null, storeDir)
    },
    filename:(req, file, callback)=>{
        const uniqName = `${Date.now()-Math.round(Math.random()*1e4)}${path.extname(file.originalname)}`;
        callback(null, uniqName);
    }
});
const videosOnly = (req, file, callback)=>{
    const videoTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"];
    if(videoTypes.includes(file.mimetype)){
        callback(null, true)
    } else {
        callback(new Error("You can upload videos only"), false)
    }
};
export const uploadVideoStorage = multer({
    storage: videosStorage,
    fileFilter: videosOnly,
    limits:{fileSize: 1024 * 1024 * 500}
});