import { ROLE_LIST, ROLE_LABELS } from "../../utils/roles";

// This selector only decides which API base path to call
// (/lms/admin vs /lms/instructor vs /lms/learner). It grants nothing by
// itself — restrictTo() on the backend is what actually enforces role,
// so a learner picking "Admin" here just gets a 403/401 from the server,
// never real access.
export default function RoleTabs({ value, onChange }) {
    return (
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-md border border-border bg-surface p-1">
            {ROLE_LIST.map((role) => (
                <button
                    key={role}
                    type="button"
                    onClick={() => onChange(role)}
                    className={`rounded px-3 py-2 text-sm font-medium transition-colors ${value === role ? "bg-primary text-white" : "text-text-secondary hover:bg-surface-hover"
                        }`}
                >
                    {ROLE_LABELS[role]}
                </button>
            ))}
        </div>
    );
}