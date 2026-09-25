import PublicLayout from "../../components/layout/Publiclayout";

const ROLES = [
    {
        title: "Learners",
        description: "Browse courses, request to enroll, and track attendance and results in one dashboard.",
    },
    {
        title: "Instructors",
        description: "Create and manage courses, upload lectures, approve enrollments, and mark attendance and results.",
    },
    {
        title: "Admins",
        description: "Oversee every instructor and learner account, with full visibility into academic records.",
    },
];

export default function AboutPage() {
    return (
        <PublicLayout>
            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="font-display text-3xl text-text-primary sm:text-4xl">About Ledger LMS</h1>
                <p className="mt-4 text-text-secondary">
                    Ledger LMS is a role-based learning management platform built for three kinds of people —
                    learners working through courses, instructors running them, and admins keeping the whole
                    platform organized. Everyone gets exactly the tools their role needs, nothing more.
                </p>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {ROLES.map((role) => (
                        <div key={role.title} className="rounded-lg border border-border bg-surface p-6">
                            <h2 className="font-display text-lg text-text-primary">{role.title}</h2>
                            <p className="mt-2 text-sm text-text-secondary">{role.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}