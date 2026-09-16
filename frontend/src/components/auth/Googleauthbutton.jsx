import { GoogleLogin } from "@react-oauth/google";

// googleAuthLearner/Instructor/Admin all verify an ID token
// (google-auth-library's client.verifyIdToken), which is exactly what
// GoogleLogin's onSuccess gives us as `credential` — NOT the access_token
// you'd get from useGoogleLogin(). Don't swap this for that hook.
export default function GoogleAuthButton({ onCredential, onError }) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
        return (
            <button
                type="button"
                disabled
                title="Set VITE_GOOGLE_CLIENT_ID in .env to enable Google sign-in"
                className="w-full cursor-not-allowed rounded-md border border-border bg-surface-hover px-4 py-2.5 text-sm text-text-muted"
            >
                Google sign-in not configured
            </button>
        );
    }

    return (
        <GoogleLogin
            onSuccess={(res) => onCredential(res.credential)}
            onError={() => onError("Google sign-in failed, please try again")}
            width="100%"
        />
    );
}