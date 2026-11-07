import { Link } from "react-router-dom";

const ITEM_BASE =
    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors";
const ITEM_ACTIVE = "bg-primary text-white";
const ITEM_IDLE = "text-text-secondary hover:bg-surface-hover hover:text-text-primary";

// Rendered by DashboardShell. On desktop it is a sticky column under the top bar;
// below the lg breakpoint it becomes a slide-in drawer with an overlay.
export default function DashboardSidebar({
    brand,
    menu,
    activeKey,
    onSelect,
    onNavigate,
    onClose,
    onLogout,
    isOpen,
    user,
}) {
    const renderItem = (item) => {
        const isActive = item.key === activeKey;
        const className = `${ITEM_BASE} ${isActive ? ITEM_ACTIVE : ITEM_IDLE}`;
        const content = (
            <>
                <span className="truncate">{item.label}</span>
                {item.badge > 0 && (
                    <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                            }`}
                    >
                        {item.badge}
                    </span>
                )}
            </>
        );

        return (
            <li key={item.key}>
                {item.to ? (
                    <Link
                        to={item.to}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={className}
                    >
                        {content}
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => onSelect?.(item.key)}
                        aria-current={isActive ? "page" : undefined}
                        className={className}
                    >
                        {content}
                    </button>
                )}
            </li>
        );
    };

    return (
        <>
            {/* Overlay (mobile only) */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
            />

            <aside
                id="dashboard-sidebar"
                aria-label="Dashboard menu"
                className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface transition-[transform,visibility] duration-200 lg:sticky lg:bottom-auto lg:top-14 lg:z-20 lg:h-[calc(100vh-3.5rem)] lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:self-start lg:visible ${isOpen ? "visible translate-x-0" : "invisible -translate-x-full"
                    }`}
            >
                {/* Drawer header (mobile only) */}
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 lg:hidden">
                    <span className="font-display text-lg text-primary">{brand}</span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-hover"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>

                {/* Dashboard sections */}
                <nav aria-label="Dashboard sections" className="flex-1 overflow-y-auto px-3 py-4">
                    {menu.map((group, index) => (
                        <div key={group.label ?? index} className={index > 0 ? "mt-5" : ""}>
                            {group.label && (
                                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                    {group.label}
                                </p>
                            )}
                            <ul className="space-y-1">{group.items.map(renderItem)}</ul>
                        </div>
                    ))}
                </nav>

                {/* Bottom of the same menu: who is logged in, profile, logout */}
                <div className="shrink-0 border-t border-border p-3">
                    <div className="mb-2 flex items-center gap-3 px-3">
                        {user?.pic ? (
                            <img src={user.pic} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                        ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-hover text-sm font-medium text-text-primary">
                                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">{user?.name}</p>
                            <p className="truncate text-xs capitalize text-text-muted">{user?.role}</p>
                        </div>
                    </div>
                    <Link to="/profile" onClick={onNavigate} className={`${ITEM_BASE} ${ITEM_IDLE}`}>
                        Profile
                    </Link>
                    <button type="button" onClick={onLogout} className={`${ITEM_BASE} text-danger hover:bg-danger/10`}>
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}