import { useState } from "react";

const SMALL_BUTTON =
    "rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Edits a list of short texts.
 *
 * Props
 *  id, label, error, hint, placeholder
 *  items      string[]            the current list (controlled)
 *  onChange   (items) => void
 *  variant    "chips" | "list"    chips = inline tags (technologies); list = numbered rows with
 *                                 move up/down (curriculum, where the order matters)
 *  multiline  bool                textarea instead of a single-line input (for longer points)
 *  maxItems, maxLength
 *
 * An item is added with the Add button, with Enter (single-line) or with a comma (chips).
 * Text still sitting in the box when the field loses focus is added too, so nothing typed is lost
 * when the form is submitted.
 */
export default function ListInput({
    id,
    label,
    items,
    onChange,
    error,
    hint,
    placeholder = "",
    variant = "chips",
    multiline = false,
    maxItems = 30,
    maxLength = 300,
}) {
    const [draft, setDraft] = useState("");
    const isChips = variant === "chips";

    const addDraft = () => {
        const value = draft.trim();
        setDraft("");
        if (!value || items.length >= maxItems) return;
        if (items.some((item) => item.toLowerCase() === value.toLowerCase())) return;
        onChange([...items, value]);
    };

    const removeAt = (index) => onChange(items.filter((_, i) => i !== index));

    const move = (index, step) => {
        const target = index + step;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !multiline) {
            e.preventDefault();
            addDraft();
        } else if (e.key === "," && isChips) {
            e.preventDefault();
            addDraft();
        }
    };

    const fieldProps = {
        id,
        value: draft,
        maxLength,
        placeholder,
        onChange: (e) => setDraft(e.target.value),
        onKeyDown: handleKeyDown,
        onBlur: addDraft,
        "aria-invalid": Boolean(error),
        className: `min-w-0 flex-1 rounded-md border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 ${error ? "border-danger" : "border-border"
            }`,
    };

    return (
        <div className="w-full">
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-secondary">
                {label}
            </label>

            <div className="flex items-start gap-2">
                {multiline ? <textarea rows={2} {...fieldProps} /> : <input type="text" {...fieldProps} />}
                <button
                    type="button"
                    onClick={addDraft}
                    className="shrink-0 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                >
                    Add
                </button>
            </div>

            {hint && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}

            {items.length > 0 &&
                (isChips ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                        {items.map((item, index) => (
                            <li
                                key={item}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-hover px-3 py-1 text-sm text-text-primary"
                            >
                                <span>{item}</span>
                                <button
                                    type="button"
                                    onClick={() => removeAt(index)}
                                    aria-label={`Remove ${item}`}
                                    className="text-text-muted transition-colors hover:text-danger"
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ol className="mt-3 space-y-2">
                        {items.map((item, index) => (
                            <li
                                key={item}
                                className="flex items-start gap-3 rounded-md border border-border bg-surface px-3 py-2"
                            >
                                <span className="mt-0.5 w-5 shrink-0 text-xs font-medium text-text-muted">{index + 1}.</span>
                                <p className="min-w-0 flex-1 whitespace-pre-line break-words text-sm text-text-primary">{item}</p>
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => move(index, -1)}
                                        disabled={index === 0}
                                        aria-label={`Move point ${index + 1} up`}
                                        className={SMALL_BUTTON}
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(index, 1)}
                                        disabled={index === items.length - 1}
                                        aria-label={`Move point ${index + 1} down`}
                                        className={SMALL_BUTTON}
                                    >
                                        ↓
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeAt(index)}
                                        aria-label={`Remove point ${index + 1}`}
                                        className={`${SMALL_BUTTON} hover:text-danger`}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                ))}
        </div>
    );
}