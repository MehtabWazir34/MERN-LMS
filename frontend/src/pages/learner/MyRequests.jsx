import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { getMyEnrollments } from "../../api/courses";

const STATUS_STYLES = {
    pending: "bg-warning/10 text-warning",
    approved: "bg-success/10 text-success",
    rejected: "bg-danger/10 text-danger",
};

const STATUS_HINTS = {
    pending: "Waiting for the instructor's decision.",
    approved: "You're enrolled in this course.",
    rejected: "Not approved. You can send a new request from the course page.",
};

export default function MyRequests() {
    const [enrollments, setEnrollments] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getMyEnrollments({ signal: controller.signal });
                setEnrollments(data.enrollments ?? []);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    if (status === "loading") {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (status === "error") {
        return <Alert variant="danger">Couldn't load your requests.</Alert>;
    }

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">My requests</h2>

            {enrollments.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">
                    You haven't requested to enroll in any courses yet.{" "}
                    <Link to="/courses" className="font-medium text-primary hover:underline">
                        Browse courses
                    </Link>
                </p>
            ) : (
                <ul className="mt-4 space-y-2">
                    {enrollments.map(({ course, status: requestStatus }) => (
                        <li
                            key={course._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                {course.picture?.url ? (
                                    <img
                                        src={course.picture.url}
                                        alt=""
                                        loading="lazy"
                                        className="h-12 w-16 shrink-0 rounded object-cover"
                                    />
                                ) : (
                                    <div className="h-12 w-16 shrink-0 rounded bg-surface-hover" />
                                )}
                                <div className="min-w-0">
                                    <Link
                                        to={`/courses/${course._id}`}
                                        className="block truncate text-sm font-medium text-text-primary hover:underline"
                                    >
                                        {course.title}
                                    </Link>
                                    <p className="truncate text-xs text-text-muted">{STATUS_HINTS[requestStatus]}</p>
                                </div>
                            </div>
                            <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[requestStatus] ?? "bg-surface-hover text-text-secondary"
                                    }`}
                            >
                                {requestStatus}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}