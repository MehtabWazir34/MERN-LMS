import mongoose from "mongoose";
import projectModel, { MAX_IMAGES } from "../models/projects.js";
import {
    handleERR, parseArray, cleanList, toBool, removeTempFiles, uploadMany, destroyImages,
} from "../utils/uploadHelpers.js";

/* Admin-only (guarded by authCheck + restrictTo('admin') in the routes) */

export const addProject = async (req, res) => {
    const files = req.files || [];
    let uploaded = [];
    try {
        const { title, subTitle, overview, summary, type } = req.body;
        const features = cleanList(req.body.features);
        const techTags = cleanList(req.body.techTags);

        if (!files.length) {
            return res.status(400).json({ success: false, msg: "At least one image is required" });
        }
        // Checked before any upload, so nothing is sent to Cloudinary just to be rejected
        if (files.length > MAX_IMAGES) {
            return res.status(400).json({ success: false, msg: `A project can have at most ${MAX_IMAGES} images` });
        }
        if (!title || !subTitle || !overview || !summary || !type || !features.length || !techTags.length) {
            return res.status(400).json({ success: false, msg: "Required fields missing" });
        }

        uploaded = await uploadMany(files, "projects");

        const project = await projectModel.create({
            title, subTitle, overview, summary, type, features, techTags,
            images: uploaded,
            isActive: req.body.isActive === undefined ? true : toBool(req.body.isActive),
            order: Number(req.body.order) || 999,
        });

        res.status(201).json({ success: true, msg: "Project added", project });
    } catch (error) {
        // DB save failed -> remove the images that were already uploaded
        await destroyImages(uploaded);
        handleERR(res, error, "Failed to add project");
    } finally {
        await removeTempFiles(files); // covers every early return too
    }
};

export const updateProject = async (req, res) => {
    const files = req.files || [];
    let uploaded = [];
    try {
        const { projectId } = req.params;
        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({ success: false, msg: "Invalid project id" });
        }
        const project = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, msg: "Project not found" });
        }

        const { title, subTitle, overview, summary, type, order, isActive } = req.body;
        if (title) project.title = title; // slug stays the same, so the URL never changes
        if (subTitle) project.subTitle = subTitle;
        if (overview) project.overview = overview;
        if (summary) project.summary = summary;
        if (type) project.type = type;
        if (order !== undefined && order !== "") project.order = Number(order) || 999;
        if (isActive !== undefined) project.isActive = toBool(isActive);
        if (req.body.features !== undefined) project.features = cleanList(req.body.features);
        if (req.body.techTags !== undefined) project.techTags = cleanList(req.body.techTags);

        // removeImages = publicIds to delete (JSON array), files = new images
        const removeIds = parseArray(req.body.removeImages);
        const toRemove = project.images.filter((i) => removeIds.includes(i.publicId));
        const remaining = project.images
            .filter((i) => !removeIds.includes(i.publicId))
            .map((i) => ({ url: i.url, publicId: i.publicId }));

        const total = remaining.length + files.length;
        if (total < 1 || total > MAX_IMAGES) {
            return res.status(400).json({ success: false, msg: `Project needs between 1 and ${MAX_IMAGES} images` });
        }

        if (files.length) uploaded = await uploadMany(files, "projects");
        project.images = [...remaining, ...uploaded];

        await project.save();
        await destroyImages(toRemove); // only after the save succeeded
        res.json({ success: true, msg: "Project updated", project });
    } catch (error) {
        await destroyImages(uploaded);
        handleERR(res, error, "Failed to update project");
    } finally {
        await removeTempFiles(files);
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({ success: false, msg: "Invalid project id" });
        }
        const project = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, msg: "Project not found" });
        }
        await destroyImages(project.images);
        await project.deleteOne();
        res.json({ success: true, msg: "Project deleted" });
    } catch (error) {
        handleERR(res, error, "Failed to remove project");
    }
};

// Admin: active + hidden
export const getAllProjectsAdmin = async (req, res) => {
    try {
        const projects = await projectModel.find().sort({ order: 1, createdAt: -1 });
        res.json({ success: true, msg: "All projects received", projects });
    } catch (error) {
        handleERR(res, error, "Unable to get projects");
    }
};

/* Public (no login) */

// List: active only, first image only
export const getProjects = async (req, res) => {
    try {
        const projects = await projectModel
            .find({ isActive: true })
            .select({ title: 1, slug: 1, subTitle: 1, summary: 1, type: 1, techTags: 1, order: 1, images: { $slice: 1 } })
            .sort({ order: 1, createdAt: -1 });
        res.json({ success: true, msg: "Projects received", projects });
    } catch (error) {
        handleERR(res, error, "Unable to get projects");
    }
};

// Detail by slug
export const projectBySlug = async (req, res) => {
    try {
        const project = await projectModel.findOne({ slug: req.params.slug.toLowerCase(), isActive: true });
        if (!project) {
            return res.status(404).json({ success: false, msg: "Project not found" });
        }
        res.json({ success: true, msg: "Project found", project });
    } catch (error) {
        handleERR(res, error, "Failed to get project");
    }
};