import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";

export default function Navbar() {
    const { isAuthenticated, role, user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Link to="/" className="font-display text-xl text-primary">
                    Ledger LMS
                </Link>

                <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary md:flex">
                    <Link to="/" className="hover:text-text-primary">
                        Home
                    </Link>
                    <Link to="/courses" className="hover:text-text-primary">
                        Courses
                    </Link>
                </nav>

                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <span className="hidden text-sm text-text-secondary sm:inline">{user?.name}</span>
                            <Button fullWidth={false} onClick={() => navigate(`/${role}`)}>
                                Dashboard
                            </Button>
                            <Button variant="secondary" fullWidth={false} onClick={logout}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="secondary" fullWidth={false} onClick={() => navigate("/signin")}>
                                Sign in
                            </Button>
                            <Button fullWidth={false} onClick={() => navigate("/signup")}>
                                Sign up
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}