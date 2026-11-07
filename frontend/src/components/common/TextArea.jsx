// Same look as Input. With `maxLength` it also shows a character counter.
export default function TextArea({ label, id, error, value = "", maxLength, rows = 3, className = "", ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {label}
                </label>
            )}
            <textarea
                id={id}
                rows={rows}
                value={value}
                maxLength={maxLength}
                aria-invalid={Boolean(error)}
                className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 ${error ? "border-danger" : "border-border"
                    } ${className}`}
                {...props}
            />
            {(error || maxLength) && (
                <div className="mt-1.5 flex items-start justify-between gap-3">
                    <p className="text-xs text-danger">{error}</p>
                    {maxLength && (
                        <p className="shrink-0 text-xs text-text-muted">
                            {value.length}/{maxLength}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}