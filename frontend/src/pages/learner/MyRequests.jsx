import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { getMyEnrollments } from "../../api/courses";

const STATUS_STYLES = {
    pending: "bg-warning/10 text-warning",
    approved: "bg-success/10 text-success",
    rejected: "bg-danger/10 text-danger",
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
                if(data?.success){
                    setEnrollments(data?.enrollments);
                } 
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
                    You haven't requested to enroll in any courses yet.
                </p>
            ) : (
                <ul className="mt-4 space-y-2">
                    {enrollments.map((enrollment) => (
                        <li
                            key={enrollment.course._id}
                            className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3"
                        >
                            <span className="text-sm font-medium text-text-primary">{enrollment.course.title}</span>
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[enrollment.status]
                                    }`}
                            >
                                {enrollment.status}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}