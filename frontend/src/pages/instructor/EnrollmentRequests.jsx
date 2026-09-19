import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { getEnrollmentRequests, respondToEnrollment } from "../../api/courses";

// Pending-only view — approved students live in EnrolledStudents.jsx.
// Both independently call getEnrollmentRequests and filter client-side
// (same self-fetching pattern as the rest of this codebase) since there's
// no separate backend endpoint per status.
export default function EnrollmentRequests({ courseId }) {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [respondingId, setRespondingId] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getEnrollmentRequests(courseId, { signal: controller.signal });
                setRequests(data.enrolledLearners.filter((e) => e.status === "pending"));
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
            // Approved or rejected — either way it leaves the "pending" list.
            setRequests((prev) => prev.filter((r) => r._id !== enrollmentId));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update enrollment" });
        } finally {
            setRespondingId(null);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    if (status === "error") {
        return <Alert variant="danger">Couldn't load enrollment requests.</Alert>;
    }

    return (
        <div>
            {banner && (
                <div className="mb-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {requests.length === 0 ? (
                <p className="text-sm text-text-secondary">No pending enrollment requests.</p>
            ) : (
                <ul className="space-y-3">
                    {requests.map((request) => (
                        <li
                            key={request._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium text-text-primary">{request.learner?.name}</p>
                                <p className="truncate text-sm text-text-secondary">{request.learner?.email}</p>
                            </div>
                            <div className="flex flex-shrink-0 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleRespond(request._id, "approved")}
                                    disabled={respondingId === request._id}
                                    className="rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-sm font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-60"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRespond(request._id, "rejected")}
                                    disabled={respondingId === request._id}
                                    className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                >
                                    Reject
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}