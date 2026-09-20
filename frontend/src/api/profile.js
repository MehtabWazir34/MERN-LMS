import { http } from "./http";

const PROFILE_ENDPOINT = {
    admin: "/admin/profile",
    instructor: "/instructor/profile",
    learner: "/learner/profile",
};

const buildFormData = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
        }
    });
    return formData;
};

/**
 * @param {string} role - one of ROLES
 * @param {object} data - { name?, contactNumber?, address?, about? (instructor only), pic? (File) }
 * Response shape mirrors register/login — the updated document lives
 * under the role's own key (data.learner / data.instructor / data.admin).
 */
export const updateMyProfile = async (role, data) => {
    const formData = buildFormData(data);
    const res = await http.patch(PROFILE_ENDPOINT[role], formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};