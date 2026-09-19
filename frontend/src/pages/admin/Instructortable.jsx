import { useEffect, useState } from "react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { getAllInstructors, updateInstructor, deleteInstructor } from "../../api/admin.js";

export default function InstructorTable() {
    const [instructors, setInstructors] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", about: "", verifiedStatus: false });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

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

    const startEdit = (instructor) => {
        setEditingId(instructor._id);
        setEditForm({
            name: instructor.name,
            about: instructor.about || "",
            verifiedStatus: Boolean(instructor.verifiedStatus),
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: "", about: "", verifiedStatus: false });
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleEditSubmit = async (e, id) => {
        e.preventDefault();
        setBanner(null);
        setIsSavingEdit(true);
        try {
            const data = await updateInstructor(id, editForm);
            setInstructors((prev) => prev.map((i) => (i._id === id ? { ...i, ...data.instructor } : i)));
            cancelEdit();
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
                        <li key={instructor._id} className="rounded-lg border border-border bg-surface p-4">
                            {editingId === instructor._id ? (
                                <form onSubmit={(e) => handleEditSubmit(e, instructor._id)} className="space-y-3">
                                    <Input
                                        id={`instructor-name-${instructor._id}`}
                                        name="name"
                                        label="Name"
                                        value={editForm.name}
                                        onChange={handleEditChange}
                                    />
                                    <div className="w-full">
                                        <label
                                            htmlFor={`instructor-about-${instructor._id}`}
                                            className="mb-1.5 block text-sm font-medium text-text-secondary"
                                        >
                                            About
                                        </label>
                                        <textarea
                                            id={`instructor-about-${instructor._id}`}
                                            name="about"
                                            rows={2}
                                            value={editForm.about}
                                            onChange={handleEditChange}
                                            className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                                        <input
                                            type="checkbox"
                                            name="verifiedStatus"
                                            checked={editForm.verifiedStatus}
                                            onChange={handleEditChange}
                                        />
                                        Verified
                                    </label>
                                    <div className="flex gap-2">
                                        <Button type="submit" fullWidth={false} isLoading={isSavingEdit}>
                                            Save
                                        </Button>
                                        <Button type="button" variant="secondary" fullWidth={false} onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3">
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
                                    <div className="flex flex-shrink-0 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(instructor)}
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
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}