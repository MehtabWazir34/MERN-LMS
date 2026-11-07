import { useEffect, useState } from "react";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // same limit as the server

const REMOVE_BUTTON =
    "absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white transition-colors hover:bg-black/80";

/**
 * Chooses images and shows what is already there.
 *
 * Props
 *  id, label, hint, error
 *  multiple          true = several images (project); false = one image (team member picture)
 *  max               most images in total (multiple mode)
 *  existing          [{ url, publicId }] images that are already saved
 *  onExistingChange  (list) => void   called when a saved image is removed (multiple mode only)
 *  files             File[]           newly chosen images (controlled by the parent)
 *  onFilesChange     (files) => void
 *
 * In single mode a newly chosen file replaces the saved picture, so the saved one is hidden
 * while a new file is selected, and shown again if the new file is removed.
 * Type (JPG, PNG, WebP) and size (5 MB) are checked here, before anything is uploaded.
 */
export default function ImagePicker({
    id,
    label,
    hint,
    error,
    multiple = false,
    max = 1,
    existing = [],
    onExistingChange,
    files,
    onFilesChange,
}) {
    const [previews, setPreviews] = useState([]);
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviews(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [files]);

    const shownExisting = multiple || files.length === 0 ? existing : [];
    const total = shownExisting.length + files.length;
    const slotsLeft = max - total;

    const handleChange = (e) => {
        const picked = Array.from(e.target.files ?? []);
        e.target.value = ""; // lets the same file be chosen again later
        if (picked.length === 0) return;

        setLocalError(null);
        const problems = [];
        const valid = picked.filter((file) => {
            if (!TYPES.includes(file.type)) {
                problems.push(`${file.name}: use a JPG, PNG or WebP image`);
                return false;
            }
            if (file.size > MAX_BYTES) {
                problems.push(`${file.name}: must be 5 MB or smaller`);
                return false;
            }
            return true;
        });

        if (!multiple) {
            if (valid[0]) onFilesChange([valid[0]]);
        } else {
            const accepted = valid.slice(0, Math.max(0, slotsLeft));
            if (valid.length > accepted.length) problems.push(`At most ${max} images are allowed in total`);
            if (accepted.length > 0) onFilesChange([...files, ...accepted]);
        }

        if (problems.length > 0) setLocalError(problems.join(". "));
    };

    const removeExisting = (publicId) => onExistingChange?.(existing.filter((image) => image.publicId !== publicId));
    const removeNew = (index) => onFilesChange(files.filter((_, i) => i !== index));

    const shownError = error || localError;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {label}
                    {multiple && (
                        <span className="text-text-muted">
                            {" "}
                            ({total}/{max})
                        </span>
                    )}
                </label>
            )}

            {(shownExisting.length > 0 || files.length > 0) && (
                <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {shownExisting.map((image) => (
                        <li
                            key={image.publicId}
                            className="relative aspect-video overflow-hidden rounded-md border border-border bg-surface-hover"
                        >
                            <img src={image.url} alt="" className="h-full w-full object-cover" />
                            {multiple && (
                                <button
                                    type="button"
                                    onClick={() => removeExisting(image.publicId)}
                                    aria-label="Remove this image"
                                    className={REMOVE_BUTTON}
                                >
                                    ✕
                                </button>
                            )}
                        </li>
                    ))}
                    {files.map((file, index) => (
                        <li
                            key={`${file.name}-${file.size}-${index}`}
                            className="relative aspect-video overflow-hidden rounded-md border border-border bg-surface-hover"
                        >
                            {previews[index] && <img src={previews[index]} alt="" className="h-full w-full object-cover" />}
                            <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                                New
                            </span>
                            <button
                                type="button"
                                onClick={() => removeNew(index)}
                                aria-label={`Remove ${file.name}`}
                                className={REMOVE_BUTTON}
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <input
                id={id}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple={multiple}
                onChange={handleChange}
                disabled={multiple && slotsLeft <= 0}
                aria-invalid={Boolean(shownError)}
                className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary disabled:opacity-50"
            />
            <p className="mt-1.5 text-xs text-text-muted">{hint ?? "JPG, PNG or WebP, up to 5 MB each."}</p>
            {shownError && <p className="mt-1.5 text-xs text-danger">{shownError}</p>}
        </div>
    );
}