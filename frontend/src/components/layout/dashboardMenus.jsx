// Sidebar menus for DashboardShell (see its `menu` prop), defined once so every
// dashboard page shows the same menu.
//
// If a path below doesn't match your AppRoutes.jsx, change it HERE only;
// no other file hard-codes these paths.

export const PATHS = {
    adminHome: "/admin",
    adminCourses: "/admin?tab=courses",
    instructorHome: "/instructor",
    courseCreate: "/instructor/courses/new",
    courseEdit: (id) => `/instructor/courses/${id}/edit`,
    courseManage: (id) => `/instructor/courses/${id}/manage`,
    courseView: (id) => `/courses/${id}`,
};

/* Instructor: page links */
export const getInstructorMenu = () => [
    {
        label: "Courses",
        items: [
            { key: "courses", label: "My courses", to: PATHS.instructorHome },
            { key: "create", label: "Create course", to: PATHS.courseCreate },
        ],
    },
];

/* Admin: tab buttons. The keys are also the ?tab= values of the admin dashboard. */
export const ADMIN_DEFAULT_TAB = "instructors";

export const getAdminMenu = () => [
    {
        label: "People",
        items: [
            { key: "instructors", label: "Instructors" },
            { key: "learners", label: "Learners" },
            { key: "admins", label: "Admins" },
        ],
    },
    {
        label: "Learning",
        items: [{ key: "courses", label: "Courses" }],
    },
    {
        label: "Website",
        items: [
            { key: "services", label: "Services" },
            { key: "projects", label: "Projects" },
            { key: "policies", label: "Policies" },
            { key: "team", label: "Team" },
        ],
    },
];

/* Inside one course: two links (back, edit details) and the tab buttons.
   The tab keys are also the ?tab= values of the course manage page. */
export const COURSE_MANAGE_DEFAULT_TAB = "lectures";

export const getCourseManageMenu = (courseId, { role, pendingCount = 0 } = {}) => [
    {
        items: [
            {
                key: "back",
                label: role === "admin" ? "← Back to dashboard" : "← My courses",
                to: role === "admin" ? PATHS.adminCourses : PATHS.instructorHome,
            },
            { key: "edit", label: "Edit course details", to: PATHS.courseEdit(courseId) },
        ],
    },
    {
        label: "Manage",
        items: [
            { key: "lectures", label: "Lectures" },
            { key: "requests", label: "Enrollment requests", badge: pendingCount },
            { key: "students", label: "Enrolled students" },
            { key: "attendance", label: "Attendance" },
            { key: "results", label: "Results" },
        ],
    },
];