import { http } from "./http";

// Admin-only calls for the website content (services, projects, policies, team).
// The public site reads the same data through /public/* on the server; nothing here is for visitors.

export const POLICY_PAGES = [
    { slug: "terms-and-conditions", label: "Terms and conditions" },
    { slug: "privacy-policy", label: "Privacy policy" },
];
export const MAX_POLICY_SECTIONS = 40; // same limits as the server models
export const MAX_PROJECT_IMAGES = 8;

// For multipart requests (projects, team). Arrays and plain objects are sent as JSON strings,
// files as files (several for an array of Files), booleans as "true"/"false".
// Empty strings ARE sent, so an optional field can be cleared (for example a team badge).
// No Content-Type header on purpose: axios must set it itself, with the multipart boundary.
const buildFormData = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value) && value.length > 0 && value.every((item) => item instanceof File)) {
            value.forEach((file) => formData.append(key, file));
            return;
        }
        if (Array.isArray(value) || (typeof value === "object" && !(value instanceof File))) {
            formData.append(key, JSON.stringify(value));
            return;
        }
        formData.append(key, value);
    });
    return formData;
};

/* SERVICES (JSON) */

export const getServicesAdmin = async (config = {}) => {
    const res = await http.get("/content/services", config);
    return res.data; // { success, msg, services }
};

/** @param {object} data { title, overview, techTags: string[], isActive?, order? } */
export const addService = async (data) => {
    const res = await http.post("/content/services", data);
    return res.data; // { success, msg, service }
};

export const updateService = async (id, data) => {
    const res = await http.patch(`/content/services/${id}`, data);
    return res.data; // { success, msg, service }
};

export const deleteService = async (id) => {
    const res = await http.delete(`/content/services/${id}`);
    return res.data;
};

/* PROJECTS (multipart; images go in the "images" field) */

export const getProjectsAdmin = async (config = {}) => {
    const res = await http.get("/content/projects", config);
    return res.data; // { success, msg, projects }
};

/**
 * @param {object} data {
 *   title, subTitle, overview, summary, type, features: string[], techTags: string[],
 *   images: File[], isActive?, order?
 * }
 */
export const addProject = async (data) => {
    const res = await http.post("/content/projects", buildFormData(data),{
        headers:{"Content-Type":"multipart/form-data"}
    });
    return res.data; // { success, msg, project }
};

// Send only what changed. `images` = new files to add, `removeImages` = publicIds to delete.
export const updateProject = async (id, data) => {
    const res = await http.patch(`/content/projects/${id}`, buildFormData(data));
    return res.data; // { success, msg, project }
};

export const deleteProject = async (id) => {
    const res = await http.delete(`/content/projects/${id}`);
    return res.data;
};

/* POLICIES (JSON; two fixed pages, see POLICY_PAGES) */

export const getPoliciesAdmin = async (config = {}) => {
    const res = await http.get("/content/policies", config);
    return res.data; // { success, msg, policies }
};

/**
 * Creates the page the first time and updates it afterwards.
 * @param {object} data { title, intro?, sections: [{ heading, body }], isActive? }
 *   (for just showing or hiding the page, send { isActive } alone)
 */
export const savePolicy = async (slug, data) => {
    const res = await http.put(`/content/policies/${slug}`, data,{
        headers:{"Content-Type":"application/json"}
    });
    return res.data; // { success, msg, policy }
};

/* TEAM (multipart; the picture goes in the "picture" field) */

export const getTeamMembers = async (config = {}) => {
    const res = await http.get("/team", config);
    return res.data; // { success, count, members }
};

/**
 * @param {object} data {
 *   name, title, experience, about, skills: string[], picture: File,
 *   badge?, order?, profiles?: { linkedin, whatsapp, github, portfolio }
 * }
 */
export const addTeamMember = async (data) => {
    const res = await http.post("/team", buildFormData(data),{
        headers:{"Content-Type":"multipart/form-data"}
    });
    return res.data; // { success, msg, member }
};

// Without `picture` the current one stays. Only the profile links that are sent change.
export const updateTeamMember = async (id, data) => {
    const res = await http.patch(`/team/${id}`, buildFormData(data),{
        headers:{"Content-Type":"multipart/form-data"}
    });
    return res.data; // { success, msg, member }
};

export const deleteTeamMember = async (id) => {
    const res = await http.delete(`/team/${id}`);
    return res.data;
};