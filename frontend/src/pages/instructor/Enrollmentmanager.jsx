import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { getEnrollmentRequests, respondToEnrollment } from "../../api/courses";

// view="pending" -> Enrollment Requests tab: shows pending AND rejected
// (rejected needs somewhere to live so it's reviewable/reconsiderable —
// it was previously invisible in every tab, which was the actual bug).
// view="approved" -> Enrolled Students tab (Remove only).
export default function EnrollmentManager({ courseId, view }) {
    const [enrollments, setEnrollments] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [respondingId, setRespondingId] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getEnrollmentRequests(courseId, { signal: controller.signal });
                setEnrollments(data.enrolledLearners);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, [courseId]);

    const handleRespond = async (enrollmentId, decision) => {
        setRespondingId(enrollmentId);
        setBanner(null);
        try {
            await respondToEnrollment(courseId, enrollmentId, decision);
            setEnrollments((prev) =>
                prev.map((enrollment) =>
                    enrollment._id === enrollmentId ? { ...enrollment, status: decision } : enrollment
                )
            );
        } catch (err) {
            setBanner({
                variant: "danger",
                message: err.response?.data?.msg || "Failed to update enrollment",
            });
        } finally {
            setRespondingId(null);
        }
    };

    const visible =
        view === "pending"
            ? enrollments.filter((e) => e.status === "pending" || e.status === "rejected")
            : enrollments.filter((e) => e.status === "approved");

    const heading = view === "pending" ? "Enrollment requests" : "Enrolled students";
    const emptyText = view === "pending" ? "No enrollment requests yet." : "No enrolled students yet.";

    const statusBadge = (s) => {
        if (s === "rejected") {
            return <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">Rejected</span>;
        }
        return null; // "pending" needs no badge — it's the default/only other state in this view
    };

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">{heading}</h2>

            {banner && (
                <div className="mt-3">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {status === "loading" && (
                <div className="mt-6 flex justify-center">
                    <Spinner />
                </div>
            )}

            {status === "error" && (
                <div className="mt-4">
                    <Alert variant="danger">Couldn't load {heading.toLowerCase()}.</Alert>
                </div>
            )}

            {status === "success" && visible.length === 0 && (
                <p className="mt-4 text-sm text-text-secondary">{emptyText}</p>
            )}

            {status === "success" && visible.length > 0 && (
                <ul className="mt-4 space-y-3">
                    {visible.map((enrollment) => (
                        <li
                            key={enrollment._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="truncate font-medium text-text-primary">{enrollment.learner?.name}</p>
                                    {statusBadge(enrollment.status)}
                                </div>
                                <p className="truncate text-sm text-text-secondary">{enrollment.learner?.email}</p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {view === "pending" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleRespond(enrollment._id, "approved")}
                                            disabled={respondingId === enrollment._id}
                                            className="rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-sm font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-60"
                                        >
                                            Approve
                                        </button>
                                        {enrollment.status !== "rejected" && (
                                            <button
                                                type="button"
                                                onClick={() => handleRespond(enrollment._id, "rejected")}
                                                disabled={respondingId === enrollment._id}
                                                className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                            >
                                                Reject
                                            </button>
                                        )}
                                    </>
                                )}

                                {view === "approved" && (
                                    <button
                                        type="button"
                                        onClick={() => handleRespond(enrollment._id, "rejected")}
                                        disabled={respondingId === enrollment._id}
                                        className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}