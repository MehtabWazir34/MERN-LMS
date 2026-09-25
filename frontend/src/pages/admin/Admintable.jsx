import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { getAllAdmins, deleteAdmin } from "../../api/admin.js";
import { useAuth } from "../../context/AuthContext";

export default function AdminTable() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [banner, setBanner] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setStatus("loading");
            try {
                const data = await getAllAdmins({ signal: controller.signal });
                setAdmins(data.admins);
                setStatus("success");
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;
                setStatus("error");
            }
        };

        load();
        return () => controller.abort();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this admin account? This cannot be undone.")) return;
        setDeletingId(id);
        setBanner(null);
        try {
            await deleteAdmin(id);
            setAdmins((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to remove admin" });
        } finally {
            setDeletingId(null);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (status === "error") {
        return <Alert variant="danger">Couldn't load admins.</Alert>;
    }

    const isLastAdmin = admins.length <= 1;

    return (
        <div>
            {banner && (
                <div className="mb-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            {admins.length === 0 ? (
                <p className="text-sm text-text-secondary">No admins found.</p>
            ) : (
                <ul className="space-y-3">
                    {admins.map((admin) => {
                        const isSelf = admin._id === user?._id;
                        const disableDelete = isSelf || isLastAdmin;
                        const disabledReason = isSelf
                            ? "You cannot remove your own account"
                            : isLastAdmin
                                ? "At least one admin must remain"
                                : "";

                        return (
                            <li
                                key={admin._id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-text-primary">
                                        {admin.name} {isSelf && <span className="text-text-muted">(you)</span>}
                                    </p>
                                    <p className="truncate text-sm text-text-secondary">{admin.email}</p>
                                    <p className="mt-1 text-xs text-text-muted">
                                        <span className={admin.verifiedStatus ? "text-success" : "text-warning"}>
                                            {admin.verifiedStatus ? "Verified" : "Unverified"}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(admin._id)}
                                    disabled={disableDelete || deletingId === admin._id}
                                    title={disabledReason}
                                    className="shrink-0 rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deletingId === admin._id ? "Removing…" : "Remove"}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}