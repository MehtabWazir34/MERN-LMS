import { useEffect, useState } from "react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";

import Modal from "../../components/layout/Modal.jsx";
import {
    getAllLearners,
    updateLearner,
    deleteLearner,
    getLearnerAttendance,
    getLearnerResults,
} from "../../api/admin";

const EMPTY_EDIT_FORM = { name: "", contactNumber: "", address: "", verifiedStatus: false };

export default function LearnerTable() {
    const [learners, setLearners] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Edit modal
    const [editTarget, setEditTarget] = useState(null); // the learner object, or null when closed
    const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
    const [editPic, setEditPic] = useState(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Academics modal
    const [academicsTarget, setAcademicsTarget] = useState(null); // learner object, or null when closed
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [resultRecords, setResultRecords] = useState([]);
    const [academicsStatus, setAcademicsStatus] = useState("idle"); // idle | loading | success | error

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

    const openEdit = (learner) => {
        setEditForm({
            name: learner.name,
            contactNumber: learner.contactNumber || "",
            address: learner.address || "",
            verifiedStatus: Boolean(learner.verifiedStatus),
        });
        setEditPic(null);
        setEditTarget(learner);
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
            const data = await updateLearner(editTarget._id, payload);
            setLearners((prev) => prev.map((l) => (l._id === editTarget._id ? { ...l, ...data.learner } : l)));
            closeEdit();
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

    const openAcademics = async (learner) => {
        setAcademicsTarget(learner);
        setAcademicsStatus("loading");
        try {
            const [attendanceData, resultsData] = await Promise.all([
                getLearnerAttendance(learner._id),
                getLearnerResults(learner._id),
            ]);
            setAttendanceRecords(attendanceData.records);
            setResultRecords(resultsData.results);
            setAcademicsStatus("success");
        } catch {
            setAcademicsStatus("error");
        }
    };

    const closeAcademics = () => {
        setAcademicsTarget(null);
        setAttendanceRecords([]);
        setResultRecords([]);
        setAcademicsStatus("idle");
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
                        <li
                            key={learner._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                {learner.pic ? (
                                    <img src={learner.pic} alt={learner.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                                ) : (
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-surface-hover" />
                                )}
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
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => openAcademics(learner)}
                                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                >
                                    View academics
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openEdit(learner)}
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

                    <Input id="learner-name" name="name" label="Name" value={editForm.name} onChange={handleEditChange} />
                    <Input id="learner-email" label="Email" value={editTarget?.email ?? ""} disabled />

                    <Input
                        id="learner-contact"
                        name="contactNumber"
                        label="Contact number"
                        value={editForm.contactNumber}
                        onChange={handleEditChange}
                    />

                    <div className="w-full">
                        <label htmlFor="learner-address" className="mb-1.5 block text-sm font-medium text-text-secondary">
                            Address
                        </label>
                        <textarea
                            id="learner-address"
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
                isOpen={Boolean(academicsTarget)}
                onClose={closeAcademics}
                title={`${academicsTarget?.name ?? ""}'s academics`}
            >
                {academicsStatus === "loading" && (
                    <div className="flex justify-center py-6">
                        <Spinner />
                    </div>
                )}
                {academicsStatus === "error" && <Alert variant="danger">Couldn't load academic records.</Alert>}
                {academicsStatus === "success" && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-semibold text-text-primary">Attendance</h4>
                            {attendanceRecords.length === 0 ? (
                                <p className="mt-2 text-sm text-text-secondary">No attendance recorded.</p>
                            ) : (
                                <ul className="mt-2 space-y-1.5">
                                    {attendanceRecords.map((record) => (
                                        <li key={record._id} className="flex items-center justify-between text-sm">
                                            <span className="text-text-secondary">
                                                {record.subject?.title} — {new Date(record.date).toLocaleDateString()}
                                            </span>
                                            <span className="font-medium text-text-primary">{record.attendanceStatus}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-primary">Results</h4>
                            {resultRecords.length === 0 ? (
                                <p className="mt-2 text-sm text-text-secondary">No results recorded.</p>
                            ) : (
                                <ul className="mt-2 space-y-1.5">
                                    {resultRecords.map((result) => (
                                        <li key={result._id} className="flex items-center justify-between text-sm">
                                            <span className="text-text-secondary">
                                                {result.subject?.title} — {result.resultTitle}
                                            </span>
                                            <span className="font-medium text-text-primary">
                                                {result.obtainedMarks}/{result.totalMarks}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}