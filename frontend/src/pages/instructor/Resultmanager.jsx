import { useEffect, useState } from "react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { getEnrollmentRequests } from "../../api/courses";
import { addResult, updateResult, getCourseResults } from "../../api/results";

const EMPTY_FORM = { learnerId: "", resultTitle: "", obtainedMarks: "", totalMarks: "" };

export default function ResultManager({ courseId }) {
    const [learners, setLearners] = useState([]);
    const [rosterStatus, setRosterStatus] = useState("loading"); // loading | success | error

    const [results, setResults] = useState([]);
    const [resultsStatus, setResultsStatus] = useState("loading"); // loading | success | error

    const [form, setForm] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [banner, setBanner] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ obtainedMarks: "", totalMarks: "" });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const loadRoster = async () => {
            setRosterStatus("loading");
            try {
                const data = await getEnrollmentRequests(courseId, { signal: controller.signal });
                const approved = data.enrolledLearners
                    .filter((e) => e.status === "approved")
                    .map((e) => e.learner);
                setLearners(approved);
                setRosterStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setRosterStatus("error");
            }
        };

        loadRoster();
        return () => controller.abort();
    }, [courseId]);

    useEffect(() => {
        const controller = new AbortController();

        const loadResults = async () => {
            setResultsStatus("loading");
            try {
                const data = await getCourseResults(courseId, { signal: controller.signal });
                setResults(data.results);
                setResultsStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setResultsStatus("error");
            }
        };

        loadResults();
        return () => controller.abort();
    }, [courseId]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);

        const obtained = Number(form.obtainedMarks);
        const total = Number(form.totalMarks);
        if (!form.learnerId || !form.resultTitle.trim() || form.obtainedMarks === "" || form.totalMarks === "") {
            setBanner({ variant: "danger", message: "Learner, title, obtained and total marks are all required" });
            return;
        }
        if (obtained > total) {
            setBanner({ variant: "danger", message: "Obtained marks cannot exceed total marks" });
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await addResult({
                subject: courseId,
                learner: form.learnerId,
                resultTitle: form.resultTitle,
                obtainedMarks: obtained,
                totalMarks: total,
            });
            // addResult upserts on (subject, learner, resultTitle) — replace a
            // matching row if one already existed, otherwise add a new one.
            setResults((prev) => {
                const existingIndex = prev.findIndex((r) => r._id === data.result._id);
                if (existingIndex === -1) {
                    const learner = learners.find((l) => l._id === form.learnerId);
                    return [{ ...data.result, learner }, ...prev];
                }
                const next = [...prev];
                next[existingIndex] = { ...next[existingIndex], ...data.result };
                return next;
            });
            setForm(EMPTY_FORM);
            setBanner({ variant: "success", message: "Result saved!" });
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to save result" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = (result) => {
        setEditingId(result._id);
        setEditForm({ obtainedMarks: String(result.obtainedMarks), totalMarks: String(result.totalMarks) });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ obtainedMarks: "", totalMarks: "" });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e, resultId) => {
        e.preventDefault();
        setBanner(null);

        const obtained = Number(editForm.obtainedMarks);
        const total = Number(editForm.totalMarks);
        if (obtained > total) {
            setBanner({ variant: "danger", message: "Obtained marks cannot exceed total marks" });
            return;
        }

        setIsSavingEdit(true);
        try {
            const data = await updateResult(resultId, { obtainedMarks: obtained, totalMarks: total });
            setResults((prev) => prev.map((r) => (r._id === resultId ? { ...r, ...data.result } : r)));
            cancelEdit();
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update result" });
        } finally {
            setIsSavingEdit(false);
        }
    };

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">Results</h2>

            {banner && (
                <div className="mt-3">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold text-text-primary">Add / update a result</h3>

                <div className="w-full">
                    <label htmlFor="result-learner" className="mb-1.5 block text-sm font-medium text-text-secondary">
                        Learner
                    </label>
                    <select
                        id="result-learner"
                        name="learnerId"
                        value={form.learnerId}
                        onChange={handleFormChange}
                        disabled={rosterStatus !== "success"}
                        className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option value="">Select a learner</option>
                        {learners.map((learner) => (
                            <option key={learner._id} value={learner._id}>
                                {learner.name}
                            </option>
                        ))}
                    </select>
                    {rosterStatus === "error" && <p className="mt-1.5 text-xs text-danger">Couldn't load the learner roster.</p>}
                </div>

                <Input
                    id="result-title"
                    name="resultTitle"
                    label="Title (e.g. Midterm, Assignment 1)"
                    value={form.resultTitle}
                    onChange={handleFormChange}
                />

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        id="result-obtained"
                        name="obtainedMarks"
                        type="number"
                        min="0"
                        label="Obtained marks"
                        value={form.obtainedMarks}
                        onChange={handleFormChange}
                    />
                    <Input
                        id="result-total"
                        name="totalMarks"
                        type="number"
                        min="0"
                        label="Total marks"
                        value={form.totalMarks}
                        onChange={handleFormChange}
                    />
                </div>

                <Button type="submit" fullWidth={false} className="px-6" isLoading={isSubmitting}>
                    Save result
                </Button>
            </form>

            {resultsStatus === "loading" && (
                <div className="mt-6 flex justify-center">
                    <Spinner />
                </div>
            )}
            {resultsStatus === "error" && (
                <div className="mt-4">
                    <Alert variant="danger">Couldn't load results.</Alert>
                </div>
            )}
            {resultsStatus === "success" && results.length === 0 && (
                <p className="mt-6 text-sm text-text-secondary">No results posted yet.</p>
            )}
            {resultsStatus === "success" && results.length > 0 && (
                <ul className="mt-6 space-y-3">
                    {results.map((result) => (
                        <li key={result._id} className="rounded-lg border border-border bg-surface p-4">
                            {editingId === result._id ? (
                                <form onSubmit={(e) => handleEditSubmit(e, result._id)} className="space-y-3">
                                    <p className="text-sm font-medium text-text-primary">
                                        {result.learner?.name} · {result.resultTitle}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            id={`edit-obtained-${result._id}`}
                                            name="obtainedMarks"
                                            type="number"
                                            min="0"
                                            label="Obtained marks"
                                            value={editForm.obtainedMarks}
                                            onChange={handleEditChange}
                                        />
                                        <Input
                                            id={`edit-total-${result._id}`}
                                            name="totalMarks"
                                            type="number"
                                            min="0"
                                            label="Total marks"
                                            value={editForm.totalMarks}
                                            onChange={handleEditChange}
                                        />
                                    </div>
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
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-text-primary">{result.learner?.name}</p>
                                        <p className="text-sm text-text-secondary">{result.resultTitle}</p>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-3">
                                        <span className="text-sm font-medium text-primary">
                                            {result.obtainedMarks}/{result.totalMarks}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(result)}
                                            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                        >
                                            Edit
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