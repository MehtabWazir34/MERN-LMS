import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import TextArea from "../../components/common/TextArea.jsx";
import ImagePicker from "../../components/common/ImagePicker.jsx";
import Modal from "../../components/layout/Modal.jsx";
import { PATHS } from "../../components/layout/dashboardMenus.jsx";
import { getAllInstructors, updateInstructor, deleteInstructor } from "../../api/admin";
import { getManagedCourses } from "../../api/courses";

const EMPTY_EDIT_FORM = { name: "", about: "", contactNumber: "", address: "", verifiedStatus: false };

export default function InstructorTable() {
    const [instructors, setInstructors] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null); // { variant, message, instructor? }
    const [deletingId, setDeletingId] = useState(null);

    // Edit modal
    const [editTarget, setEditTarget] = useState(null); // the instructor object, or null when closed
    const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
    const [editPicFiles, setEditPicFiles] = useState([]); // at most one new photo
    const [editErrors, setEditErrors] = useState({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Courses modal
    const [coursesTarget, setCoursesTarget] = useState(null); // instructor object, or null when closed
    const [instructorCourses, setInstructorCourses] = useState([]);
    const [coursesStatus, setCoursesStatus] = useState("idle"); // idle | loading | success | error

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getAllInstructors({ signal: controller.signal });
                setInstructors(data.instructors);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    const openEdit = (instructor) => {
        setEditForm({
            name: instructor.name,
            about: instructor.about || "",
            contactNumber: instructor.contactNumber || "",
            address: instructor.address || "",
            verifiedStatus: Boolean(instructor.verifiedStatus),
        });
        setEditPicFiles([]);
        setEditErrors({});
        setEditTarget(instructor);
    };

    const closeEdit = () => setEditTarget(null);

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        setEditErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);

        if (!editForm.name.trim()) {
            setEditErrors({ name: "Name is required" });
            document.getElementById("instructor-name")?.focus();
            return;
        }

        setIsSavingEdit(true);
        try {
            const payload = { ...editForm, name: editForm.name.trim() };
            if (editPicFiles[0]) payload.pic = editPicFiles[0];
            const data = await updateInstructor(editTarget._id, payload);
            setInstructors((prev) => prev.map((i) => (i._id === editTarget._id ? { ...i, ...data.instructor } : i)));
            closeEdit();
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update instructor" });
            closeEdit();
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDelete = async (instructor) => {
        if (!window.confirm(`Delete ${instructor.name}? This cannot be undone.`)) return;
        setDeletingId(instructor._id);
        setBanner(null);
        try {
            await deleteInstructor(instructor._id);
            setInstructors((prev) => prev.filter((i) => i._id !== instructor._id));
            setBanner({ variant: "success", message: `${instructor.name} was removed.` });
        } catch (err) {
            // The server refuses (409) while the instructor still owns courses, and says how many.
            const stillHasCourses = err.response?.status === 409;
            setBanner({
                variant: stillHasCourses ? "warning" : "danger",
                message: err.response?.data?.msg || "Failed to delete instructor",
                instructor: stillHasCourses ? instructor : null,
            });
        } finally {
            setDeletingId(null);
        }
    };

    const openCourses = async (instructor) => {
        setCoursesTarget(instructor);
        setCoursesStatus("loading");
        try {
            // All of this instructor's courses, active and inactive.
            const data = await getManagedCourses({ instructor: instructor._id });
            setInstructorCourses(data.courses);
            setCoursesStatus("success");
        } catch {
            setCoursesStatus("error");
        }
    };

    const closeCourses = () => {
        setCoursesTarget(null);
        setInstructorCourses([]);
        setCoursesStatus("idle");
    };

    if (status === "loading") {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (status === "error") {
        return <Alert variant="danger">Couldn't load instructors.</Alert>;
    }

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">Instructors ({instructors.length})</h2>

            {banner && (
                <div className="mt-4">
                    <Alert variant={banner.variant}>
                        <span>{banner.message}</span>
                        {banner.instructor && (
                            <button
                                type="button"
                                onClick={() => openCourses(banner.instructor)}
                                className="ml-2 font-medium underline"
                            >
                                View courses
                            </button>
                        )}
                    </Alert>
                </div>
            )}

            {instructors.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">No instructors yet.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {instructors.map((instructor) => (
                        <li
                            key={instructor._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                {instructor.pic ? (
                                    <img src={instructor.pic} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                                ) : (
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-surface-hover" />
                                )}
                                <div className="min-w-0">
                                    <h3 className="truncate font-medium text-text-primary">{instructor.name}</h3>
                                    <p className="truncate text-sm text-text-secondary">{instructor.email}</p>
                                    <p className="mt-1 text-xs text-text-muted">
                                        {instructor.courses?.length ?? 0} course(s) ·{" "}
                                        <span className={instructor.verifiedStatus ? "text-success" : "text-warning"}>
                                            {instructor.verifiedStatus ? "Verified" : "Unverified"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => openCourses(instructor)}
                                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                >
                                    View courses
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openEdit(instructor)}
                                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(instructor)}
                                    disabled={deletingId === instructor._id}
                                    className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                >
                                    {deletingId === instructor._id ? "Deleting…" : "Delete"}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Modal isOpen={Boolean(editTarget)} onClose={closeEdit} title={`Edit ${editTarget?.name ?? ""}`}>
                <form onSubmit={handleEditSubmit} className="space-y-4" noValidate>
                    <ImagePicker
                        id="instructor-photo"
                        label="Profile photo (leave empty to keep the current one)"
                        existing={editTarget?.pic ? [{ url: editTarget.pic, publicId: "current-photo" }] : []}
                        files={editPicFiles}
                        onFilesChange={setEditPicFiles}
                    />

                    <Input
                        id="instructor-name"
                        name="name"
                        label="Name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        error={editErrors.name}
                    />
                    <Input id="instructor-email" label="Email" value={editTarget?.email ?? ""} disabled />

                    <TextArea
                        id="instructor-about"
                        name="about"
                        label="About"
                        rows={2}
                        value={editForm.about}
                        onChange={handleEditChange}
                    />

                    <Input
                        id="instructor-contact"
                        name="contactNumber"
                        label="Contact number"
                        value={editForm.contactNumber}
                        onChange={handleEditChange}
                    />

                    <TextArea
                        id="instructor-address"
                        name="address"
                        label="Address"
                        rows={2}
                        value={editForm.address}
                        onChange={handleEditChange}
                    />

                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input type="checkbox" name="verifiedStatus" checked={editForm.verifiedStatus} onChange={handleEditChange} />
                        Verified
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" fullWidth={false} onClick={closeEdit}>
                            Cancel
                        </Button>
                        <Button type="submit" fullWidth={false} isLoading={isSavingEdit}>
                            Save
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={Boolean(coursesTarget)}
                onClose={closeCourses}
                title={`${coursesTarget?.name ?? ""}'s courses`}
                maxWidth="max-w-xl"
            >
                {coursesStatus === "loading" && (
                    <div className="flex justify-center py-6">
                        <Spinner />
                    </div>
                )}
                {coursesStatus === "error" && <Alert variant="danger">Couldn't load courses.</Alert>}
                {coursesStatus === "success" && instructorCourses.length === 0 && (
                    <p className="text-sm text-text-secondary">This instructor has no courses.</p>
                )}
                {coursesStatus === "success" && instructorCourses.length > 0 && (
                    <ul className="space-y-2">
                        {instructorCourses.map((course) => (
                            <li
                                key={course._id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface p-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-text-primary">{course.title}</p>
                                    <p className="mt-0.5 text-xs text-text-muted">
                                        <span className={course.isActive ? "text-success" : "text-text-secondary"}>
                                            {course.isActive ? "Active" : "Inactive"}
                                        </span>{" "}
                                        · Seats {course.approvedCount}/{course.seats}
                                        {course.pendingCount > 0 && ` · ${course.pendingCount} pending`}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Link
                                        to={PATHS.courseManage(course._id)}
                                        className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        Manage
                                    </Link>
                                    <Link
                                        to={PATHS.courseEdit(course._id)}
                                        className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Modal>
        </div>
    );
}