export default function Spinner({ size = "md" }) {
    const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";
    return (
        <span
            className={`${dim} inline-block animate-spin rounded-full border-2 border-current border-t-transparent`}
            role="status"
            aria-label="Loading"
        />
    );
}