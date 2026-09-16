export default function Input({ label, id, error, type = "text", className = "", ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 ${error ? "border-danger" : "border-border"
                    } ${className}`}
                {...props}
            />
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>
    );
}