import { useState } from "react";
import DashboardShell from "../../components/layout/Dashboardshell";
import InstructorTable from "./Instructortable.jsx";
import LearnerTable from "./Learnertable .jsx";
import AdminTable from "./Admintable";
import { Link } from "react-router-dom";

const TABS = [
    { key: "instructors", label: "Instructors" },
    { key: "learners", label: "Learners" },
    { key: "admins", label: "Admins" },
];

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState("instructors");

    return (
        <DashboardShell title="Admin dashboard">
            <Link to="/" className="text-sm font-medium text-primary hover:underline border-border bg-surface p-2 rounded-lg ">
                                       ← Back to Home
                                    </Link>
            <div className="flex gap-1 rounded-md border border-border bg-surface p-1 my-4" style={{ width: "fit-content" }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`rounded px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                                ? "bg-primary text-white"
                                : "text-text-secondary hover:bg-surface-hover"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === "instructors" && <InstructorTable />}
                {activeTab === "learners" && <LearnerTable />}
                {activeTab === "admins" && <AdminTable />}
            </div>
        </DashboardShell>
    );
}