import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { getEnrollmentRequests, respondToEnrollment } from "../../api/courses";

const STATUS_STYLES = {
    pending: "bg-warning/10 text-warning",
    approved: "bg-success/10 text-success",
    rejected: "bg-danger/10 text-danger",
};

// Fetches its own data (unlike LectureManager) because getCourseById
// never populates enrolledLearners.learner with name/email — only
// getEnrollmentRequests does. Parent (CourseManagePage) has no usable
// enrollment data to hand down here.
export default function EnrollmentManager({ courseId }) {
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
            // respondToEnrollment's response has no body worth reading here —
            // just reflect the decision we know succeeded, instead of
            // re-fetching the whole list for one row's status.
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

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">Enrollment requests</h2>

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
                    <Alert variant="danger">Couldn't load enrollment requests.</Alert>
                </div>
            )}

            {status === "success" && enrollments.length === 0 && (
                <p className="mt-4 text-sm text-text-secondary">No enrollment requests yet.</p>
            )}

            {status === "success" && enrollments.length > 0 && (
                <ul className="mt-4 space-y-3">
                    {enrollments.map((enrollment) => (
                        <li
                            key={enrollment._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium text-text-primary">{enrollment.learner?.name}</p>
                                <p className="truncate text-sm text-text-secondary">{enrollment.learner?.email}</p>
                            </div>

                            <div className="flex flex-shrink-0 items-center gap-2">
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[enrollment.status]
                                        }`}
                                >
                                    {enrollment.status}
                                </span>

                                {enrollment.status !== "approved" && (
                                    <button
                                        type="button"
                                        onClick={() => handleRespond(enrollment._id, "approved")}
                                        disabled={respondingId === enrollment._id}
                                        className="rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-sm font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-60"
                                    >
                                        Approve
                                    </button>
                                )}
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
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}