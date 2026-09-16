const STYLES = {
    success: "bg-success/10 text-success border-success/30",
    danger: "bg-danger/10 text-danger border-danger/30",
    info: "bg-info/10 text-info border-info/30",
    warning: "bg-warning/10 text-warning border-warning/30",
};

export default function Alert({ variant = "info", children }) {
    if (!children) return null;
    return (
        <div className={`rounded-md border px-3.5 py-2.5 text-sm ${STYLES[variant]}`} role="alert">
            {children}
        </div>
    );
}