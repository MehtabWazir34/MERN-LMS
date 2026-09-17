import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { verifyEmail } from "../../api/auth";
import { decodeJwtPayload } from "../../utils/Jwt.js";

// The emailed link is `${clientUrl}/verify-email?token=...` — role-agnostic.
// generateEmailVerifyToken embeds the role in the JWT payload, so we
// decode (not verify — the server does that) just to know which of
// /lms/admin, /lms/instructor, /lms/learner to call.
export default function VerifyEmailPage() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const run = async () => {
            if (!token) {
                setStatus("error");
                setMessage("This verification link is missing its token.");
                return;
            }

            const decoded = decodeJwtPayload(token);
            const role = decoded?.role;
            if (!role) {
                setStatus("error");
                setMessage("This verification link is invalid or has expired.");
                return;
            }

            try {
                const data = await verifyEmail(role, token);
                setStatus("success");
                setMessage(data.msg || "Your email has been verified!");
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.msg || "This link is invalid or has expired.");
            }
        };
        run();
    }, [token]);

    return (
        <AuthLayout title="Email verification">
            {status === "loading" && (
                <div className="flex items-center gap-3 text-text-secondary">
                    <Spinner />
                    <span>Verifying your email…</span>
                </div>
            )}

            {status !== "loading" && (
                <div className="space-y-4">
                    <Alert variant={status === "success" ? "success" : "danger"}>{message}</Alert>
                    <Link
                        to="/signin"
                        className="inline-block text-sm font-medium text-primary hover:underline"
                    >
                        Go to sign in
                    </Link>
                </div>
            )}
        </AuthLayout>
    );
}