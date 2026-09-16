import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import RoleTabs from "../../components/auth/RoleTabs";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { ROLES } from "../../utils/roles";
import { register, googleAuth } from "../../api/auth";
import { saveSession } from "../../utils/tokenStorage";

const INITIAL_FORM = { name: "", email: "", password: "", confirmPassword: "", secretKey: "" };

export default function SignupPage() {
    const navigate = useNavigate();
    const [role, setRole] = useState(ROLES.LEARNER);
    const [form, setForm] = useState(INITIAL_FORM);
    const [pic, setPic] = useState(null);
    const [errors, setErrors] = useState({});
    const [banner, setBanner] = useState(null); // { variant, message }
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = "Name is required";
        if (!form.email.trim()) next.email = "Email is required";
        if (form.password.length < 6) next.password = "Password must be at least 6 characters";
        if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match";
        if (role === ROLES.ADMIN && !form.secretKey.trim()) {
            next.secretKey = "Admin registration code is required";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const payload = { name: form.name, email: form.email, password: form.password };
            if (role !== ROLES.LEARNER && pic) payload.pic = pic;
            if (role === ROLES.ADMIN) payload.secretKey = form.secretKey;

            const data = await register(role, payload);

            // Deliberately NOT auto-logging in here, even though the backend's
            // register response already includes a usable token: for
            // password-based signup the account still needs email
            // verification, and loginLearner/Instructor/Admin blocks
            // unverified accounts. Auto-login off this token would put the
            // UI in a "logged in" state a subsequent real login can't
            // reproduce. Google signup (below) is verified immediately, so
            // that path DOES save the session.
            setBanner({
                variant: "success",
                message: data.msg || "Account created — check your email to verify it, then sign in.",
            });
            setForm(INITIAL_FORM);
            setPic(null);
        } catch (err) {
            setBanner({
                variant: "danger",
                message: err.response?.data?.msg || "Something went wrong, please try again",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleCredential = async (idToken) => {
        setBanner(null);
        try {
            const data = await googleAuth(role, idToken);
            const user = data.learner || data.instructor || data.admin;
            saveSession(data.token, user);
            navigate("/");
        } catch (err) {
            setBanner({ variant: "danger", message: err.response?.data?.msg || "Google sign-up failed" });
        }
    };

    return (
        <AuthLayout title="Create your account" subtitle="Choose your role to get started">
            <RoleTabs value={role} onChange={setRole} />

            {banner && (
                <div className="mb-4">
                    <Alert variant={banner.variant}>{banner.message}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                    id="name"
                    name="name"
                    label="Full name"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                />
                <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                />
                <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                />
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                />

                {role === ROLES.ADMIN && (
                    <Input
                        id="secretKey"
                        name="secretKey"
                        type="password"
                        label="Admin registration code"
                        placeholder="Provided by your platform owner"
                        value={form.secretKey}
                        onChange={handleChange}
                        error={errors.secretKey}
                    />
                )}

                {(role === ROLES.INSTRUCTOR || role === ROLES.ADMIN) && (
                    <div className="w-full">
                        <label htmlFor="pic" className="mb-1.5 block text-sm font-medium text-text-secondary">
                            Profile photo <span className="text-text-muted">(optional)</span>
                        </label>
                        <input
                            id="pic"
                            name="pic"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPic(e.target.files?.[0] ?? null)}
                            className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary"
                        />
                    </div>
                )}

                <Button type="submit" isLoading={isSubmitting}>
                    Create account
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
                Already have an account?{" "}
                <Link to="/signin" className="font-medium text-primary hover:underline">
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
}