import mongoose from "mongoose";
import teamModel from "../models/teamModel.js";
import { uploadAsset, deleteAsset } from "../config/uploadToCloudinary.js";
import { handleERR, parseArray, removeTempFile } from "../utils/uploadHelpers.js";

const PROFILE_KEYS = ["linkedin", "whatsapp", "github", "portfolio"];

// Accepts profiles as a JSON string ('{"linkedin":"..."}') or as an object
// (multer turns profiles[linkedin]=... fields into one), and keeps only the
// four known keys so nothing else can be written.
const parseProfiles = (raw) => {
    if (raw === undefined || raw === null || raw === "") return {};
    let obj = raw;
    if (typeof raw === "string") {
        try {
            obj = JSON.parse(raw);
        } catch {
            return {};
        }
    }
    if (typeof obj !== "object" || Array.isArray(obj)) return {};
    return Object.fromEntries(
        PROFILE_KEYS.filter((k) => obj[k] !== undefined).map((k) => [k, String(obj[k]).trim()])
    );
};

const isMissing = (v) => v === undefined || v === null || String(v).trim() === "";

/* Admin-only: every route using these must sit behind
   authCheck + restrictTo('admin') in teamRoutes.js */

export const createMember = async (req, res) => {
    let pictureFile;
    try {
        const { name, title, badge, experience, about, order } = req.body;
        const skills = parseArray(req.body.skills);

        if (!req.file) {
            return res.status(400).json({ success: false, msg: "Member picture is required" });
        }
        if (isMissing(name) || isMissing(title) || isMissing(experience) || isMissing(about) || !skills.length) {
            return res.status(400).json({ success: false, msg: "name, title, experience, about and at least one skill are required" });
        }

        pictureFile = await uploadAsset(req.file.path, "team-pictures", "image");

        const member = new teamModel({
            name, title, badge, experience, about, skills,
            ...(order !== undefined && { order }),
            profiles: parseProfiles(req.body.profiles),
            picture: { url: pictureFile.url, publicId: pictureFile.publicId },
        });
        await member.save();

        res.status(201).json({ success: true, msg: "Team member added!", member });
    } catch (error) {
        if (pictureFile) await deleteAsset(pictureFile.publicId);
        handleERR(res, error, "Failed to add team member");
    } finally {
        await removeTempFile(req.file);
    }
};

export const getAllMembers = async (req, res) => {
    try {
        const members = await teamModel.find().sort({ order: 1, createdAt: 1 });
        res.status(200).json({ success: true, count: members.length, members });
    } catch (error) {
        handleERR(res, error, "Failed to get members")
        
    }
};

export const getMemberById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, msg: "Invalid member id" });
        }
        const member = await teamModel.findById(req.params.id);
        if (!member) return res.status(404).json({ success: false, msg: "Team member not found" });

        res.status(200).json({ success: true, member });
    } catch (error) {
        handleERR( res, error,  "Failed to fetch team member by id");
    }
};

export const updateMember = async (req, res) => {
    let newPicture;
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, msg: "Invalid member id" });
        }
        const member = await teamModel.findById(req.params.id);
        if (!member) return res.status(404).json({ success: false, msg: "Team member not found" });

        for (const f of ["name", "title", "badge", "experience", "about", "order"]) {
            if (req.body[f] !== undefined) member[f] = req.body[f];
        }
        if (req.body.skills !== undefined) member.skills = parseArray(req.body.skills);

        // Only the profile links that were sent are changed; the rest stay as they are.
        const profiles = parseProfiles(req.body.profiles);
        for (const [key, value] of Object.entries(profiles)) {
            member.profiles[key] = value;
        }

        const oldPublicId = member.picture?.publicId;
        if (req.file) {
            newPicture = await uploadAsset(req.file.path, "team-pictures", "image");
            member.picture = { url: newPicture.url, publicId: newPicture.publicId };
        }

        await member.save();
        if (newPicture) await deleteAsset(oldPublicId); // only after the save succeeded

        res.status(200).json({ success: true, msg: "Team member updated!", member });
    } catch (error) {
        if (newPicture) await deleteAsset(newPicture.publicId);
        handleERR(res, error, "Failed to update team member");
    } finally {
        await removeTempFile(req.file);
    }
};

export const deleteMember = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, msg: "Invalid member id" });
        }
        const member = await teamModel.findByIdAndDelete(req.params.id);
        if (!member) return res.status(404).json({ success: false, msg: "Team member not found" });

        await deleteAsset(member.picture?.publicId);

        res.status(200).json({ success: true, msg: "Team member removed!" });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to remove team member", ERR: error.message });
    }
};