import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { getEnrollmentRequests } from "../../api/courses";
import { markAttendance, updateAttendance, getCourseAttendance } from "../../api/attendance";

const STATUS_LABELS = { P: "Present", A: "Absent", L: "Late" };
const STATUS_ORDER = ["P", "A", "L"];
const STATUS_STYLES = {
    P: "bg-success/10 text-success border-success/30",
    A: "bg-danger/10 text-danger border-danger/30",
    L: "bg-warning/10 text-warning border-warning/30",
};

const toDateInputValue = (date) => new Date(date).toISOString().slice(0, 10);
const todayInputValue = () => toDateInputValue(new Date());

export default function AttendanceManager({ courseId }) {
    const [learners, setLearners] = useState([]);
    const [rosterStatus, setRosterStatus] = useState("loading"); // loading | success | error

    const [records, setRecords] = useState([]);
    const [recordsStatus, setRecordsStatus] = useState("loading"); // loading | success | error

    const [selectedDate, setSelectedDate] = useState(todayInputValue());
    const [savingKey, setSavingKey] = useState(null); // `${learnerId}-${date}` or record._id
    const [banner, setBanner] = useState(null);

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

        const loadRecords = async () => {
            setRecordsStatus("loading");
            try {
                const data = await getCourseAttendance(courseId, { signal: controller.signal });
                setRecords(data.records);
                setRecordsStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setRecordsStatus("error");
            }
        };

        loadRecords();
        return () => controller.abort();
    }, [courseId]);

    const findRecordFor = (learnerId, dateValue) =>
        records.find((r) => r.learner?._id === learnerId && toDateInputValue(r.date) === dateValue);

    const handleMark = async (learnerId, attendanceStatus) => {
        const key = `${learnerId}-${selectedDate}`;
        setSavingKey(key);
        setBanner(null);
        try {
            const data = await markAttendance({
                subject: courseId,
                learner: learnerId,
                date: selectedDate,
                attendanceStatus,
            });
            setRecords((prev) => {
                const existing = findRecordFor(learnerId, selectedDate);
                if (existing) {
                    return prev.map((r) => (r._id === existing._id ? { ...r, ...data.record } : r));
                }
                return [{ ...data.record, learner: { _id: learnerId } }, ...prev];
            });
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to mark attendance" });
        } finally {
            setSavingKey(null);
        }
    };

    const handleHistoryEdit = async (recordId, attendanceStatus) => {
        setSavingKey(recordId);
        setBanner(null);
        try {
            const data = await updateAttendance(recordId, attendanceStatus);
            setRecords((prev) => prev.map((r) => (r._id === recordId ? { ...r, ...data.record } : r)));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to update attendance" });
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">Attendance</h2>

            {banner && (
                <div className="mt-3">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="attendance-date" className="text-sm font-medium text-text-secondary">
                        Mark for date
                    </label>
                    <input
                        id="attendance-date"
                        type="date"
                        value={selectedDate}
                        max={todayInputValue()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>

                {rosterStatus === "loading" && (
                    <div className="mt-4 flex justify-center">
                        <Spinner />
                    </div>
                )}
                {rosterStatus === "error" && (
                    <div className="mt-4">
                        <Alert variant="danger">Couldn't load the learner roster.</Alert>
                    </div>
                )}
                {rosterStatus === "success" && learners.length === 0 && (
                    <p className="mt-4 text-sm text-text-secondary">No approved learners yet.</p>
                )}
                {rosterStatus === "success" && learners.length > 0 && (
                    <ul className="mt-4 space-y-2">
                        {learners.map((learner) => {
                            const current = findRecordFor(learner._id, selectedDate);
                            const key = `${learner._id}-${selectedDate}`;
                            return (
                                <li
                                    key={learner._id}
                                    className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0"
                                >
                                    <span className="min-w-0 truncate text-sm text-text-primary">{learner.name}</span>
                                    <div className="flex gap-1.5">
                                        {STATUS_ORDER.map((code) => (
                                            <button
                                                key={code}
                                                type="button"
                                                disabled={savingKey === key}
                                                onClick={() => handleMark(learner._id, code)}
                                                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${current?.attendanceStatus === code
                                                        ? STATUS_STYLES[code]
                                                        : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
                                                    }`}
                                            >
                                                {code}
                                            </button>
                                        ))}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="mt-6">
                <h3 className="text-sm font-semibold text-text-primary">History</h3>

                {recordsStatus === "loading" && (
                    <div className="mt-4 flex justify-center">
                        <Spinner />
                    </div>
                )}
                {recordsStatus === "error" && (
                    <div className="mt-4">
                        <Alert variant="danger">Couldn't load attendance history.</Alert>
                    </div>
                )}
                {recordsStatus === "success" && records.length === 0 && (
                    <p className="mt-3 text-sm text-text-secondary">No attendance marked yet.</p>
                )}
                {recordsStatus === "success" && records.length > 0 && (
                    <ul className="mt-3 space-y-2">
                        {records.map((record) => (
                            <li
                                key={record._id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-text-primary">{record.learner?.name}</p>
                                    <p className="text-xs text-text-muted">{toDateInputValue(record.date)}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {STATUS_ORDER.map((code) => (
                                        <button
                                            key={code}
                                            type="button"
                                            disabled={savingKey === record._id}
                                            onClick={() => handleHistoryEdit(record._id, code)}
                                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${record.attendanceStatus === code
                                                    ? STATUS_STYLES[code]
                                                    : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
                                                }`}
                                        >
                                            {code}
                                        </button>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}