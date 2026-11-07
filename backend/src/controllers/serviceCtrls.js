import mongoose from "mongoose";
import servicesModel from "../models/services.js";
import { handleERR, cleanList, toBool } from "../utils/uploadHelpers.js";

const invalidId = (res) => res.status(400).json({ success: false, msg: "Invalid service id" });

/* Admin-only (guarded by authCheck + restrictTo('admin') in the routes) */

export const addService = async (req, res) => {
    try {
        const { title, overview } = req.body;
        const techTags = cleanList(req.body.techTags);
        if (!title || !overview || !techTags.length) {
            return res.status(400).json({ success: false, msg: "Title, overview, and at least one tag are required" });
        }
        const service = await servicesModel.create({
            title, overview, techTags,
            isActive: req.body.isActive === undefined ? true : toBool(req.body.isActive),
            order: Number(req.body.order) || 999,
        });
        res.status(201).json({ success: true, msg: "Service added", service });
    } catch (error) {
        handleERR(res, error, "Failed to add service");
    }
};

export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res);

        const service = await servicesModel.findById(id);
        if (!service) return res.status(404).json({ success: false, msg: "Service not found" });

        const { title, overview, order, isActive } = req.body;
        if (title) service.title = title;
        if (overview) service.overview = overview;
        if (order !== undefined && order !== "") service.order = Number(order) || 999;
        if (isActive !== undefined) service.isActive = toBool(isActive);
        if (req.body.techTags !== undefined) service.techTags = cleanList(req.body.techTags);

        await service.save();
        res.json({ success: true, msg: "Service updated", service });
    } catch (error) {
        handleERR(res, error, "Failed to update service");
    }
};

export const removeService = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res);

        const service = await servicesModel.findByIdAndDelete(id);
        if (!service) return res.status(404).json({ success: false, msg: "Service not found" });
        res.json({ success: true, msg: "Service deleted" });
    } catch (error) {
        handleERR(res, error, "Failed to delete service");
    }
};

// Admin: active + hidden
export const getServicesAdmin = async (req, res) => {
    try {
        const services = await servicesModel.find().sort({ order: 1, createdAt: 1 });
        res.json({ success: true, msg: "All services received", services });
    } catch (error) {
        handleERR(res, error, "Failed to get services");
    }
};

/* Public (no login): active only */

export const getServices = async (req, res) => {
    try {
        const services = await servicesModel.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
        res.json({ success: true, msg: "Services received", services });
    } catch (error) {
        handleERR(res, error, "Unable to get services");
    }
};