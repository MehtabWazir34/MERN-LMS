import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PublicLayout from "../../components/layout/Publiclayout.jsx";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { getCourseById, requestEnroll } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/roles";

export default function CourseDetailPage() {
    const { id } = useParams();
    const { isAuthenticated, role } = useAuth();

    const [course, setCourse] = useState(null);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [enrollBanner, setEnrollBanner] = useState(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [justRequested, setJustRequested] = useState(false);

    useEffect(() => {
        const load = async () => {
            setStatus("loading");
            try {
                const data = await getCourseById(id);
                setCourse(data.course);
                setStatus("success");
            } catch {
                setStatus("error");
            }
        };
        load();
    }, [id]);

    const handleEnroll = async () => {
        setIsEnrolling(true);
        setEnrollBanner(null);
        try {
            const data = await requestEnroll(id);
            setEnrollBanner({ variant: "success", message: data.msg });
            setJustRequested(true);
        } catch (err) {
            // Covers the 409 "already pending/approved/rejected" case too —
            // the backend's message already says which, no separate status
            // check needed (see chat note on why there's no such endpoint yet).
            setEnrollBanner({
                variant: "danger",
                message: err.response?.data?.msg || "Failed to send enrollment request",
            });
        } finally {
            setIsEnrolling(false);
        }
    };

    if (status === "loading") {
        return (
            <PublicLayout>
                <div className="flex justify-center py-24">
                    <Spinner />
                </div>
            </PublicLayout>
        );
    }

    if (status === "error" || !course) {
        return (
            <PublicLayout>
                <div className="mx-auto max-w-2xl px-6 py-20">
                    <Alert variant="danger">This course couldn't be found.</Alert>
                </div>
            </PublicLayout>
        );
    }

    // getCourseById strips `videos` from the response unless the viewer is
    // the owning instructor, an admin, or an approved learner — so its
    // presence here IS the "unlocked" signal, no separate flag needed.
    const hasFullAccess = Array.isArray(course.videos);
    const showEnrollCta = isAuthenticated && role === ROLES.LEARNER && !hasFullAccess;

    return (
        <PublicLayout>
            <div className="mx-auto max-w-4xl px-6 py-12">
                {course.poster && (
                    <img
                        src={course.poster}
                        alt={course.title}
                        className="mb-6 aspect-video w-full rounded-lg object-cover"
                    />
                )}

                <h1 className="font-display text-3xl text-text-primary">{course.title}</h1>
                <p className="mt-2 text-sm text-text-secondary">
                    By {course.instructor?.name} · <span className="font-medium text-primary">${course.price}</span>
                </p>
                <p className="mt-6 text-text-secondary">{course.description}</p>

                {enrollBanner && (
                    <div className="mt-6">
                        <Alert variant={enrollBanner.variant}>{enrollBanner.message}</Alert>
                    </div>
                )}

                <div className="mt-6 max-w-xs">
                    {!isAuthenticated && (
                        <Link
                            to="/signin"
                            className="inline-flex w-full items-center justify-center rounded-md bg-primary-btn px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-btn-hover"
                        >
                            Sign in to enroll
                        </Link>
                    )}

                    {isAuthenticated && role === ROLES.LEARNER && hasFullAccess && (
                        <Alert variant="success">You're enrolled in this course.</Alert>
                    )}

                    {showEnrollCta && (
                        <Button onClick={handleEnroll} isLoading={isEnrolling} disabled={justRequested}>
                            {justRequested ? "Request sent" : "Request to enroll"}
                        </Button>
                    )}
                </div>

                <div className="mt-10">
                    <h2 className="font-display text-xl text-text-primary">Lectures</h2>

                    {hasFullAccess ? (
                        course.videos.length === 0 ? (
                            <p className="mt-2 text-sm text-text-secondary">No lectures uploaded yet.</p>
                        ) : (
                            <ul className="mt-4 space-y-2">
                                {course.videos.map((video) => (
                                    <li key={video._id} className="rounded-md border border-border bg-surface px-4 py-3">
                                        <p className="font-medium text-text-primary">{video.title}</p>
                                        <p className="text-sm text-text-secondary">{video.description}</p>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center text-text-secondary">
                            Enroll in this course to unlock lecture content.
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}