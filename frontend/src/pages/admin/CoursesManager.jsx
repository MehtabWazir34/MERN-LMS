import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { PATHS } from "../../components/layout/dashboardMenus";
import { getManagedCourses, updateCourse, deleteCourse } from "../../api/courses";

const CONTROL =
    "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40";
const LABEL = "mb-1.5 block text-xs font-medium text-text-secondary";
const ACTION =
    "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-60";

export default function CoursesManager() {
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [busyId, setBusyId] = useState(null); // a delete or show/hide is running for this id

    const [search, setSearch] = useState("");
    const [visibility, setVisibility] = useState(""); // "" | active | inactive

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                // For an admin the server returns every course, active and inactive, with its instructor.
                const data = await getManagedCourses({}, { signal: controller.signal });
                setCourses(data.courses);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return courses.filter((course) => {
            if (visibility === "active" && !course.isActive) return false;
            if (visibility === "inactive" && course.isActive) return false;
            if (!query) return true;
            return [course.title, course.category, course.instructor?.name].some((value) =>
                String(value ?? "").toLowerCase().includes(query)
            );
        });
    }, [courses, search, visibility]);

    const handleToggleActive = useCallback(async (course) => {
        setBusyId(course._id);
        setBanner(null);
        try {
            const data = await updateCourse(course._id, { isActive: !course.isActive });
            // Only the visibility changes here; the rest of the card keeps its counts and instructor.
            setCourses((prev) => prev.map((c) => (c._id === course._id ? { ...c, isActive: data.course.isActive } : c)));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update the course" });
        } finally {
            setBusyId(null);
        }
    }, []);

    const handleDelete = useCallback(async (course) => {
        const owner = course.instructor?.name ? ` (${course.instructor.name})` : "";
        if (
            !window.confirm(
                `Delete "${course.title}"${owner}? Its lectures, enrollments, attendance and results are removed too. This cannot be undone.`
            )
        ) {
            return;
        }

        setBusyId(course._id);
        setBanner(null);
        try {
            await deleteCourse(course._id);
            setCourses((prev) => prev.filter((c) => c._id !== course._id));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to delete the course" });
        } finally {
            setBusyId(null);
        }
    }, []);

    if (status === "loading") {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (status === "error") {
        return <Alert variant="danger">Couldn't load courses.</Alert>;
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl text-text-primary">Courses ({courses.length})</h2>
                <Button fullWidth={false} onClick={() => navigate(PATHS.courseCreate)}>
                    + Add course
                </Button>
            </div>

            {banner && (
                <div className="mt-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {courses.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">No courses yet. Add the first one.</p>
            ) : (
                <>
                    <form
                        role="search"
                        aria-label="Filter courses"
                        onSubmit={(e) => e.preventDefault()}
                        className="mt-4 grid gap-3 sm:grid-cols-3"
                    >
                        <div className="sm:col-span-2">
                            <label htmlFor="courses-search" className={LABEL}>
                                Search
                            </label>
                            <input
                                id="courses-search"
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Title, category or instructor"
                                className={CONTROL}
                            />
                        </div>
                        <div>
                            <label htmlFor="courses-visibility" className={LABEL}>
                                Visibility
                            </label>
                            <select
                                id="courses-visibility"
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className={CONTROL}
                            >
                                <option value="">All courses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </form>

                    {filtered.length === 0 ? (
                        <p className="mt-6 text-sm text-text-secondary">No courses match your filters.</p>
                    ) : (
                        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                            {filtered.map((course) => (
                                <li
                                    key={course._id}
                                    className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
                                >
                                    <div className="relative aspect-video w-full overflow-hidden bg-surface-hover">
                                        {course.picture?.url ? (
                                            <img
                                                src={course.picture.url}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
                                                No image
                                            </div>
                                        )}
                                        <span
                                            className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-medium ${course.isActive
                                                    ? "bg-success text-white"
                                                    : "border border-border bg-surface text-text-secondary"
                                                }`}
                                        >
                                            {course.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="flex flex-1 flex-col p-4">
                                        <h3 className="line-clamp-2 font-display text-lg text-text-primary">{course.title}</h3>
                                        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{course.subtitle}</p>
                                        <p className="mt-2 text-xs text-text-muted">
                                            {[course.category, course.mode, course.level, course.duration]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </p>
                                        <p className="mt-2 text-sm text-text-secondary">
                                            Instructor:{" "}
                                            <span className="font-medium text-text-primary">
                                                {course.instructor?.name ?? "—"}
                                            </span>
                                        </p>
                                        <p className="mt-1 text-sm text-text-secondary">
                                            Seats {course.approvedCount}/{course.seats} · {course.videosCount} lecture
                                            {course.videosCount === 1 ? "" : "s"} ·{" "}
                                            <span className="font-medium text-primary">
                                                {course.price > 0 ? `$${course.price}` : "Free"}
                                            </span>
                                        </p>

                                        {course.pendingCount > 0 && (
                                            <Link
                                                to={`${PATHS.courseManage(course._id)}?tab=requests`}
                                                className="mt-2 inline-flex w-fit rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning hover:bg-warning/20"
                                            >
                                                {course.pendingCount} pending request{course.pendingCount === 1 ? "" : "s"}
                                            </Link>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-2 pt-1">
                                            <Link
                                                to={PATHS.courseManage(course._id)}
                                                className="rounded-md bg-primary-btn px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-btn-hover"
                                            >
                                                Manage
                                            </Link>
                                            <Link to={PATHS.courseEdit(course._id)} className={ACTION}>
                                                Edit
                                            </Link>
                                            <Link to={PATHS.courseView(course._id)} className={ACTION}>
                                                View
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(course)}
                                                disabled={busyId === course._id}
                                                className={ACTION}
                                            >
                                                {course.isActive ? "Hide" : "Show"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(course)}
                                                disabled={busyId === course._id}
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
                </>
            )}
        </div>
    );
}