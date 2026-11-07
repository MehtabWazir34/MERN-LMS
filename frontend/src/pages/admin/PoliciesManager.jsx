import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";
import TextArea from "../../components/common/TextArea";
import Modal from "../../components/layout/Modal";
import { getPoliciesAdmin, savePolicy, POLICY_PAGES, MAX_POLICY_SECTIONS } from "../../api/content";

const TITLE_MAX = 120;
const INTRO_MAX = 1500;
const HEADING_MAX = 150;
const BODY_MAX = 6000;
const SMALL_BUTTON =
    "rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40";

// Sections need a stable key while they are being edited and reordered.
let sectionCounter = 0;
const newSection = (heading = "", body = "") => ({ id: `section-${++sectionCounter}`, heading, body });

export default function PoliciesManager() {
    const [policies, setPolicies] = useState({}); // { [slug]: policy }
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [busySlug, setBusySlug] = useState(null); // a show/hide is running for this page

    const [editPage, setEditPage] = useState(null); // { slug, label } of the page being edited
    const [form, setForm] = useState({ title: "", intro: "", isActive: true });
    const [sections, setSections] = useState([]);
    const [errors, setErrors] = useState({}); // { title, sections }
    const [rowErrors, setRowErrors] = useState({}); // { [sectionId]: message }
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getPoliciesAdmin({ signal: controller.signal });
                setPolicies(Object.fromEntries(data.policies.map((p) => [p.slug, p])));
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    const openEdit = (page) => {
        const existing = policies[page.slug];
        setEditPage(page);
        setForm({
            title: existing?.title ?? page.label,
            intro: existing?.intro ?? "",
            isActive: existing ? Boolean(existing.isActive) : true,
        });
        setSections(
            existing?.sections?.length
                ? existing.sections.map((s) => newSection(s.heading, s.body))
                : [newSection()]
        );
        setErrors({});
        setRowErrors({});
        setFormError(null);
    };

    const closeEdit = () => setEditPage(null);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const updateSection = (id, field, value) => {
        setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
        setRowErrors((prev) => ({ ...prev, [id]: undefined }));
        setErrors((prev) => ({ ...prev, sections: undefined }));
    };

    const addSection = () => {
        if (sections.length >= MAX_POLICY_SECTIONS) return;
        setSections((prev) => [...prev, newSection()]);
    };

    const removeSection = (id) => setSections((prev) => prev.filter((s) => s.id !== id));

    const moveSection = (index, step) => {
        const target = index + step;
        if (target < 0 || target >= sections.length) return;
        setSections((prev) => {
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        // Rows left completely empty are ignored; a half-filled row is an error.
        const filled = sections.filter((s) => s.heading.trim() || s.body.trim());
        const nextErrors = {};
        const nextRowErrors = {};

        if (!form.title.trim()) nextErrors.title = "Title is required";
        if (filled.length === 0) nextErrors.sections = "Add at least one section";
        filled.forEach((s) => {
            if (!s.heading.trim() || !s.body.trim()) nextRowErrors[s.id] = "Both the heading and the text are needed";
        });

        setErrors(nextErrors);
        setRowErrors(nextRowErrors);
        if (Object.keys(nextErrors).length > 0 || Object.keys(nextRowErrors).length > 0) return;

        setIsSaving(true);
        try {
            const data = await savePolicy(editPage.slug, {
                title: form.title.trim(),
                intro: form.intro.trim(),
                isActive: form.isActive,
                sections: filled.map((s) => ({ heading: s.heading.trim(), body: s.body.trim() })),
            });
            setPolicies((prev) => ({ ...prev, [editPage.slug]: data.policy }));
            setBanner({ variant: "success", message: `${editPage.label} saved.` });
            closeEdit();
        } catch (err) {
            const data = err.response?.data;
            const detail = err.response?.status === 400 && data?.ERR ? `: ${data.ERR}` : "";
            setFormError(`${data?.msg || "Failed to save the page"}${detail}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (page) => {
        const existing = policies[page.slug];
        if (!existing) return;
        setBusySlug(page.slug);
        setBanner(null);
        try {
            // Only the visibility is sent; the content and the "last updated" date stay as they are.
            const data = await savePolicy(page.slug, { isActive: !existing.isActive });
            setPolicies((prev) => ({ ...prev, [page.slug]: data.policy }));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update the page" });
        } finally {
            setBusySlug(null);
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
        return <Alert variant="danger">Couldn't load the policy pages.</Alert>;
    }

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">Policies</h2>
            <p className="mt-1 text-sm text-text-muted">
                Each page is a list of sections; the website shows them as questions that open and close.
            </p>

            {banner && (
                <div className="mt-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            <ul className="mt-4 space-y-3">
                {POLICY_PAGES.map((page) => {
                    const policy = policies[page.slug];
                    return (
                        <li key={page.slug} className="rounded-lg border border-border bg-surface p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-medium text-text-primary">{page.label}</h3>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${!policy
                                                    ? "border border-border bg-surface text-text-secondary"
                                                    : policy.isActive
                                                        ? "bg-success/10 text-success"
                                                        : "border border-border bg-surface text-text-secondary"
                                                }`}
                                        >
                                            {!policy ? "Not created yet" : policy.isActive ? "Visible" : "Hidden"}
                                        </span>
                                    </div>
                                    {policy ? (
                                        <p className="mt-1 text-sm text-text-secondary">
                                            {policy.sections.length} section{policy.sections.length === 1 ? "" : "s"} · last
                                            updated {new Date(policy.effectiveDate).toLocaleDateString()}
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-sm text-text-secondary">Create this page to show it on the website.</p>
                                    )}
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(page)}
                                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        {policy ? "Edit" : "Create"}
                                    </button>
                                    {policy && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(page)}
                                            disabled={busySlug === page.slug}
                                            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-60"
                                        >
                                            {policy.isActive ? "Hide" : "Show"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <Modal
                isOpen={Boolean(editPage)}
                onClose={closeEdit}
                title={editPage ? `${policies[editPage.slug] ? "Edit" : "Create"} ${editPage.label.toLowerCase()}` : ""}
                maxWidth="max-w-3xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {formError && <Alert variant="danger">{formError}</Alert>}

                    <Input
                        id="policy-title"
                        name="title"
                        label="Page title"
                        maxLength={TITLE_MAX}
                        value={form.title}
                        onChange={handleFormChange}
                        error={errors.title}
                    />
                    <TextArea
                        id="policy-intro"
                        name="intro"
                        label="Introduction (optional)"
                        rows={3}
                        maxLength={INTRO_MAX}
                        value={form.intro}
                        onChange={handleFormChange}
                    />

                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-text-secondary">
                                Sections ({sections.length}/{MAX_POLICY_SECTIONS})
                            </p>
                        </div>
                        {errors.sections && <p className="mt-1.5 text-xs text-danger">{errors.sections}</p>}

                        <ol className="mt-3 space-y-3">
                            {sections.map((section, index) => (
                                <li key={section.id} className="rounded-md border border-border bg-surface p-3">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-text-muted">Section {index + 1}</span>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => moveSection(index, -1)}
                                                disabled={index === 0}
                                                aria-label={`Move section ${index + 1} up`}
                                                className={SMALL_BUTTON}
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveSection(index, 1)}
                                                disabled={index === sections.length - 1}
                                                aria-label={`Move section ${index + 1} down`}
                                                className={SMALL_BUTTON}
                                            >
                                                ↓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeSection(section.id)}
                                                aria-label={`Remove section ${index + 1}`}
                                                className={`${SMALL_BUTTON} hover:text-danger`}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Input
                                            id={`${section.id}-heading`}
                                            label="Heading (the question)"
                                            maxLength={HEADING_MAX}
                                            value={section.heading}
                                            onChange={(e) => updateSection(section.id, "heading", e.target.value)}
                                            error={rowErrors[section.id]}
                                        />
                                        <TextArea
                                            id={`${section.id}-body`}
                                            label="Text (the answer; a blank line starts a new paragraph)"
                                            rows={4}
                                            maxLength={BODY_MAX}
                                            value={section.body}
                                            onChange={(e) => updateSection(section.id, "body", e.target.value)}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <button
                            type="button"
                            onClick={addSection}
                            disabled={sections.length >= MAX_POLICY_SECTIONS}
                            className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            + Add section
                        </button>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleFormChange} />
                        Visible on the website
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" fullWidth={false} onClick={closeEdit}>
                            Cancel
                        </Button>
                        <Button type="submit" fullWidth={false} isLoading={isSaving}>
                            Save page
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}