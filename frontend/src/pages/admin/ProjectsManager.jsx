import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import ImagePicker from "../../components/common/ImagePicker";
import Input from "../../components/common/Input";
import ListInput from "../../components/common/ListInput";
import Spinner from "../../components/common/Spinner";
import TextArea from "../../components/common/TextArea";
import Modal from "../../components/layout/Modal";
import {
    getProjectsAdmin,
    addProject,
    updateProject,
    deleteProject,
    MAX_PROJECT_IMAGES,
} from "../../api/content";

const SUMMARY_MAX = 800;
const EMPTY_FORM = { title: "", subTitle: "", overview: "", summary: "", type: "", order: "", isActive: true };
const FIELD_IDS = {
    title: "project-title",
    subTitle: "project-subTitle",
    overview: "project-overview",
    summary: "project-summary",
    type: "project-type",
    techTags: "project-techTags",
    features: "project-features",
    images: "project-images",
    order: "project-order",
};

// Same order as the server: smaller order first, then the newest.
const sortProjects = (list) =>
    [...list].sort((a, b) => a.order - b.order || new Date(b.createdAt) - new Date(a.createdAt));

export default function ProjectsManager() {
    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [busyId, setBusyId] = useState(null); // a delete or show/hide is running for this id

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // the project being edited, null when adding
    const [form, setForm] = useState(EMPTY_FORM);
    const [techTags, setTechTags] = useState([]);
    const [features, setFeatures] = useState([]);
    const [keptImages, setKeptImages] = useState([]); // saved images that stay
    const [newFiles, setNewFiles] = useState([]); // newly chosen image files
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getProjectsAdmin({ signal: controller.signal });
                setProjects(sortProjects(data.projects));
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
        setTechTags([]);
        setFeatures([]);
        setKeptImages([]);
        setNewFiles([]);
        setErrors({});
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEdit = (project) => {
        setEditTarget(project);
        setForm({
            title: project.title,
            subTitle: project.subTitle,
            overview: project.overview,
            summary: project.summary,
            type: project.type,
            order: project.order === 999 ? "" : String(project.order),
            isActive: Boolean(project.isActive),
        });
        setTechTags(project.techTags ?? []);
        setFeatures(project.features ?? []);
        setKeptImages(project.images ?? []);
        setNewFiles([]);
        setErrors({});
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: undefined }));

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        clearError(name);
    };

    const validate = () => {
        const next = {};
        const imageCount = keptImages.length + newFiles.length;

        if (!form.title.trim()) next.title = "Title is required";
        if (!form.subTitle.trim()) next.subTitle = "Subtitle is required";
        if (!form.overview.trim()) next.overview = "Overview is required";
        if (!form.summary.trim()) next.summary = "Summary is required";
        if (!form.type.trim()) next.type = "Type is required, for example Web app";
        if (techTags.length === 0) next.techTags = "Add at least one tag";
        if (features.length === 0) next.features = "Add at least one feature";
        if (imageCount < 1) next.images = "Add at least one image";
        else if (imageCount > MAX_PROJECT_IMAGES) next.images = `A project can have at most ${MAX_PROJECT_IMAGES} images`;
        if (form.order !== "" && (!Number.isInteger(Number(form.order)) || Number(form.order) < 0)) {
            next.order = "Enter a whole number, 0 or higher";
        }

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
                title: form.title.trim(),
                subTitle: form.subTitle.trim(),
                overview: form.overview.trim(),
                summary: form.summary.trim(),
                type: form.type.trim(),
                techTags,
                features,
                isActive: form.isActive,
                order: form.order === "" ? 999 : Number(form.order),
            };
            if (newFiles.length > 0) payload.images = newFiles;

            if (editTarget) {
                // Saved images that are no longer in the kept list are deleted by the server.
                const removed = editTarget.images
                    .filter((image) => !keptImages.some((kept) => kept.publicId === image.publicId))
                    .map((image) => image.publicId);
                if (removed.length > 0) payload.removeImages = removed;

                const data = await updateProject(editTarget._id, payload);
                setProjects((prev) => sortProjects(prev.map((p) => (p._id === editTarget._id ? data.project : p))));
                setBanner({ variant: "success", message: "Project updated." });
            } else {
                const data = await addProject(payload);
                setProjects((prev) => sortProjects([...prev, data.project]));
                setBanner({ variant: "success", message: "Project added." });
            }
            closeModal();
        } catch (err) {
            const data = err.response?.data;
            const detail = err.response?.status === 400 && data?.ERR ? `: ${data.ERR}` : "";
            setFormError(`${data?.msg || "Failed to save the project"}${detail}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (project) => {
        setBusyId(project._id);
        setBanner(null);
        try {
            const data = await updateProject(project._id, { isActive: !project.isActive });
            setProjects((prev) => prev.map((p) => (p._id === project._id ? data.project : p)));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update the project" });
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (project) => {
        if (!window.confirm(`Delete "${project.title}" and its images? This cannot be undone.`)) return;
        setBusyId(project._id);
        setBanner(null);
        try {
            await deleteProject(project._id);
            setProjects((prev) => prev.filter((p) => p._id !== project._id));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to delete the project" });
        } finally {
            setBusyId(null);
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
        return <Alert variant="danger">Couldn't load projects.</Alert>;
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl text-text-primary">Projects ({projects.length})</h2>
                <Button fullWidth={false} onClick={openAdd}>
                    + Add project
                </Button>
            </div>

            {banner && (
                <div className="mt-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {projects.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">No projects yet. Add the first one.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {projects.map((project) => (
                        <li key={project._id} className="rounded-lg border border-border bg-surface p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex min-w-0 flex-1 items-start gap-4">
                                    {project.images?.[0]?.url ? (
                                        <img
                                            src={project.images[0].url}
                                            alt=""
                                            loading="lazy"
                                            className="h-16 w-24 shrink-0 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="h-16 w-24 shrink-0 rounded bg-surface-hover" />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-medium text-text-primary">{project.title}</h3>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${project.isActive
                                                        ? "bg-success/10 text-success"
                                                        : "border border-border bg-surface text-text-secondary"
                                                    }`}
                                            >
                                                {project.isActive ? "Visible" : "Hidden"}
                                            </span>
                                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                {project.type}
                                            </span>
                                            <span className="text-xs text-text-muted">
                                                Order {project.order === 999 ? "—" : project.order}
                                            </span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{project.subTitle}</p>
                                        {project.techTags?.length > 0 && (
                                            <ul className="mt-2 flex flex-wrap gap-1.5">
                                                {project.techTags.map((tag) => (
                                                    <li
                                                        key={tag}
                                                        className="rounded-full border border-border bg-surface-hover px-2.5 py-0.5 text-xs text-text-secondary"
                                                    >
                                                        {tag}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <p className="mt-2 break-all text-xs text-text-muted">
                                            {project.images?.length ?? 0} image{project.images?.length === 1 ? "" : "s"} ·
                                            address: {project.slug}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(project)}
                                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(project)}
                                        disabled={busyId === project._id}
                                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-60"
                                    >
                                        {project.isActive ? "Hide" : "Show"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(project)}
                                        disabled={busyId === project._id}
                                        className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editTarget ? "Edit project" : "Add project"} maxWidth="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {formError && <Alert variant="danger">{formError}</Alert>}

                    <Input
                        id={FIELD_IDS.title}
                        name="title"
                        label="Title"
                        value={form.title}
                        onChange={handleChange}
                        error={errors.title}
                    />
                    <Input
                        id={FIELD_IDS.subTitle}
                        name="subTitle"
                        label="Subtitle"
                        value={form.subTitle}
                        onChange={handleChange}
                        error={errors.subTitle}
                    />
                    <TextArea
                        id={FIELD_IDS.summary}
                        name="summary"
                        label="Summary (short text for the project list)"
                        rows={3}
                        maxLength={SUMMARY_MAX}
                        value={form.summary}
                        onChange={handleChange}
                        error={errors.summary}
                    />
                    <TextArea
                        id={FIELD_IDS.overview}
                        name="overview"
                        label="Overview (full description for the project page)"
                        rows={6}
                        value={form.overview}
                        onChange={handleChange}
                        error={errors.overview}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            id={FIELD_IDS.type}
                            name="type"
                            label="Type"
                            placeholder="e.g. Web app"
                            value={form.type}
                            onChange={handleChange}
                            error={errors.type}
                        />
                        <Input
                            id={FIELD_IDS.order}
                            name="order"
                            type="number"
                            label="Order (smaller shows first, empty = last)"
                            min="0"
                            step="1"
                            value={form.order}
                            onChange={handleChange}
                            error={errors.order}
                        />
                    </div>

                    <ListInput
                        id={FIELD_IDS.techTags}
                        label="Technologies"
                        placeholder="e.g. React, then press Enter"
                        hint="Press Enter or comma to add each one."
                        items={techTags}
                        onChange={(items) => {
                            setTechTags(items);
                            clearError("techTags");
                        }}
                        error={errors.techTags}
                    />
                    <ListInput
                        id={FIELD_IDS.features}
                        label="Features"
                        variant="list"
                        placeholder="One feature, then press Enter"
                        items={features}
                        onChange={(items) => {
                            setFeatures(items);
                            clearError("features");
                        }}
                        error={errors.features}
                    />

                    <ImagePicker
                        id={FIELD_IDS.images}
                        label="Images"
                        multiple
                        max={MAX_PROJECT_IMAGES}
                        existing={keptImages}
                        onExistingChange={(list) => {
                            setKeptImages(list);
                            clearError("images");
                        }}
                        files={newFiles}
                        onFilesChange={(files) => {
                            setNewFiles(files);
                            clearError("images");
                        }}
                        hint="The first image is the cover. JPG, PNG or WebP, up to 5 MB each."
                        error={errors.images}
                    />

                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                        Visible on the website
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" fullWidth={false} onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" fullWidth={false} isLoading={isSaving}>
                            {editTarget ? "Save changes" : "Add project"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}