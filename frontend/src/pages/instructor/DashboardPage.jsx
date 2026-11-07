import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardShell from "../../components/layout/Dashboardshell";
import { PATHS, getInstructorMenu } from "../../components/layout/dashboardMenus";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import { getManagedCourses, deleteCourse } from "../../api/courses";

export default function InstructorDashboardPage() {
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        // AbortController cancels the request on unmount instead of only ignoring its result.
        const controller = new AbortController();

        const loadCourses = async () => {
            setStatus("loading");
            try {
                // The server returns only this instructor's courses, active and inactive.
                const data = await getManagedCourses({}, { signal: controller.signal });
                setCourses(data.courses);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return; // unmount/re-run, not a real failure
                setStatus("error");
            }
        };

        loadCourses();
        return () => controller.abort();
    }, []);

    const handleDelete = useCallback(async (course) => {
        if (
            !window.confirm(
                `Delete "${course.title}"? Its lectures and enrollments are removed too. This cannot be undone.`
            )
        ) {
            return;
        }

        setDeletingId(course._id);
        setBanner(null);
        try {
            await deleteCourse(course._id);
            setCourses((prev) => prev.filter((c) => c._id !== course._id));
        } catch (err) {
            setBanner({
                variant: "danger",
                message: err.response?.data?.msg || "Failed to delete course",
            });
        } finally {
            setDeletingId(null);
        }
    }, []);

    return (
        <DashboardShell
            title="Instructor dashboard"
            menu={getInstructorMenu()}
            activeKey="courses"
            actions={
                <Button fullWidth={false} onClick={() => navigate(PATHS.courseCreate)}>
                    + Create course
                </Button>
            }
        >
            <h2 className="font-display text-xl text-text-primary">
                My courses{status === "success" ? ` (${courses.length})` : ""}
            </h2>

            {banner && (
                <div className="mt-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {status === "loading" && (
                <div className="mt-8 flex justify-center">
                    <Spinner />
                </div>
            )}

            {status === "error" && (
                <div className="mt-4">
                    <Alert variant="danger">Couldn't load your courses right now.</Alert>
                </div>
            )}

            {status === "success" && courses.length === 0 && (
                <p className="mt-4 text-text-secondary">
                    You haven't created any courses yet. Click "Create course" to get started.
                </p>
            )}

            {status === "success" && courses.length > 0 && (
                <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {courses.map((course) => (
                        <li key={course._id} className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
                            <div className="relative aspect-video w-full overflow-hidden bg-surface-hover">
                                {course.picture?.url ? (
                                    <img
                                        src={course.picture.url}
                                        alt={course.title}
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
                                    {[course.mode, course.level, course.duration].filter(Boolean).join(" · ")}
                                </p>
                                <p className="mt-2 text-sm text-text-secondary">
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
                                    <Link
                                        to={PATHS.courseEdit(course._id)}
                                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        Edit
                                    </Link>
                                    <Link
                                        to={PATHS.courseView(course._id)}
                                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        View
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(course)}
                                        disabled={deletingId === course._id}
                                        className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                    >
                                        {deletingId === course._id ? "Deleting…" : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </DashboardShell>
    );
}