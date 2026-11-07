import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import ListInput from "../../components/common/ListInput";
import Spinner from "../../components/common/Spinner";
import TextArea from "../../components/common/TextArea";
import Modal from "../../components/layout/Modal";
import { getServicesAdmin, addService, updateService, deleteService } from "../../api/content";

const OVERVIEW_MAX = 600;
const EMPTY_FORM = { title: "", overview: "", order: "", isActive: true };
const FIELD_IDS = {
    title: "service-title",
    overview: "service-overview",
    techTags: "service-techTags",
    order: "service-order",
};

// Smaller order first; the same order falls back to the oldest first.
const sortServices = (list) =>
    [...list].sort((a, b) => a.order - b.order || new Date(a.createdAt) - new Date(b.createdAt));

export default function ServicesManager() {
    const [services, setServices] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [busyId, setBusyId] = useState(null); // a delete or show/hide is running for this id

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // the service being edited, null when adding
    const [form, setForm] = useState(EMPTY_FORM);
    const [techTags, setTechTags] = useState([]);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getServicesAdmin({ signal: controller.signal });
                setServices(sortServices(data.services));
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
        setErrors({});
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEdit = (service) => {
        setEditTarget(service);
        setForm({
            title: service.title,
            overview: service.overview,
            order: service.order === 999 ? "" : String(service.order),
            isActive: Boolean(service.isActive),
        });
        setTechTags(service.techTags ?? []);
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
        if (!form.title.trim()) next.title = "Title is required";
        if (!form.overview.trim()) next.overview = "Overview is required";
        if (techTags.length === 0) next.techTags = "Add at least one tag";
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
                overview: form.overview.trim(),
                techTags,
                isActive: form.isActive,
                order: form.order === "" ? 999 : Number(form.order),
            };

            if (editTarget) {
                const data = await updateService(editTarget._id, payload);
                setServices((prev) => sortServices(prev.map((s) => (s._id === editTarget._id ? data.service : s))));
                setBanner({ variant: "success", message: "Service updated." });
            } else {
                const data = await addService(payload);
                setServices((prev) => sortServices([...prev, data.service]));
                setBanner({ variant: "success", message: "Service added." });
            }
            closeModal();
        } catch (err) {
            setFormError(err.response?.data?.msg || "Failed to save the service");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (service) => {
        setBusyId(service._id);
        setBanner(null);
        try {
            const data = await updateService(service._id, { isActive: !service.isActive });
            setServices((prev) => prev.map((s) => (s._id === service._id ? data.service : s)));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update the service" });
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (service) => {
        if (!window.confirm(`Delete "${service.title}"? This cannot be undone.`)) return;
        setBusyId(service._id);
        setBanner(null);
        try {
            await deleteService(service._id);
            setServices((prev) => prev.filter((s) => s._id !== service._id));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to delete the service" });
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
        return <Alert variant="danger">Couldn't load services.</Alert>;
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl text-text-primary">Services ({services.length})</h2>
                <Button fullWidth={false} onClick={openAdd}>
                    + Add service
                </Button>
            </div>

            {banner && (
                <div className="mt-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {services.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">No services yet. Add the first one.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {services.map((service) => (
                        <li key={service._id} className="rounded-lg border border-border bg-surface p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-medium text-text-primary">{service.title}</h3>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${service.isActive
                                                    ? "bg-success/10 text-success"
                                                    : "border border-border bg-surface text-text-secondary"
                                                }`}
                                        >
                                            {service.isActive ? "Visible" : "Hidden"}
                                        </span>
                                        <span className="text-xs text-text-muted">
                                            Order {service.order === 999 ? "—" : service.order}
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{service.overview}</p>
                                    {service.techTags?.length > 0 && (
                                        <ul className="mt-2 flex flex-wrap gap-1.5">
                                            {service.techTags.map((tag) => (
                                                <li
                                                    key={tag}
                                                    className="rounded-full border border-border bg-surface-hover px-2.5 py-0.5 text-xs text-text-secondary"
                                                >
                                                    {tag}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(service)}
                                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(service)}
                                        disabled={busyId === service._id}
                                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-60"
                                    >
                                        {service.isActive ? "Hide" : "Show"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(service)}
                                        disabled={busyId === service._id}
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

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editTarget ? "Edit service" : "Add service"} maxWidth="max-w-xl">
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
                    <TextArea
                        id={FIELD_IDS.overview}
                        name="overview"
                        label="Overview"
                        rows={4}
                        maxLength={OVERVIEW_MAX}
                        value={form.overview}
                        onChange={handleChange}
                        error={errors.overview}
                    />
                    <ListInput
                        id={FIELD_IDS.techTags}
                        label="Tags"
                        placeholder="e.g. React, then press Enter"
                        hint="Technologies or keywords shown with the service."
                        items={techTags}
                        onChange={(items) => {
                            setTechTags(items);
                            clearError("techTags");
                        }}
                        error={errors.techTags}
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
                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                        Visible on the website
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" fullWidth={false} onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" fullWidth={false} isLoading={isSaving}>
                            {editTarget ? "Save changes" : "Add service"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}