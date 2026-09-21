import { Link } from "react-router-dom";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";

export default function DashboardShell({ title, children }) {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
                <span className="font-display text-lg text-primary">Ledger LMS</span>
                <div className="flex items-center gap-4">
                    <Link to="/profile" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                        {user?.name} <span className="text-text-muted">·</span>{" "}
                        <span className="capitalize">{user?.role}</span>
                    </Link>
                    <Button variant="secondary" fullWidth={false} onClick={logout}>
                        Logout
                    </Button>
                </div>
            </header>
            <main className="p-6">
                <h1 className="font-display text-2xl text-text-primary">{title}</h1>
                <div className="mt-4 text-text-secondary">{children}</div>
            </main>
        </div>
    );
}