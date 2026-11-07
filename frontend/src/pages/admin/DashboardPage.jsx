import { useSearchParams } from "react-router-dom";
import DashboardShell from "../../components/layout/Dashboardshell.jsx";
import { ADMIN_DEFAULT_TAB, getAdminMenu } from "../../components/layout/dashboardMenus.jsx";
import InstructorTable from "./Instructortable.jsx";
import LearnerTable from "./Learnertable .jsx";
import AdminTable from "./Admintable";
import CoursesManager from "./CoursesManager.jsx";
import ServicesManager from "./ServicesManger.jsx";
import ProjectsManager from "./ProjectsManager.jsx";
import PoliciesManager from "./PoliciesManager.jsx";
import TeamManager from "./TeamManager.jsx";

// One entry per sidebar item. The keys are the ones in getAdminMenu() (dashboardMenus.js).
// `heading` is only for tables that don't show their own title; the others do.
const PANELS = {
    instructors: { Component: InstructorTable },
    learners: { Component: LearnerTable, heading: "Learners" },
    admins: { Component: AdminTable, heading: "Admins" },
    courses: { Component: CoursesManager },
    services: { Component: ServicesManager },
    projects: { Component: ProjectsManager },
    policies: { Component: PoliciesManager },
    team: { Component: TeamManager },
};

const MENU = getAdminMenu();

export default function AdminDashboardPage() {
    // The selected item lives in the URL (?tab=team): refresh and the back button keep it.
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get("tab");
    const activeTab = Object.hasOwn(PANELS, tabParam) ? tabParam : ADMIN_DEFAULT_TAB;

    const { Component, heading } = PANELS[activeTab];

    return (
        <DashboardShell
            title="Admin dashboard"
            menu={MENU}
            activeKey={activeTab}
            onSelect={(key) => setSearchParams({ tab: key })}
        >
            {heading && <h2 className="mb-4 font-display text-xl text-text-primary">{heading}</h2>}
            {/* key resets the panel's own state when another item is chosen */}
            <Component key={activeTab} />
        </DashboardShell>
    );
}