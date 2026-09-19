import { useEffect, useState } from "react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { getAllLearners, updateLearner, deleteLearner } from "../../api/admin";

export default function LearnerTable() {
    const [learners, setLearners] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", verifiedStatus: false });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getAllLearners({ signal: controller.signal });
                setLearners(data.learners);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    const startEdit = (learner) => {
        setEditingId(learner._id);
        setEditForm({ name: learner.name, verifiedStatus: Boolean(learner.verifiedStatus) });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: "", verifiedStatus: false });
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
            const data = await updateLearner(id, editForm);
            setLearners((prev) => prev.map((l) => (l._id === id ? { ...l, ...data.learner } : l)));
            cancelEdit();
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update learner" });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this learner? This cannot be undone.")) return;
        setDeletingId(id);
        setBanner(null);
        try {
            await deleteLearner(id);
            setLearners((prev) => prev.filter((l) => l._id !== id));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to delete learner" });
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
        return <Alert variant="danger">Couldn't load learners.</Alert>;
    }

    return (
        <div>
            {banner && (
                <div className="mb-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {learners.length === 0 ? (
                <p className="text-sm text-text-secondary">No learners yet.</p>
            ) : (
                <ul className="space-y-3">
                    {learners.map((learner) => (
                        <li key={learner._id} className="rounded-lg border border-border bg-surface p-4">
                            {editingId === learner._id ? (
                                <form onSubmit={(e) => handleEditSubmit(e, learner._id)} className="space-y-3">
                                    <Input
                                        id={`learner-name-${learner._id}`}
                                        name="name"
                                        label="Name"
                                        value={editForm.name}
                                        onChange={handleEditChange}
                                    />
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
                                        <p className="truncate font-medium text-text-primary">{learner.name}</p>
                                        <p className="truncate text-sm text-text-secondary">{learner.email}</p>
                                        <p className="mt-1 text-xs text-text-muted">
                                            {learner.enrolledCourses?.length ?? 0} enrolled course(s) ·{" "}
                                            <span className={learner.verifiedStatus ? "text-success" : "text-warning"}>
                                                {learner.verifiedStatus ? "Verified" : "Unverified"}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex flex-shrink-0 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(learner)}
                                            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(learner._id)}
                                            disabled={deletingId === learner._id}
                                            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
                                        >
                                            {deletingId === learner._id ? "Deleting…" : "Delete"}
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