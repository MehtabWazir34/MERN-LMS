import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/layout/Modal";
import { getMyEnrolledCourses } from "../../api/learner";
import { getMyAttendance } from "../../api/attendance";
import { getMyResults } from "../../api/results";

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error

    const [resultsModalCourse, setResultsModalCourse] = useState(null); // course object, or null when closed

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const [coursesData, attendanceData, resultsData] = await Promise.all([
                    getMyEnrolledCourses({ signal: controller.signal }),
                    getMyAttendance(undefined, { signal: controller.signal }),
                    getMyResults(undefined, { signal: controller.signal }),
                ]);
                
                setCourses(coursesData.enrollments.map(enrol=> enrol.course));
                setAttendance(attendanceData.records);
                setResults(resultsData.results);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    // Percentage = present days / total marked days for that course.
    // Returns null (not 0%) when nothing's been marked yet, so the UI can
    // show "—" instead of a misleading 0%.
    const attendancePercentFor = (courseId) => {
        const records = attendance.filter((r) => r.subject?._id === courseId);
        if (records.length === 0) return null;
        const present = records.filter((r) => r.attendanceStatus === "P").length;
        return Math.round((present / records.length) * 100);
    };

    const resultsFor = (courseId) => results.filter((r) => r.subject?._id === courseId);

    const closeResultsModal = () => setResultsModalCourse(null);

    if (status === "loading") {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (status === "error") {
        return <Alert variant="danger">Couldn't load your courses.</Alert>;
    }

    return (
        <div>
            <h2 className="font-display text-xl text-text-primary">My courses</h2>

            {courses.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">You're not enrolled in any courses yet.</p>
            ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => {
                        const percent = attendancePercentFor(course._id);
                        return (
                            <div key={course._id} className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
                                <Link to={`/courses/${course._id}`} className="group">
                                    <div className="aspect-video w-full overflow-hidden bg-surface-hover">
                                        {course.poster ? (
                                            <img
                                                src={course.poster}
                                                alt={course.title}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
                                                No image
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 pb-0">
                                        <h3 className="line-clamp-2 font-display text-lg text-text-primary group-hover:underline">
                                            {course.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-text-secondary">
                                            Attendance: {percent === null ? "—" : `${percent}%`}
                                        </p>
                                    </div>
                                </Link>
                                <div className="flex flex-1 flex-col p-4">
                                    <button
                                        type="button"
                                        onClick={() => setResultsModalCourse(course)}
                                        className="mt-auto rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                                    >
                                        View results
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={Boolean(resultsModalCourse)}
                onClose={closeResultsModal}
                title={`${resultsModalCourse?.title ?? ""} — Results`}
            >
                {resultsModalCourse && resultsFor(resultsModalCourse._id).length === 0 ? (
                    <p className="text-sm text-text-secondary">No results posted yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {resultsModalCourse &&
                            resultsFor(resultsModalCourse._id).map((result) => (
                                <li key={result._id} className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">{result.resultTitle}</span>
                                    <span className="font-medium text-text-primary">
                                        {result.obtainedMarks}/{result.totalMarks}
                                    </span>
                                </li>
                            ))}
                    </ul>
                )}
            </Modal>
        </div>
    );
}