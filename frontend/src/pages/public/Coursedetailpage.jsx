import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import PublicLayout from "../../components/layout/Publiclayout";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/layout/Modal";
import { PATHS } from "../../components/layout/dashboardMenus";
import useSeo, { companyCanonical } from "../../hooks/useSeo";
import { getCourseById, getMyEnrollments, requestEnroll } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/roles";

const EMPTY_ENROLL_FORM = { contactNumber: "", address: "" };

export default function CourseDetailPage() {
    const { id } = useParams();
    const location = useLocation();
    const { isAuthenticated, role, user } = useAuth();

    const [course, setCourse] = useState(null);
    const [status, setStatus] = useState("loading"); // loading | success | error

    // The learner's own request for this course: null | pending | approved | rejected
    const [myStatus, setMyStatus] = useState(null);

    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [enrollForm, setEnrollForm] = useState(EMPTY_ENROLL_FORM);
    const [enrollErrors, setEnrollErrors] = useState({});
    const [enrollBanner, setEnrollBanner] = useState(null);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const [playingVideo, setPlayingVideo] = useState(null); // the video object, or null when closed

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getCourseById(id, { signal: controller.signal });
                setCourse(data.course);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, [id]);

    // For learners: is there already a request for this course? Lets the button say
    // "Request pending" instead of waiting for the server to refuse a second request.
    useEffect(() => {
        if (!isAuthenticated || role !== ROLES.LEARNER) {
            setMyStatus(null);
            return;
        }

        const controller = new AbortController();

        const loadMyStatus = async () => {
            try {
                const data = await getMyEnrollments({ signal: controller.signal });
                const entry = data.enrollments.find((e) => e.course._id === id);
                setMyStatus(entry?.status ?? null);
            } catch {
                // Optional extra: the page works without it, the server still guards the request.
            }
        };

        loadMyStatus();
        return () => controller.abort();
    }, [id, isAuthenticated, role]);

    // getCourseById strips `videos` unless the viewer is the owning instructor, an admin or an
    // approved learner, so its presence IS the "unlocked" signal.
    const hasFullAccess = Boolean(course) && Array.isArray(course.videos);
    // Hidden courses are only visible to people who have access to them.
    const isUnavailable = Boolean(course) && !course.isActive && !hasFullAccess;

    useSeo({
        title: course && !isUnavailable ? course.title : undefined,
        description: course ? course.subtitle || course.overview : undefined,
        image: course?.picture?.url,
        canonical: course ? companyCanonical(`/courses/${id}`) : undefined,
        noindex: isUnavailable,
    });

    const openEnrollModal = () => {
        setEnrollForm(EMPTY_ENROLL_FORM);
        setEnrollErrors({});
        setIsEnrollModalOpen(true);
    };

    const closeEnrollModal = () => setIsEnrollModalOpen(false);

    const handleEnrollFormChange = (e) => {
        const { name, value } = e.target;
        setEnrollForm((prev) => ({ ...prev, [name]: value }));
    };

    const validateEnrollForm = () => {
        const next = {};
        if (!enrollForm.contactNumber.trim()) next.contactNumber = "Contact number is required";
        if (!enrollForm.address.trim()) next.address = "Address is required";
        setEnrollErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleEnrollSubmit = async (e) => {
        e.preventDefault();
        if (!validateEnrollForm()) return;

        setIsEnrolling(true);
        setEnrollBanner(null);
        try {
            const data = await requestEnroll(id, enrollForm);
            setEnrollBanner({ variant: "success", message: data.msg });
            setMyStatus("pending");
            closeEnrollModal();
        } catch (err) {
            // Covers the 409 cases too (already requested, course full): the server's message says which.
            setEnrollBanner({
                variant: "danger",
                message: err.response?.data?.msg || "Failed to send enrollment request",
            });
            closeEnrollModal();
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

    if (status === "error" || !course || isUnavailable) {
        return (
            <PublicLayout>
                <div className="mx-auto max-w-2xl px-6 py-20 text-center">
                    <h1 className="font-display text-3xl text-text-primary">
                        {isUnavailable ? "This course is not available" : "Course not found"}
                    </h1>
                    <p className="mt-3 text-text-secondary">
                        {isUnavailable
                            ? "It isn't open right now. Have a look at our other courses."
                            : "This course couldn't be found. It may have been removed."}
                    </p>
                    <Link to="/courses" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
                        Browse all courses →
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    const isLearner = isAuthenticated && role === ROLES.LEARNER;
    const isFull = course.seatsLeft === 0;
    const canManage =
        isAuthenticated &&
        (role === ROLES.ADMIN || (role === ROLES.INSTRUCTOR && course.instructor?._id === user?._id));
    const sortedVideos = hasFullAccess
        ? [...course.videos].sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0))
        : [];

    const facts = [
        ["Mode", course.mode],
        ["Level", course.level],
        ["Duration", course.duration],
        ["Seats", `${course.seatsLeft} of ${course.seats} left`],
    ];

    return (
        <PublicLayout>
            <div className="mx-auto max-w-6xl px-6 py-12">
                <header>
                    <p className="text-sm font-medium text-primary">{course.category}</p>
                    <h1 className="mt-1 font-display text-3xl text-text-primary sm:text-4xl">{course.title}</h1>
                    <p className="mt-3 max-w-3xl text-lg text-text-secondary">{course.subtitle}</p>
                    {!course.isActive && (
                        <p className="mt-3 w-fit rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-secondary">
                            This course is inactive, so only you can see it.
                        </p>
                    )}
                </header>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="min-w-0 space-y-10 lg:col-span-2">
                        {course.picture?.url && (
                            <img
                                src={course.picture.url}
                                alt={course.title}
                                className="aspect-video w-full rounded-lg object-cover"
                            />
                        )}

                        <section>
                            <h2 className="font-display text-xl text-text-primary">Overview</h2>
                            <p className="mt-3 whitespace-pre-line text-text-secondary">{course.overview}</p>
                        </section>

                        {course.technologies?.length > 0 && (
                            <section>
                                <h2 className="font-display text-xl text-text-primary">Technologies</h2>
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {course.technologies.map((tech) => (
                                        <li
                                            key={tech}
                                            className="rounded-full border border-border bg-surface-hover px-3 py-1 text-sm text-text-primary"
                                        >
                                            {tech}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {course.curriculum?.length > 0 && (
                            <section>
                                <h2 className="font-display text-xl text-text-primary">Curriculum</h2>
                                <ol className="mt-3 space-y-2">
                                    {course.curriculum.map((point, index) => (
                                        <li
                                            key={point}
                                            className="flex gap-3 rounded-md border border-border bg-surface px-4 py-3"
                                        >
                                            <span className="w-6 shrink-0 text-sm font-medium text-text-muted">{index + 1}.</span>
                                            <span className="whitespace-pre-line text-sm text-text-secondary">{point}</span>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        )}

                        {course.instructor && (
                            <section>
                                <h2 className="font-display text-xl text-text-primary">Instructor</h2>
                                <div className="mt-3 flex items-start gap-4">
                                    {course.instructor.pic ? (
                                        <img
                                            src={course.instructor.pic}
                                            alt=""
                                            className="h-14 w-14 shrink-0 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-14 w-14 shrink-0 rounded-full bg-surface-hover" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-medium text-text-primary">{course.instructor.name}</p>
                                        {course.instructor.about && (
                                            <p className="mt-1 whitespace-pre-line text-sm text-text-secondary">
                                                {course.instructor.about}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className="font-display text-xl text-text-primary">Lectures</h2>

                            {hasFullAccess ? (
                                sortedVideos.length === 0 ? (
                                    <p className="mt-3 text-sm text-text-secondary">No lectures uploaded yet.</p>
                                ) : (
                                    <ul className="mt-3 space-y-2">
                                        {sortedVideos.map((video) => (
                                            <li
                                                key={video._id}
                                                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3"
                                            >
                                                <div className="min-w-0">
                                                    <h3 className="font-medium text-text-primary">{video.title}</h3>
                                                    <p className="text-sm text-text-secondary">{video.description}</p>
                                                    {video.duration > 0 && (
                                                        <p className="mt-1 text-xs text-text-muted">
                                                            {Math.max(1, Math.round(video.duration / 60))} min
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setPlayingVideo(video)}
                                                    className="shrink-0 cursor-pointer rounded-md bg-primary-btn px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-btn-hover"
                                                >
                                                    ▶ Play
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )
                            ) : (
                                <div className="mt-3 rounded-md border border-dashed border-border p-6 text-center text-text-secondary">
                                    Enroll in this course to unlock lecture content.
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Enrollment card: shown first on small screens, to the right on large ones */}
                    <aside className="order-first lg:order-none">
                        <div className="rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-6">
                            <h2 className="sr-only">Enrollment</h2>
                            <p className="font-display text-3xl text-text-primary">
                                {course.price > 0 ? `$${course.price}` : "Free"}
                            </p>

                            <dl className="mt-4 space-y-2 text-sm">
                                {facts.map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-3">
                                        <dt className="text-text-muted">{label}</dt>
                                        <dd className="text-right font-medium text-text-primary">{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            {enrollBanner && (
                                <div className="mt-4">
                                    <Alert variant={enrollBanner.variant}>{enrollBanner.message}</Alert>
                                </div>
                            )}

                            <div className="mt-4 space-y-2">
                                {!isAuthenticated && (
                                    <>
                                        <Link
                                            to="/signin"
                                            state={{ from: location }}
                                            className="inline-flex w-full items-center justify-center rounded-md bg-primary-btn px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-btn-hover"
                                        >
                                            Sign in to enroll
                                        </Link>
                                        <p className="text-center text-xs text-text-muted">
                                            New here?{" "}
                                            <Link to="/signup" className="font-medium text-primary hover:underline">
                                                Create an account
                                            </Link>
                                        </p>
                                    </>
                                )}

                                {isLearner && hasFullAccess && <Alert variant="success">You're enrolled in this course.</Alert>}

                                {isLearner && !hasFullAccess && (
                                    <>
                                        {myStatus === "pending" ? (
                                            <Button disabled>Request pending</Button>
                                        ) : isFull ? (
                                            <Button disabled>Course full</Button>
                                        ) : (
                                            <Button onClick={openEnrollModal}>
                                                {myStatus === "rejected" ? "Request again" : "Request to enroll"}
                                            </Button>
                                        )}
                                        {myStatus === "pending" && (
                                            <p className="text-center text-xs text-text-muted">
                                                The instructor will review your request.
                                            </p>
                                        )}
                                        {myStatus === "rejected" && !isFull && (
                                            <p className="text-center text-xs text-text-muted">
                                                Your last request wasn't approved. You can send a new one.
                                            </p>
                                        )}
                                    </>
                                )}

                                {canManage && (
                                    <Link
                                        to={PATHS.courseManage(course._id)}
                                        className="inline-flex w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        Manage this course
                                    </Link>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <Modal isOpen={isEnrollModalOpen} onClose={closeEnrollModal} title="Enrollment details">
                <form onSubmit={handleEnrollSubmit} className="space-y-4">
                    <Input id="enroll-name" label="Name" value={user?.name ?? ""} disabled />
                    <Input id="enroll-email" label="Email" value={user?.email ?? ""} disabled />
                    <Input
                        id="enroll-contact"
                        name="contactNumber"
                        label="Contact number"
                        value={enrollForm.contactNumber}
                        onChange={handleEnrollFormChange}
                        error={enrollErrors.contactNumber}
                    />
                    <div className="w-full">
                        <label htmlFor="enroll-address" className="mb-1.5 block text-sm font-medium text-text-secondary">
                            Address
                        </label>
                        <textarea
                            id="enroll-address"
                            name="address"
                            rows={3}
                            value={enrollForm.address}
                            onChange={handleEnrollFormChange}
                            className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${enrollErrors.address ? "border-danger" : "border-border"
                                }`}
                        />
                        {enrollErrors.address && <p className="mt-1.5 text-xs text-danger">{enrollErrors.address}</p>}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" fullWidth={false} onClick={closeEnrollModal}>
                            Cancel
                        </Button>
                        <Button type="submit" fullWidth={false} isLoading={isEnrolling}>
                            Send request
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={Boolean(playingVideo)}
                onClose={() => setPlayingVideo(null)}
                title={playingVideo?.title ?? ""}
                maxWidth="max-w-3xl"
            >
                {playingVideo && (
                    <video key={playingVideo._id} src={playingVideo.url} controls autoPlay className="w-full rounded-md bg-black">
                        Your browser doesn't support video playback.
                    </video>
                )}
            </Modal>
        </PublicLayout>
    );
}