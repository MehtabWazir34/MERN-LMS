import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import DashboardSidebar from "./DashboardSidebar";
import { useAuth } from "../../context/AuthContext";

const BRAND = "UM-Nexa";

/**
 * Props
 *  title      Page heading. This is the page's single <h1>; everything inside should start at <h2>.
 *  children   Page content.
 *  actions    Optional node shown at the right of the heading (e.g. a "Create course" button).
 *
 *  menu       Optional sidebar menu. When given, the page gets the sidebar layout
 *             (admin and instructor dashboards); without it the page keeps the simple
 *             header layout (learner dashboard, profile, ...).
 *             Shape: [{ label?: string, items: [{ key, label, to?, badge? }] }]
 *               - item with `to`    -> renders a <Link> (page navigation)
 *               - item without `to` -> renders a button that calls onSelect(key) (tab switching)
 *               - badge (number)    -> small counter, hidden when 0
 *  activeKey  The `key` of the currently selected item.
 *  onSelect   Called with the item's key when a button item is clicked.
 */
export default function DashboardShell({ title, children, menu, activeKey, onSelect, actions }) {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const hasMenu = Array.isArray(menu) && menu.length > 0;

    // Dashboards sit behind a login, so they should never be indexed.
    useEffect(() => {
        const meta = document.createElement("meta");
        meta.name = "robots";
        meta.content = "noindex, nofollow";
        document.head.appendChild(meta);
        return () => meta.remove();
    }, []);

    // Mobile drawer: close on Escape and lock page scrolling while it is open.
    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    // If the window grows to desktop width while the drawer is open, close it
    // (the sidebar is always visible there, and scrolling must be unlocked).
    useEffect(() => {
        const query = window.matchMedia("(min-width: 1024px)");
        const onChange = (e) => {
            if (e.matches) setMenuOpen(false);
        };
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);

    const closeMenu = () => setMenuOpen(false);

    const handleSelect = (key) => {
        closeMenu();
        onSelect?.(key);
    };

    const handleLogout = () => {
        closeMenu();
        logout();
    };

    const pageContent = (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-2xl text-text-primary">{title}</h1>
                {actions}
            </div>
            <div className="mt-4 text-text-secondary">{children}</div>
        </>
    );

    /* Simple layout: no sidebar */
    if (!hasMenu) {
        return (
            <div className="min-h-screen bg-background">
                <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
                    <span className="font-display text-lg text-primary">{BRAND}</span>
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
                <main className="p-6">{pageContent}</main>
            </div>
        );
    }

    /* Sidebar layout: top bar (main menu) + sidebar (secondary menu) */
    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={menuOpen}
                        aria-controls="dashboard-sidebar"
                        className="rounded-md border border-border p-2 text-text-primary transition-colors hover:bg-surface-hover lg:hidden"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <Link to="/" className="font-display text-lg text-primary">
                        {BRAND}
                    </Link>
                </div>
                <Link to="/" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                    ← Website
                </Link>
            </header>

            <div className="lg:flex">
                <DashboardSidebar
                    brand={BRAND}
                    menu={menu}
                    activeKey={activeKey}
                    onSelect={handleSelect}
                    onNavigate={closeMenu}
                    onClose={closeMenu}
                    onLogout={handleLogout}
                    isOpen={menuOpen}
                    user={user}
                />
                <main className="min-w-0 flex-1 p-4 sm:p-6">{pageContent}</main>
            </div>
        </div>
    );
}