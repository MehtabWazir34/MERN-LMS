import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardShell from "../../components/layout/DashboardShell";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { createCourse, updateCourse, getCourseById } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";

const EMPTY_FORM = { title: "", description: "", price: "" };

export default function CourseFormPage() {
    const { id } = useParams(); // undefined in create mode
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [form, setForm] = useState(EMPTY_FORM);
    const [poster, setPoster] = useState(null);
    const [existingPosterUrl, setExistingPosterUrl] = useState("");
    const [errors, setErrors] = useState({});
    const [banner, setBanner] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // loading | ready | error | forbidden — only meaningful in edit mode;
    // create mode has nothing to fetch, so it starts "ready".
    const [loadStatus, setLoadStatus] = useState(isEditMode ? "loading" : "ready");

    useEffect(() => {
        if (!isEditMode) return;

        const controller = new AbortController();

        const load = async () => {
            setLoadStatus("loading");
            try {
                const data = await getCourseById(id, { signal: controller.signal });
                const course = data.course;

                // getCourseById returns basic fields to any viewer (it's also the
                // public course-detail endpoint) — ownership isn't enforced by
                // the fetch itself, only by updateCourse's canManageCourse check
                // on submit. Checking here just avoids showing an edit form the
                // save would reject anyway.
                if (course.instructor?._id !== user?._id) {
                    setLoadStatus("forbidden");
                    return;
                }

                setForm({
                    title: course.title,
                    description: course.description,
                    price: String(course.price),
                });
                setExistingPosterUrl(course.poster || "");
                setLoadStatus("ready");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setLoadStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, [id, isEditMode, user?._id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const next = {};
        if (!form.title.trim()) next.title = "Title is required";
        if (!form.description.trim()) next.description = "Description is required";
        if (form.price === "" || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
            next.price = "Enter a valid price";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const payload = { title: form.title, description: form.description, price: form.price };
            if (poster) payload.poster = poster;

            if (isEditMode) {
                await updateCourse(id, payload);
            } else {
                await createCourse(payload);
            }
            navigate("/instructor");
        } catch (err) {
            setBanner({
                variant: "danger",
                message: err.response?.data?.msg || `Failed to ${isEditMode ? "update" : "create"} course`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const pageTitle = isEditMode ? "Edit course" : "Create course";

    if (loadStatus === "loading") {
        return (
            <DashboardShell title={pageTitle}>
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            </DashboardShell>
        );
    }

    if (loadStatus === "forbidden") {
        return (
            <DashboardShell title={pageTitle}>
                <Alert variant="danger">You can only edit your own courses.</Alert>
            </DashboardShell>
        );
    }

    if (loadStatus === "error") {
        return (
            <DashboardShell title={pageTitle}>
                <Alert variant="danger">Couldn't load this course.</Alert>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell title={pageTitle}>
            {banner && (
                <div className="mb-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-lg space-y-4" noValidate>
                <Input
                    id="title"
                    name="title"
                    label="Title"
                    value={form.title}
                    onChange={handleChange}
                    error={errors.title}
                />

                <div className="w-full">
                    <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-text-secondary">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={5}
                        value={form.description}
                        onChange={handleChange}
                        className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.description ? "border-danger" : "border-border"
                            }`}
                    />
                    {errors.description && <p className="mt-1.5 text-xs text-danger">{errors.description}</p>}
                </div>

                <Input
                    id="price"
                    name="price"
                    type="number"
                    label="Price (USD)"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    error={errors.price}
                />

                <div className="w-full">
                    <label htmlFor="poster" className="mb-1.5 block text-sm font-medium text-text-secondary">
                        Poster image{" "}
                        {isEditMode && <span className="text-text-muted">(leave empty to keep current)</span>}
                    </label>
                    {existingPosterUrl && !poster && (
                        <img
                            src={existingPosterUrl}
                            alt="Current poster"
                            className="mb-2 h-32 w-full rounded-md object-cover"
                        />
                    )}
                    <input
                        id="poster"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPoster(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary"
                    />
                </div>

                <div className="flex gap-3">
                    <Button type="submit" isLoading={isSubmitting} fullWidth={false} className="px-6">
                        {isEditMode ? "Save changes" : "Create course"}
                    </Button>
                    <Button type="button" variant="secondary" fullWidth={false} onClick={() => navigate("/instructor")}>
                        Cancel
                    </Button>
                </div>
            </form>
        </DashboardShell>
    );
}