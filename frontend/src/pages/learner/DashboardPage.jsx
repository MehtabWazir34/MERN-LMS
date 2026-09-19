import DashboardShell from "../../components/layout/Dashboardshell.jsx";
import { Link } from "react-router-dom";
export default function LearnerDashboardPage() {
    return (
        <DashboardShell title="Learner dashboard">
            <Link to="/" className="text-sm font-medium text-primary border-border bg-surface hover:bg-surface-hover rounded-lg p-2">
                ← Back to Home
            </Link>
            <p>Enrolled courses, assignments, progress — coming next.</p>
        </DashboardShell>
    );
}