import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button.jsx";

export default function Navbar() {
    const { isAuthenticated, role, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu whenever the route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    // Close mobile menu when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = () => {
        setIsMenuOpen(false);
        logout();
    };

    const goTo = (path) => {
        setIsMenuOpen(false);
        navigate(path);
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="font-display text-xl text-primary"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Ledger LMS
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary md:flex">
                        <Link
                            to="/"
                            className="hover:text-text-primary"
                        > Home  </Link>

                        <Link
                            to="/about"
                            className="hover:text-text-primary"
                        >
                            About
                        </Link>
                        <Link
                            to="/courses"
                            className="hover:text-text-primary"
                        >
                            Courses
                        </Link>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden items-center gap-3 md:flex">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/profile"
                                    className="text-sm text-text-secondary hover:text-text-primary border-border border p-2 rounded-lg"
                                >
                                    {user?.name}
                                </Link>

                                <Button
                                    fullWidth={false}
                                    onClick={() => goTo(`/${role}`)}
                                >
                                    Dashboard
                                </Button>

                                <Button
                                    variant="secondary"
                                    fullWidth={false}
                                    onClick={handleLogout}
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="secondary"
                                    fullWidth={false}
                                    onClick={() => goTo("/signin")}
                                >
                                    Sign in
                                </Button>

                                <Button
                                    fullWidth={false}
                                    onClick={() => goTo("/signup")}
                                >
                                    Sign up
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-border/40 hover:text-text-primary md:hidden"
                    >
                        {isMenuOpen ? (
                            // X icon
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-6 w-6 cursor-pointer"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18 18 6M6 6l12 12"
                                />
                            </svg>
                        ) : (
                            // Hamburger icon
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-6 w-6 cursor-pointer"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="border-t border-border py-4 md:hidden">
                        <nav className="flex flex-col gap-1">
                            <Link
                                to="/"
                                onClick={() => setIsMenuOpen(false)}
                                className="rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-border/40 hover:text-text-primary"
                            > Home </Link>

                            <Link
                                to="/about"
                                onClick={() => setIsMenuOpen(false)}
                                className="rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-border/40 hover:text-text-primary"
                            > About </Link>
                            <Link
                                to="/courses"
                                onClick={() => setIsMenuOpen(false)}
                                className="rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-border/40 hover:text-text-primary"
                            > Courses </Link>

                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-border/40 hover:text-text-primary"
                                    >
                                        {user?.name}-(Profile)
                                    </Link>

                                    <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                                        <Button
                                            fullWidth={true}
                                            onClick={() => goTo(`/${role}`)}
                                        >
                                            Dashboard
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            fullWidth={true}
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                                    <Button
                                        variant="secondary"
                                        fullWidth={true}
                                        onClick={() => goTo("/signin")}
                                    >
                                        Sign in
                                    </Button>

                                    <Button
                                        fullWidth={true}
                                        onClick={() => goTo("/signup")}
                                    >
                                        Sign up
                                    </Button>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}