import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import DashboardShell from "../../components/layout/Dashboardshell.jsx";
import { PATHS, COURSE_MANAGE_DEFAULT_TAB, getCourseManageMenu } from "../../components/layout/dashboardMenus.jsx";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import LectureManager from "../instructor/Lecturemanager";
import EnrollmentManager from "../instructor/Enrollmentmanager";
import AttendanceManager from "../instructor/Attendancemanager";
import ResultManager from "../instructor/Resultmanager";
import { getCourseById } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";

// Same keys as the tab buttons in getCourseManageMenu (dashboardMenus.js).
const VALID_TABS = ["lectures", "requests", "students", "attendance", "results"];

export default function CourseManagePage() {
    const { id } = useParams();
    const { user, role } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // The selected tab lives in the URL (?tab=requests): refresh and the back button keep it.
    const tabParam = searchParams.get("tab");
    const activeTab = VALID_TABS.includes(tabParam) ? tabParam : COURSE_MANAGE_DEFAULT_TAB;

    const [course, setCourse] = useState(null);
    const [status, setStatus] = useState("loading"); // loading | ready | error | forbidden

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getCourseById(id, { signal: controller.signal });
                // getCourseById is also the public detail endpoint, so ownership is only
                // enforced by the mutating endpoints (canManageCourse). Checking here avoids
                // showing tools that would be rejected anyway. Admin is allowed server-side.
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

    // LectureManager reports the fresh `videos` array after every add/edit/delete,
    // folded back here so this page stays the single source of truth for the course.
    const handleVideosChange = (updatedVideos) => {
        setCourse((prev) => (prev ? { ...prev, videos: updatedVideos } : prev));
    };

    // The pending-requests badge is read from the enrollment list. Requests are approved
    // or rejected inside EnrollmentManager, so the list is refreshed quietly each time
    // another tab is opened; the lecture list is left untouched.
    const refreshEnrollments = async () => {
        try {
            const data = await getCourseById(id);
            setCourse((prev) =>
                prev ? { ...prev, enrolledLearners: data.course.enrolledLearners ?? prev.enrolledLearners } : prev
            );
        } catch {
            // The badge is a convenience; a failed refresh changes nothing else.
        }
    };

    const handleSelect = (key) => {
        refreshEnrollments();
        setSearchParams({ tab: key });
    };

    const enrollments = course?.enrolledLearners ?? [];
    const pendingCount = enrollments.filter((e) => e.status === "pending").length;
    const approvedCount = enrollments.filter((e) => e.status === "approved").length;

    // Sidebar for every state of the page, so the layout doesn't jump while loading.
    const shellProps = {
        menu: getCourseManageMenu(id, { role, pendingCount }),
        activeKey: activeTab,
        onSelect: handleSelect,
    };

    if (status === "loading") {
        return (
            <DashboardShell title="Manage course" {...shellProps}>
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            </DashboardShell>
        );
    }

    if (status === "forbidden") {
        return (
            <DashboardShell title="Manage course" {...shellProps}>
                <Alert variant="danger">You can only manage your own courses.</Alert>
            </DashboardShell>
        );
    }

    if (status === "error" || !course) {
        return (
            <DashboardShell title="Manage course" {...shellProps}>
                <Alert variant="danger">Couldn't load this course.</Alert>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell title={course.title} {...shellProps}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${course.isActive ? "bg-success/10 text-success" : "border border-border bg-surface text-text-secondary"
                        }`}
                >
                    {course.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-text-muted">
                    {[course.mode, course.level, course.duration].filter(Boolean).join(" · ")}
                </span>
                <span className="text-text-muted">
                    Seats: {approvedCount}/{course.seats}
                </span>
                <Link to={PATHS.courseView(course._id)} className="font-medium text-primary hover:underline">
                    View course page →
                </Link>
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