import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, maxWidth = "max-w-lg", children }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);

        // Prevent background scroll while a modal is open.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
                className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-lg bg-surface p-6 shadow-lg`}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-lg text-text-primary">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-md p-1 text-xl leading-none text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}