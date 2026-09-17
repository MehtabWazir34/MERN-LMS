import Spinner from "./Spinner";

const VARIANTS = {
    primary: "bg-primary-btn text-white hover:bg-primary-btn-hover",
    secondary: "bg-surface text-text-primary border border-border hover:bg-surface-hover",
    danger: "bg-danger text-white hover:opacity-90",
};

export default function Button({
    children,
    variant = "primary",
    isLoading = false,
    disabled = false,
    type = "button",
    fullWidth = true,
    className = "",
    ...props
}) {
    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            className={`inline-flex ${fullWidth ? "w-full" : "w-auto"} items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
            {...props}
        >
            {isLoading && <Spinner size="sm" />}
            {children}
        </button>
    );
}