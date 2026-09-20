import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardShell from "../../components/layout/Dashboardshell";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import LectureManager from "../instructor/Lecturemanager";
import EnrollmentManager from "../instructor/Enrollmentmanager";
import AttendanceManager from "../instructor/Attendancemanager";
import ResultManager from "../instructor/Resultmanager";
import { getCourseById } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";

// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import DashboardShell from "../../components/layout/DashboardShell";
// import Alert from "../../components/common/Alert";
// import Spinner from "../../components/common/Spinner";
// import LectureManager from "../../components/instructor/LectureManager";
// import EnrollmentManager from "../../components/instructor/EnrollmentManager";
// import AttendanceManager from "../../components/instructor/AttendanceManager";
// import ResultManager from "../../components/instructor/ResultManager";
// import { getCourseById } from "../../api/courses";
// import { useAuth } from "../../context/AuthContext";

const TABS = [
    { key: "lectures", label: "Lectures" },
    { key: "requests", label: "Enrollment requests" },
    { key: "students", label: "Enrolled students" },
    { key: "attendance", label: "Attendance" },
    { key: "results", label: "Results" },
];

export default function CourseManagePage() {
    const { id } = useParams();
    const { user, role } = useAuth();

    const dashboardPath = role === "admin" ? "/admin" : "/instructor";

    const [course, setCourse] = useState(null);
    const [status, setStatus] = useState("loading"); // loading | ready | error | forbidden
    const [activeTab, setActiveTab] = useState("lectures");

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getCourseById(id, { signal: controller.signal });
                // Same ownership check as CourseFormPage's edit mode — getCourseById
                // itself doesn't enforce this, only the mutating endpoints
                // (canManageCourse) do. Admin bypasses it since canManageCourse
                // already allows admin server-side.
                if (data.course.instructor?._id !== user?._id && role !== "admin") {
                    setStatus("forbidden");
                    return;
                }
                setCourse(data.course);
                setStatus("ready");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, [id, user?._id, role]);

    // LectureManager reports the fresh `videos` array after every
    // add/edit/delete — folded back into local course state so this page
    // stays the single source of truth for the course object.
    const handleVideosChange = (updatedVideos) => {
        setCourse((prev) => (prev ? { ...prev, videos: updatedVideos } : prev));
    };

    if (status === "loading") {
        return (
            <DashboardShell title="Manage course">
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            </DashboardShell>
        );
    }

    if (status === "forbidden") {
        return (
            <DashboardShell title="Manage course">
                <Alert variant="danger">You can only manage your own courses.</Alert>
            </DashboardShell>
        );
    }

    if (status === "error" || !course) {
        return (
            <DashboardShell title="Manage course">
                <Alert variant="danger">Couldn't load this course.</Alert>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell title={course.title}>
            <Link to={dashboardPath} className="text-sm font-medium text-primary hover:underline">
                ← Back to dashboard
            </Link>

            <div
                className="mt-6 flex flex-wrap gap-1 rounded-md border border-border bg-surface p-1"
                style={{ width: "fit-content" }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`whitespace-nowrap rounded px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-primary text-white" : "text-text-secondary hover:bg-surface-hover"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === "lectures" && (
                    <LectureManager courseId={course._id} videos={course.videos} onVideosChange={handleVideosChange} />
                )}
                {activeTab === "requests" && <EnrollmentManager courseId={course._id} view="pending" />}
                {activeTab === "students" && <EnrollmentManager courseId={course._id} view="approved" />}
                {activeTab === "attendance" && <AttendanceManager courseId={course._id} />}
                {activeTab === "results" && <ResultManager courseId={course._id} />}
            </div>
        </DashboardShell>
    );
}