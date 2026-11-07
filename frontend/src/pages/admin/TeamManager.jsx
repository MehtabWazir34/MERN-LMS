import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import ImagePicker from "../../components/common/ImagePicker";
import Input from "../../components/common/Input";
import ListInput from "../../components/common/ListInput";
import Spinner from "../../components/common/Spinner";
import TextArea from "../../components/common/TextArea";
import Modal from "../../components/layout/Modal";
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from "../../api/content";

const ABOUT_MAX = 1000;
const EMPTY_FORM = { name: "", title: "", badge: "", experience: "", about: "", order: "" };
const EMPTY_PROFILES = { linkedin: "", github: "", portfolio: "", whatsapp: "" };

const PROFILE_FIELDS = [
    { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/..." },
    { key: "github", label: "GitHub", placeholder: "https://github.com/..." },
    { key: "portfolio", label: "Portfolio", placeholder: "https://..." },
    { key: "whatsapp", label: "WhatsApp link", placeholder: "https://wa.me/923001234567" },
];

const FIELD_IDS = {
    picture: "member-picture",
    name: "member-name",
    title: "member-title",
    badge: "member-badge",
    experience: "member-experience",
    skills: "member-skills",
    about: "member-about",
    order: "member-order",
    linkedin: "member-linkedin",
    github: "member-github",
    portfolio: "member-portfolio",
    whatsapp: "member-whatsapp",
};

const isLink = (value) => /^https?:\/\/\S+$/i.test(value.trim());

// Smaller order first; the same order falls back to the oldest first.
const sortMembers = (list) =>
    [...list].sort((a, b) => a.order - b.order || new Date(a.createdAt) - new Date(b.createdAt));

export default function TeamManager() {
    const [members, setMembers] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // the member being edited, null when adding
    const [form, setForm] = useState(EMPTY_FORM);
    const [skills, setSkills] = useState([]);
    const [profiles, setProfiles] = useState(EMPTY_PROFILES);
    const [pictureFiles, setPictureFiles] = useState([]); // at most one new picture
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getTeamMembers({ signal: controller.signal });
                setMembers(sortMembers(data.members));
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    const openAdd = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setSkills([]);
        setProfiles(EMPTY_PROFILES);
        setPictureFiles([]);
        setErrors({});
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEdit = (member) => {
        setEditTarget(member);
        setForm({
            name: member.name,
            title: member.title,
            badge: member.badge ?? "",
            experience: String(member.experience),
            about: member.about,
            order: member.order ? String(member.order) : "",
        });
        setSkills(member.skills ?? []);
        setProfiles({ ...EMPTY_PROFILES, ...(member.profiles ?? {}) });
        setPictureFiles([]);
        setErrors({});
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: undefined }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        clearError(name);
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfiles((prev) => ({ ...prev, [name]: value }));
        clearError(name);
    };

    const validate = () => {
        const next = {};
        const experience = Number(form.experience);

        if (!editTarget && pictureFiles.length === 0) next.picture = "A picture is required";
        if (!form.name.trim()) next.name = "Name is required";
        if (!form.title.trim()) next.title = "Job title is required";
        if (form.experience === "" || Number.isNaN(experience) || experience < 0) {
            next.experience = "Enter the years of experience, 0 or more";
        }
        if (skills.length === 0) next.skills = "Add at least one skill";
        if (!form.about.trim()) next.about = "About is required";
        if (form.order !== "" && (!Number.isInteger(Number(form.order)) || Number(form.order) < 0)) {
            next.order = "Enter a whole number, 0 or higher";
        }
        PROFILE_FIELDS.forEach(({ key }) => {
            if (profiles[key].trim() && !isLink(profiles[key])) next[key] = "Enter a full link starting with http:// or https://";
        });

        setErrors(next);
        return next;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        const found = validate();
        const firstInvalid = Object.keys(found)[0];
        if (firstInvalid) {
            document.getElementById(FIELD_IDS[firstInvalid])?.focus();
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                title: form.title.trim(),
                badge: form.badge.trim(),
                experience: form.experience,
                about: form.about.trim(),
                skills,
                profiles: Object.fromEntries(PROFILE_FIELDS.map(({ key }) => [key, profiles[key].trim()])),
                order: Number(form.order) || 0,
            };
            if (pictureFiles[0]) payload.picture = pictureFiles[0];

            if (editTarget) {
                const data = await updateTeamMember(editTarget._id, payload);
                setMembers((prev) => sortMembers(prev.map((m) => (m._id === editTarget._id ? data.member : m))));
                setBanner({ variant: "success", message: "Team member updated." });
            } else {
                const data = await addTeamMember(payload);
                setMembers((prev) => sortMembers([...prev, data.member]));
                setBanner({ variant: "success", message: "Team member added." });
            }
            closeModal();
        } catch (err) {
            const data = err.response?.data;
            const detail = err.response?.status === 400 && data?.ERR ? `: ${data.ERR}` : "";
            setFormError(`${data?.msg || "Failed to save the team member"}${detail}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (member) => {
        if (!window.confirm(`Remove ${member.name} from the team? This cannot be undone.`)) return;
        setDeletingId(member._id);
        setBanner(null);
        try {
            await deleteTeamMember(member._id);
            setMembers((prev) => prev.filter((m) => m._id !== member._id));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to remove the team member" });
        } finally {
            setDeletingId(null);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (status === "error") {
        return <Alert variant="danger">Couldn't load the team.</Alert>;
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl text-text-primary">Team ({members.length})</h2>
                <Button fullWidth={false} onClick={openAdd}>
                    + Add member
                </Button>
            </div>

            {banner && (
                <div className="mt-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {members.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">No team members yet. Add the first one.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {members.map((member) => (
                        <li key={member._id} className="rounded-lg border border-border bg-surface p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex min-w-0 flex-1 items-start gap-4">
                                    {member.picture?.url ? (
                                        <img
                                            src={member.picture.url}
                                            alt=""
                                            loading="lazy"
                                            className="h-14 w-14 shrink-0 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-14 w-14 shrink-0 rounded-full bg-surface-hover" />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-medium text-text-primary">{member.name}</h3>
                                            {member.badge && (
                                                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                    {member.badge}
                                                </span>
                                            )}
                                            <span className="text-xs text-text-muted">Order {member.order}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary">
                                            {member.title} · {member.experience} yr{member.experience === 1 ? "" : "s"} experience
                                        </p>
                                        {member.skills?.length > 0 && (
                                            <ul className="mt-2 flex flex-wrap gap-1.5">
                                                {member.skills.map((skill) => (
                                                    <li
                                                        key={skill}
                                                        className="rounded-full border border-border bg-surface-hover px-2.5 py-0.5 text-xs text-text-secondary"
                                                    >
                                                        {skill}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                            {PROFILE_FIELDS.filter(({ key }) => member.profiles?.[key]).map(({ key, label }) => (
                                                <a
                                                    key={key}
                                                    href={member.profiles[key]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    {label}
                                                </a>
                                            ))}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(member)}
                                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(member)}
                                        disabled={deletingId === member._id}
                                        className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                    >
                                        {deletingId === member._id ? "Removing…" : "Remove"}
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editTarget ? "Edit team member" : "Add team member"} maxWidth="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {formError && <Alert variant="danger">{formError}</Alert>}

                    <ImagePicker
                        id={FIELD_IDS.picture}
                        label={editTarget ? "Picture (leave empty to keep the current one)" : "Picture"}
                        existing={editTarget?.picture ? [editTarget.picture] : []}
                        files={pictureFiles}
                        onFilesChange={(files) => {
                            setPictureFiles(files);
                            clearError("picture");
                        }}
                        error={errors.picture}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            id={FIELD_IDS.name}
                            name="name"
                            label="Name"
                            value={form.name}
                            onChange={handleChange}
                            error={errors.name}
                        />
                        <Input
                            id={FIELD_IDS.title}
                            name="title"
                            label="Job title"
                            value={form.title}
                            onChange={handleChange}
                            error={errors.title}
                        />
                        <Input
                            id={FIELD_IDS.badge}
                            name="badge"
                            label="Badge (optional)"
                            placeholder="e.g. Founder"
                            value={form.badge}
                            onChange={handleChange}
                        />
                        <Input
                            id={FIELD_IDS.experience}
                            name="experience"
                            type="number"
                            label="Years of experience"
                            min="0"
                            step="0.5"
                            value={form.experience}
                            onChange={handleChange}
                            error={errors.experience}
                        />
                    </div>

                    <ListInput
                        id={FIELD_IDS.skills}
                        label="Skills"
                        placeholder="e.g. Node.js, then press Enter"
                        hint="Press Enter or comma to add each one."
                        items={skills}
                        onChange={(items) => {
                            setSkills(items);
                            clearError("skills");
                        }}
                        error={errors.skills}
                    />

                    <TextArea
                        id={FIELD_IDS.about}
                        name="about"
                        label="About"
                        rows={5}
                        maxLength={ABOUT_MAX}
                        value={form.about}
                        onChange={handleChange}
                        error={errors.about}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        {PROFILE_FIELDS.map(({ key, label, placeholder }) => (
                            <Input
                                key={key}
                                id={FIELD_IDS[key]}
                                name={key}
                                label={`${label} (optional)`}
                                placeholder={placeholder}
                                value={profiles[key]}
                                onChange={handleProfileChange}
                                error={errors[key]}
                            />
                        ))}
                    </div>

                    <Input
                        id={FIELD_IDS.order}
                        name="order"
                        type="number"
                        label="Order (smaller shows first)"
                        min="0"
                        step="1"
                        value={form.order}
                        onChange={handleChange}
                        error={errors.order}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" fullWidth={false} onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" fullWidth={false} isLoading={isSaving}>
                            {editTarget ? "Save changes" : "Add member"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}