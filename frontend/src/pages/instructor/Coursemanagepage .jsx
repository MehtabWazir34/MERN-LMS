import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardShell from "../../components/layout/Dashboardshell.jsx";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import LectureManager from "./LectureManager";
import EnrollmentManager from "./EnrollmentManager";
import AttendanceManager from "./Attendancemanager.jsx";
import ResultManager from "./Resultmanager.jsx";
import { getCourseById } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";

export default function CourseManagePage() {
    const { id } = useParams();
    const { user } = useAuth();

    const [course, setCourse] = useState(null);
    const [status, setStatus] = useState("loading"); // loading | ready | error | forbidden

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getCourseById(id, { signal: controller.signal });
                // Same ownership check as CourseFormPage's edit mode — getCourseById
                // itself doesn't enforce this, only the mutating endpoints
                // (canManageCourse) do. This just avoids showing management UI
                // for a course that isn't theirs.
                if (data.course.instructor?._id !== user?._id) {
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
    }, [id, user?._id]);

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
            <Link to="/instructor" className="text-sm font-medium text-primary hover:underline">
                ← Back to dashboard
            </Link>

            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
                <LectureManager courseId={course._id} videos={course.videos} onVideosChange={handleVideosChange} />
                <EnrollmentManager courseId={course._id} />
                <AttendanceManager courseId={course._id} />
                <ResultManager courseId={course._id} />
            </div>
        </DashboardShell>
    );
}