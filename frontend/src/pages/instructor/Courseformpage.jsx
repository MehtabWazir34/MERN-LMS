import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardShell from "../../components/layout/Dashboardshell";
import { PATHS, getAdminMenu, getInstructorMenu } from "../../components/layout/dashboardMenus";
import Input from "../../components/common/Input";
import ListInput from "../../components/common/ListInput";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { createCourse, updateCourse, getCourseById, COURSE_MODES, COURSE_LEVELS } from "../../api/courses";
import { getAllInstructors } from "../../api/admin";
import { useAuth } from "../../context/AuthContext";

const EMPTY_FORM = {
    title: "",
    subtitle: "",
    overview: "",
    category: "",
    mode: "",
    level: "",
    duration: "",
    seats: "",
    price: "",
};

const SUBTITLE_MAX = 150;
const OVERVIEW_MAX = 1500;
const PICTURE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PICTURE_MAX_BYTES = 5 * 1024 * 1024; // same limit as the server

const LABEL = "mb-1.5 block text-sm font-medium text-text-secondary";
const controlClass = (hasError) =>
    `w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 ${hasError ? "border-danger" : "border-border"
    }`;

function Section({ title, description, children }) {
    return (
        <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-lg text-text-primary">{title}</h2>
            {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

function TextAreaField({ id, label, value, onChange, error, rows, maxLength }) {
    return (
        <div className="w-full">
            <label htmlFor={id} className={LABEL}>
                {label}
            </label>
            <textarea
                id={id}
                name={id}
                rows={rows}
                value={value}
                onChange={onChange}
                aria-invalid={Boolean(error)}
                className={controlClass(error)}
            />
            <div className="mt-1.5 flex items-start justify-between gap-3">
                <p className="text-xs text-danger">{error}</p>
                <p className="shrink-0 text-xs text-text-muted">
                    {value.length}/{maxLength}
                </p>
            </div>
        </div>
    );
}

function SelectField({ id, label, value, onChange, options, placeholder, error }) {
    return (
        <div className="w-full">
            <label htmlFor={id} className={LABEL}>
                {label}
            </label>
            <select
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                aria-invalid={Boolean(error)}
                className={controlClass(error)}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>
    );
}

export default function CourseFormPage() {
    const { id } = useParams(); // undefined in create mode
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const { user, role } = useAuth();

    const dashboardPath = role === "admin" ? PATHS.adminCourses : PATHS.instructorHome;

    const [form, setForm] = useState(EMPTY_FORM);
    const [technologies, setTechnologies] = useState([]);
    const [curriculum, setCurriculum] = useState([]);
    const [isActive, setIsActive] = useState(true);
    const [instructorId, setInstructorId] = useState(""); // admin only: who the course belongs to
    const [instructors, setInstructors] = useState([]); // admin only: the choices
    const [picture, setPicture] = useState(null);
    const [picturePreview, setPicturePreview] = useState("");
    const [existingPictureUrl, setExistingPictureUrl] = useState("");
    const [errors, setErrors] = useState({});
    const [banner, setBanner] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // loading | ready | error | forbidden. Create mode has nothing to fetch, so it starts "ready".
    const [loadStatus, setLoadStatus] = useState(isEditMode ? "loading" : "ready");

    useEffect(() => {
        if (!isEditMode) return;

        const controller = new AbortController();

        const load = async () => {
            setLoadStatus("loading");
            try {
                const data = await getCourseById(id, { signal: controller.signal });
                const course = data.course;

                // getCourseById is also the public detail endpoint, so ownership is only
                // enforced by updateCourse on save. Checking here avoids showing a form
                // that the save would reject anyway.
                if (course.instructor?._id !== user?._id && role !== "admin") {
                    setLoadStatus("forbidden");
                    return;
                }

                setForm({
                    title: course.title ?? "",
                    subtitle: course.subtitle ?? "",
                    overview: course.overview ?? "",
                    category: course.category ?? "",
                    mode: course.mode ?? "",
                    level: course.level ?? "",
                    duration: course.duration ?? "",
                    seats: String(course.seats ?? ""),
                    price: course.price ? String(course.price) : "",
                });
                setTechnologies(course.technologies ?? []);
                setCurriculum(course.curriculum ?? []);
                setIsActive(Boolean(course.isActive));
                setInstructorId(course.instructor?._id ?? "");
                setExistingPictureUrl(course.picture?.url || "");
                setLoadStatus("ready");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setLoadStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, [id, isEditMode, user?._id, role]);

    // Admin only: the instructors to choose from
    useEffect(() => {
        if (role !== "admin") return;

        const controller = new AbortController();

        const loadInstructors = async () => {
            try {
                const data = await getAllInstructors({ signal: controller.signal });
                setInstructors(data.instructors);
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setBanner({ variant: "danger", message: "Couldn't load the list of instructors." });
            }
        };

        loadInstructors();
        return () => controller.abort();
    }, [role]);

    // Preview of the newly chosen picture
    useEffect(() => {
        if (!picture) {
            setPicturePreview("");
            return;
        }
        const url = URL.createObjectURL(picture);
        setPicturePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [picture]);

    const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: undefined }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        clearError(name);
    };

    const handlePictureChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            setPicture(null);
            return;
        }
        if (!PICTURE_TYPES.includes(file.type)) {
            setErrors((prev) => ({ ...prev, picture: "Use a JPG, PNG or WebP image" }));
            e.target.value = "";
            return;
        }
        if (file.size > PICTURE_MAX_BYTES) {
            setErrors((prev) => ({ ...prev, picture: "The image must be 5 MB or smaller" }));
            e.target.value = "";
            return;
        }
        clearError("picture");
        setPicture(file);
    };

    // Same rules as the server, so mistakes are caught before the upload starts.
    const validate = () => {
        const next = {};
        const subtitle = form.subtitle.trim();
        const overview = form.overview.trim();
        const seats = Number(form.seats);

        if (role === "admin" && !instructorId) next.instructorId = "Choose an instructor";
        if (!form.title.trim()) next.title = "Title is required";
        if (!subtitle) next.subtitle = "Subtitle is required";
        else if (subtitle.length > SUBTITLE_MAX) next.subtitle = `Subtitle can be at most ${SUBTITLE_MAX} characters`;
        if (!overview) next.overview = "Overview is required";
        else if (overview.length > OVERVIEW_MAX) next.overview = `Overview can be at most ${OVERVIEW_MAX} characters`;
        if (!form.category.trim()) next.category = "Category is required";
        if (!COURSE_MODES.includes(form.mode)) next.mode = "Choose a mode";
        if (!COURSE_LEVELS.includes(form.level)) next.level = "Choose a level";
        if (!form.duration.trim()) next.duration = "Duration is required, for example 12 Weeks";
        if (form.seats === "" || !Number.isInteger(seats) || seats < 1) next.seats = "Enter at least 1 seat";
        if (form.price !== "" && (Number.isNaN(Number(form.price)) || Number(form.price) < 0)) {
            next.price = "Enter a valid price";
        }
        if (technologies.length === 0) next.technologies = "Add at least one technology";
        if (curriculum.length === 0) next.curriculum = "Add at least one curriculum point";
        if (!isEditMode && !picture) next.picture = "A course picture is required";

        setErrors(next);
        return next;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);

        const found = validate();
        const firstInvalid = Object.keys(found)[0];
        if (firstInvalid) {
            document.getElementById(firstInvalid)?.focus();
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: form.title.trim(),
                subtitle: form.subtitle.trim(),
                overview: form.overview.trim(),
                category: form.category.trim(),
                mode: form.mode,
                level: form.level,
                duration: form.duration.trim(),
                seats: form.seats,
                price: form.price === "" ? "0" : form.price,
                isActive,
                technologies,
                curriculum,
            };
            if (role === "admin") payload.instructorId = instructorId;
            if (picture) payload.picture = picture;

            if (isEditMode) {
                await updateCourse(id, payload);
            } else {
                await createCourse(payload);
            }
            navigate(dashboardPath);
        } catch (err) {
            const data = err.response?.data;
            const detail = err.response?.status === 400 && data?.ERR ? `: ${data.ERR}` : "";
            setBanner({
                variant: "danger",
                message: `${data?.msg || `Failed to ${isEditMode ? "update" : "create"} course`}${detail}`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sidebar: the instructor menu, or the admin menu when an admin edits a course
    const menu = role === "admin" ? getAdminMenu() : getInstructorMenu();
    const shellProps = {
        menu,
        activeKey: role === "admin" ? "courses" : isEditMode ? "courses" : "create",
        onSelect: (key) => navigate(`${PATHS.adminHome}?tab=${key}`), // only admin menu items are buttons
    };

    const pageTitle = isEditMode ? "Edit course" : "Create course";

    if (loadStatus === "loading") {
        return (
            <DashboardShell title={pageTitle} {...shellProps}>
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            </DashboardShell>
        );
    }

    if (loadStatus === "forbidden") {
        return (
            <DashboardShell title={pageTitle} {...shellProps}>
                <Alert variant="danger">You can only edit your own courses.</Alert>
            </DashboardShell>
        );
    }

    if (loadStatus === "error") {
        return (
            <DashboardShell title={pageTitle} {...shellProps}>
                <Alert variant="danger">Couldn't load this course.</Alert>
            </DashboardShell>
        );
    }

    const shownPicture = picturePreview || existingPictureUrl;

    return (
        <DashboardShell
            title={pageTitle}
            {...shellProps}
            actions={
                isEditMode ? (
                    <Link to={PATHS.courseManage(id)} className="text-sm font-medium text-primary hover:underline">
                        Manage this course →
                    </Link>
                ) : null
            }
        >
            {banner && (
                <div className="mb-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6" noValidate>
                {role === "admin" && (
                    <Section title="Instructor">
                        <div className="w-full">
                            <label htmlFor="instructorId" className={LABEL}>
                                Instructor
                            </label>
                            <select
                                id="instructorId"
                                value={instructorId}
                                onChange={(e) => {
                                    setInstructorId(e.target.value);
                                    clearError("instructorId");
                                }}
                                aria-invalid={Boolean(errors.instructorId)}
                                className={controlClass(errors.instructorId)}
                            >
                                <option value="">Select instructor</option>
                                {instructors.map((instructor) => (
                                    <option key={instructor._id} value={instructor._id}>
                                        {instructor.name} ({instructor.email}){instructor.verifiedStatus ? "" : " - unverified"}
                                    </option>
                                ))}
                            </select>
                            {errors.instructorId && <p className="mt-1.5 text-xs text-danger">{errors.instructorId}</p>}
                            <p className="mt-1.5 text-xs text-text-muted">
                                The instructor manages the course's lectures, requests, attendance and results. Changing it
                                moves the course to that instructor.
                            </p>
                        </div>
                    </Section>
                )}

                <Section title="Basic information">
                    <Input id="title" name="title" label="Title" value={form.title} onChange={handleChange} error={errors.title} />
                    <TextAreaField
                        id="subtitle"
                        label="Subtitle"
                        rows={2}
                        maxLength={SUBTITLE_MAX}
                        value={form.subtitle}
                        onChange={handleChange}
                        error={errors.subtitle}
                    />
                    <TextAreaField
                        id="overview"
                        label="Overview"
                        rows={6}
                        maxLength={OVERVIEW_MAX}
                        value={form.overview}
                        onChange={handleChange}
                        error={errors.overview}
                    />
                    <Input
                        id="category"
                        name="category"
                        label="Category"
                        placeholder="e.g. Web Development"
                        value={form.category}
                        onChange={handleChange}
                        error={errors.category}
                    />
                </Section>

                <Section title="Course details">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <SelectField
                            id="mode"
                            label="Mode"
                            placeholder="Select mode"
                            options={COURSE_MODES}
                            value={form.mode}
                            onChange={handleChange}
                            error={errors.mode}
                        />
                        <SelectField
                            id="level"
                            label="Level"
                            placeholder="Select level"
                            options={COURSE_LEVELS}
                            value={form.level}
                            onChange={handleChange}
                            error={errors.level}
                        />
                        <Input
                            id="duration"
                            name="duration"
                            label="Duration"
                            placeholder="e.g. 12 Weeks"
                            value={form.duration}
                            onChange={handleChange}
                            error={errors.duration}
                        />
                        <Input
                            id="seats"
                            name="seats"
                            type="number"
                            label="Seats"
                            min="1"
                            step="1"
                            value={form.seats}
                            onChange={handleChange}
                            error={errors.seats}
                        />
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            label="Price (USD), leave empty for free"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={handleChange}
                            error={errors.price}
                        />
                    </div>
                </Section>

                <Section title="Technologies" description="Tools and technologies learners will use.">
                    <ListInput
                        id="technologies"
                        label="Technologies"
                        placeholder="e.g. React, then press Enter"
                        hint="Press Enter or comma to add each one."
                        items={technologies}
                        onChange={(items) => {
                            setTechnologies(items);
                            clearError("technologies");
                        }}
                        error={errors.technologies}
                    />
                </Section>

                <Section title="Curriculum" description="What the course covers, in order.">
                    <ListInput
                        id="curriculum"
                        label="Curriculum points"
                        variant="list"
                        multiline
                        placeholder="Describe one topic, then press Add"
                        items={curriculum}
                        onChange={(items) => {
                            setCurriculum(items);
                            clearError("curriculum");
                        }}
                        error={errors.curriculum}
                    />
                </Section>

                <Section title="Cover picture">
                    <div className="w-full">
                        <label htmlFor="picture" className={LABEL}>
                            Picture {isEditMode && <span className="text-text-muted">(leave empty to keep the current one)</span>}
                        </label>
                        {shownPicture && (
                            <img
                                src={shownPicture}
                                alt={picturePreview ? "New course picture preview" : "Current course picture"}
                                className="mb-2 h-40 w-full max-w-md rounded-md object-cover"
                            />
                        )}
                        <input
                            id="picture"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePictureChange}
                            aria-invalid={Boolean(errors.picture)}
                            className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary"
                        />
                        <p className="mt-1.5 text-xs text-text-muted">JPG, PNG or WebP, up to 5 MB.</p>
                        {errors.picture && <p className="mt-1.5 text-xs text-danger">{errors.picture}</p>}
                    </div>
                </Section>

                <Section title="Visibility">
                    <label className="flex items-start gap-3 text-sm text-text-secondary">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="mt-0.5"
                        />
                        <span>
                            <span className="font-medium text-text-primary">Active</span>
                            <span className="block text-xs text-text-muted">
                                Shown in the course list and open for enrollment. Turn off to hide the course.
                            </span>
                        </span>
                    </label>
                </Section>

                <div className="flex gap-3">
                    <Button type="submit" isLoading={isSubmitting} fullWidth={false} className="px-6">
                        {isEditMode ? "Save changes" : "Create course"}
                    </Button>
                    <Button type="button" variant="secondary" fullWidth={false} onClick={() => navigate(dashboardPath)}>
                        Cancel
                    </Button>
                </div>
            </form>
        </DashboardShell>
    );
}