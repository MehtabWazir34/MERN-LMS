import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PublicLayout from "../../components/layout/Publiclayout";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import Modal from "../../components/layout/Modal.jsx";
import { getCourseById, requestEnroll } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/roles";

const EMPTY_ENROLL_FORM = { contactNumber: "", address: "" };

export default function CourseDetailPage() {
    const { id } = useParams();
    const { isAuthenticated, role, user } = useAuth();

    const [course, setCourse] = useState(null);
    const [status, setStatus] = useState("loading"); // loading | success | error

    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [enrollForm, setEnrollForm] = useState(EMPTY_ENROLL_FORM);
    const [enrollErrors, setEnrollErrors] = useState({});
    const [enrollBanner, setEnrollBanner] = useState(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [justRequested, setJustRequested] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getCourseById(id, { signal: controller.signal });
                console.log("Details:", data);
                
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
            setJustRequested(true);
            closeEnrollModal();
        } catch (err) {
            // Covers the 409 "already pending/approved/rejected" case too —
            // the backend's message already says which, no separate status
            // check needed.
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
                        <Button onClick={openEnrollModal} disabled={justRequested}>
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
        </PublicLayout>
    );
}