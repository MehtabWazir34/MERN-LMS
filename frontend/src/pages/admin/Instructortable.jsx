import { useEffect, useState } from "react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { Link } from "react-router-dom";
import Modal from "../../components/layout/Modal.jsx";
import { getAllInstructors, updateInstructor, deleteInstructor } from "../../api/admin";
import { getAllCourses } from "../../api/courses";

const EMPTY_EDIT_FORM = { name: "", about: "", contactNumber: "", address: "", verifiedStatus: false };

export default function InstructorTable() {
    const [instructors, setInstructors] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Edit modal
    const [editTarget, setEditTarget] = useState(null); // the instructor object, or null when closed
    const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
    const [editPic, setEditPic] = useState(null);
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
        setEditPic(null);
        setEditTarget(instructor);
    };

    const closeEdit = () => setEditTarget(null);

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);
        setIsSavingEdit(true);
        try {
            const payload = { ...editForm };
            if (editPic) payload.pic = editPic;
            const data = await updateInstructor(editTarget._id, payload);
            setInstructors((prev) => prev.map((i) => (i._id === editTarget._id ? { ...i, ...data.instructor } : i)));
            closeEdit();
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update instructor" });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this instructor? Their courses will remain but become orphaned.")) return;
        setDeletingId(id);
        setBanner(null);
        try {
            const data = await deleteInstructor(id);
            setInstructors((prev) => prev.filter((i) => i._id !== id));
            if (data.orphanedCourses > 0) {
                setBanner({
                    variant: "warning",
                    message: `Instructor removed. ${data.orphanedCourses} course(s) no longer have an owning instructor.`,
                });
            }
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to delete instructor" });
        } finally {
            setDeletingId(null);
        }
    };

    const openCourses = async (instructor) => {
        setCoursesTarget(instructor);
        setCoursesStatus("loading");
        try {
            const data = await getAllCourses();
            setInstructorCourses(data.courses.filter((c) => c.instructor?._id === instructor._id));
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
            {banner && (
                <div className="mb-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {instructors.length === 0 ? (
                <p className="text-sm text-text-secondary">No instructors yet.</p>
            ) : (
                <ul className="space-y-3">
                    {instructors.map((instructor) => (
                        <li
                            key={instructor._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                {instructor.pic ? (
                                    <img src={instructor.pic} alt={instructor.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                                ) : (
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-surface-hover" />
                                )}
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-text-primary">{instructor.name}</p>
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
                                    onClick={() => handleDelete(instructor._id)}
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
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Profile photo</label>
                        {editTarget?.pic && !editPic && (
                            <img src={editTarget.pic} alt={editTarget.name} className="mb-2 h-16 w-16 rounded-full object-cover" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditPic(e.target.files?.[0] ?? null)}
                            className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary"
                        />
                    </div>

                    <Input
                        id="instructor-name"
                        name="name"
                        label="Name"
                        value={editForm.name}
                        onChange={handleEditChange}
                    />
                    <Input id="instructor-email" label="Email" value={editTarget?.email ?? ""} disabled />

                    <div className="w-full">
                        <label htmlFor="instructor-about" className="mb-1.5 block text-sm font-medium text-text-secondary">
                            About
                        </label>
                        <textarea
                            id="instructor-about"
                            name="about"
                            rows={2}
                            value={editForm.about}
                            onChange={handleEditChange}
                            className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    <Input
                        id="instructor-contact"
                        name="contactNumber"
                        label="Contact number"
                        value={editForm.contactNumber}
                        onChange={handleEditChange}
                    />

                    <div className="w-full">
                        <label htmlFor="instructor-address" className="mb-1.5 block text-sm font-medium text-text-secondary">
                            Address
                        </label>
                        <textarea
                            id="instructor-address"
                            name="address"
                            rows={2}
                            value={editForm.address}
                            onChange={handleEditChange}
                            className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

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
                                <span className="min-w-0 truncate text-sm font-medium text-text-primary">{course.title}</span>
                                <div className="flex shrink-0 gap-2">
                                    <Link
                                        to={`/instructor/courses/${course._id}/manage`}
                                        className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        Manage
                                    </Link>
                                    <Link
                                        to={`/instructor/courses/${course._id}/edit`}
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