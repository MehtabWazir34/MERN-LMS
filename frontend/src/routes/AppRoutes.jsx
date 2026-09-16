import { Routes, Route, Navigate } from "react-router-dom";
import SignupPage from "../pages/auth/SignupPage";
import SigninPage from "../pages/auth/SigninPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signin" element={<SigninPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Placeholder until ProtectedRoute/role dashboards land next phase */}
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
    );
}