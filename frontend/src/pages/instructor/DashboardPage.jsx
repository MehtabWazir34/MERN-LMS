import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardShell from "../../components/layout/DashboardShell";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import { getAllCourses, deleteCourse } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";

export default function InstructorDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Set once per mount — used as a dependency below without re-triggering
    // the fetch every render (user is stable from context, but this keeps
    // the effect's dependency list honest about what it actually reads).
    const instructorId = user?._id;

    useEffect(() => {
        // AbortController, not just a `let cancelled` flag: this actually
        // cancels the in-flight request on unmount/re-run, instead of just
        // ignoring its result — cheaper on the network and avoids a
        // setState-after-unmount warning if the instructor navigates away
        // before the response lands.
        const controller = new AbortController();

        const loadCourses = async () => {
            setStatus("loading");
            try {
                const data = await getAllCourses({ signal: controller.signal });
                // No "my courses" endpoint exists for instructors yet — filtering
                // client-side against the public course list rather than adding
                // a new backend route just for this.
                const mine = data.courses.filter((c) => c.instructor?._id === instructorId);
                setCourses(mine);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return; // unmount/re-run, not a real failure
                setStatus("error");
            }
        };

        loadCourses();
        return () => controller.abort();
    }, [instructorId]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm("Delete this course? This cannot be undone.")) return;

        setDeletingId(id);
        setBanner(null);
        try {
            await deleteCourse(id);
            setCourses((prev) => prev.filter((c) => c._id !== id));
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
        <DashboardShell title="Instructor dashboard">
            <Link to="/" className="text-sm font-medium text-primary hover:underline border-border bg-surface p-2 rounded-lg ">
                           ← Back to Home
                        </Link>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <p>Your courses, enrollment requests, grading.</p>
                <Button fullWidth={false} onClick={() => navigate("/instructor/courses/new")}>
                    + Create course
                </Button>
            </div>

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
                <p className="mt-8 text-text-secondary">
                    You haven't created any courses yet — click "Create course" to get started.
                </p>
            )}

            {status === "success" && courses.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {courses.map((course) => (
                        <div key={course._id} className="rounded-lg border border-border bg-surface p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="truncate font-display text-lg text-text-primary">{course.title}</h3>
                                    <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{course.description}</p>
                                    <p className="mt-2 text-sm font-medium text-primary">${course.price}</p>
                                </div>
                                {course.poster && (
                                    <img
                                        src={course.poster}
                                        alt={course.title}
                                        className="h-16 w-24 flex-shrink-0 rounded object-cover"
                                    />
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                    to={`/instructor/courses/${course._id}/manage`}
                                    className="rounded-md bg-primary-btn px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-btn-hover"
                                >
                                    Manage
                                </Link>
                                <Link
                                    to={`/instructor/courses/${course._id}/edit`}
                                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                >
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(course._id)}
                                    disabled={deletingId === course._id}
                                    className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                >
                                    {deletingId === course._id ? "Deleting…" : "Delete"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardShell>
    );
}