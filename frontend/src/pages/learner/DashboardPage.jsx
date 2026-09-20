import { useState } from "react";
import DashboardShell from "../../components/layout/Dashboardshell.jsx";
import MyCourses from "./MyCourses.jsx";
import MyRequests from "./MyRequests.jsx";

const TABS = [
    { key: "courses", label: "My Courses" },
    { key: "requests", label: "My Requests" },
];

export default function LearnerDashboardPage() {
    const [activeTab, setActiveTab] = useState("courses");

    return (
        <DashboardShell title="Learner dashboard">
            <div
                className="flex gap-1 rounded-md border border-border bg-surface p-1"
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
                {activeTab === "courses" && <MyCourses />}
                {activeTab === "requests" && <MyRequests />}
            </div>
        </DashboardShell>
    );
}