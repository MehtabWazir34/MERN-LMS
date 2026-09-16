import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import RoleTabs from "../../components/auth/RoleTabs";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { ROLES } from "../../utils/roles";
import { login, googleAuth, resendVerification } from "../../api/auth";
import { saveSession } from "../../utils/tokenStorage";

export default function SigninPage() {
    const navigate = useNavigate();
    const [role, setRole] = useState(ROLES.LEARNER);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [banner, setBanner] = useState(null); // { variant, message }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const validate = () => {
        const next = {};
        if (!email.trim()) next.email = "Email is required";
        if (!password) next.password = "Password is required";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const completeLogin = (data) => {
        const user = data.learner || data.instructor || data.admin;
        saveSession(data.token, user);
        navigate("/");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);
        setNeedsVerification(false);
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const data = await login(role, { email, password });
            completeLogin(data);
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.msg || "Failed to sign in";
            setBanner({ variant: "danger", message });
            // Backend's loginLearner/Instructor/Admin returns 403 specifically
            // for an unverified account — that's the one case worth a
            // dedicated recovery action instead of just showing the error.
            if (status === 403) setNeedsVerification(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const data = await resendVerification(role, email);
            setBanner({ variant: "success", message: data.msg || "Verification email resent!" });
            setNeedsVerification(false);
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Failed to resend email" });
        } finally {
            setIsResending(false);
        }
    };

    const handleGoogleCredential = async (idToken) => {
        setBanner(null);
        try {
            const data = await googleAuth(role, idToken);
            completeLogin(data);
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Google sign-in failed" });
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to continue to your dashboard">
            <RoleTabs value={role} onChange={setRole} />

            {banner && (
                <div className="mb-4 space-y-2">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                    {needsVerification && (
                        <Button variant="secondary" onClick={handleResend} isLoading={isResending}>
                            Resend verification email
                        </Button>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                    id="email"
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                />
                <Input
                    id="password"
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                />

                <Button type="submit" isLoading={isSubmitting}>
                    Sign in
                </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-text-muted">or</span>
                <span className="h-px flex-1 bg-border" />
            </div>

            <GoogleAuthButton
                onCredential={handleGoogleCredential}
                onError={(message) => setBanner({ variant: "danger", message })}
            />

            <p className="mt-6 text-center text-sm text-text-secondary">
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                    Create one
                </Link>
            </p>
        </AuthLayout>
    );
}