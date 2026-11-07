import policyModel, { POLICY_SLUGS, MAX_SECTIONS } from "../models/policies.js";
import { handleERR, parseArray, toBool } from "../utils/uploadHelpers.js";

const cleanSections = (value) =>
    parseArray(value)
        .map((s) => ({ heading: String(s?.heading ?? "").trim(), body: String(s?.body ?? "").trim() }))
        .filter((s) => s.heading && s.body);

const badSlug = (res) =>
    res.status(400).json({ success: false, msg: `Invalid policy. Allowed: ${POLICY_SLUGS.join(", ")}` });

/* Admin-only (guarded by authCheck + restrictTo('admin') in the routes) */

// Save: created the first time, updated afterwards
export const savePolicy = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!POLICY_SLUGS.includes(slug)) return badSlug(res);

        const { title, intro, isActive, effectiveDate } = req.body;
        const sections = cleanSections(req.body.sections);

        if (sections.length > MAX_SECTIONS) {
            return res.status(400).json({ success: false, msg: `Maximum ${MAX_SECTIONS} sections allowed` });
        }

        let policy = await policyModel.findOne({ slug });
        const isNew = !policy;
        if (isNew) {
            if (!title || !sections.length) {
                return res.status(400).json({ success: false, msg: "Title and at least one section are required" });
            }
            policy = new policyModel({ slug });
        }

        // Work out whether the visible content really changes, before applying it
        const currentSections = policy.sections.map((s) => ({ heading: s.heading, body: s.body }));
        const contentChanged =
            isNew ||
            (title && title !== policy.title) ||
            (intro !== undefined && intro !== policy.intro) ||
            (req.body.sections !== undefined && JSON.stringify(sections) !== JSON.stringify(currentSections));

        if (title) policy.title = title;
        if (intro !== undefined) policy.intro = intro;
        if (req.body.sections !== undefined) policy.sections = sections;
        if (isActive !== undefined) policy.isActive = toBool(isActive);

        // "Last updated" date: the admin's date if given; otherwise today, but only
        // when the content changed (hiding/showing the page must not change it)
        if (effectiveDate) policy.effectiveDate = new Date(effectiveDate);
        else if (contentChanged) policy.effectiveDate = new Date();

        await policy.save();
        res.status(isNew ? 201 : 200).json({ success: true, msg: isNew ? "Policy created" : "Policy updated", policy });
    } catch (error) {
        handleERR(res, error, "Failed to save policy");
    }
};

// Admin: active + hidden
export const getPoliciesAdmin = async (req, res) => {
    try {
        const policies = await policyModel.find().sort({ slug: 1 });
        res.json({ success: true, msg: "Policies received", policies });
    } catch (error) {
        handleERR(res, error, "Failed to get policies");
    }
};

/* Public (no login) */

// Short list for footer links and the sitemap
export const getPolicies = async (req, res) => {
    try {
        const policies = await policyModel
            .find({ isActive: true })
            .select({ slug: 1, title: 1, effectiveDate: 1 })
            .sort({ slug: 1 });
        res.json({ success: true, msg: "Policies received", policies });
    } catch (error) {
        handleERR(res, error, "Unable to get policies");
    }
};

// One full page
export const getPolicy = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!POLICY_SLUGS.includes(slug)) {
            return res.status(404).json({ success: false, msg: "Policy not found" });
        }
        const policy = await policyModel.findOne({ slug, isActive: true });
        if (!policy) return res.status(404).json({ success: false, msg: "Policy not found" });
        res.json({ success: true, msg: "Policy found", policy });
    } catch (error) {
        handleERR(res, error, "Failed to get policy");
    }
};