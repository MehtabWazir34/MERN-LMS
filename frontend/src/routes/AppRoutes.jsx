import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/public/Homepage.jsx";
import CoursesPage from "../pages/public/Coursespage.jsx";
import CourseDetailPage from "../pages/public/Coursedetailpage.jsx";
import SignupPage from "../pages/auth/SignupPage.jsx";
import SigninPage from "../pages/auth/SigninPage.jsx";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage.jsx";
import AdminDashboardPage from "../pages/admin/DashboardPage.jsx";
import InstructorDashboardPage from "../pages/instructor/DashboardPage.jsx";
import CourseFormPage from "../pages/instructor/Courseformpage.jsx";
import CourseManagePage from "../pages/instructor/Coursemanagepage .jsx";
import LearnerDashboardPage from "../pages/learner/DashboardPage.jsx";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./Guestroute";
import { ROLES } from "../utils/roles.js";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public — always visible, logged in or not. Navbar (not a route
          guard) is what changes based on auth state here. */}
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />

            <Route
                path="/signup"
                element={
                    <GuestRoute>
                        <SignupPage />
                    </GuestRoute>
                }
            />
            <Route
                path="/signin"
                element={
                    <GuestRoute>
                        <SigninPage />
                    </GuestRoute>
                }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/instructor"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
                        <InstructorDashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/instructor/courses/new"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
                        <CourseFormPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/instructor/courses/:id/edit"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
                        <CourseFormPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/instructor/courses/:id/manage"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
                        <CourseManagePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/learner"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.LEARNER]}>
                        <LearnerDashboardPage />
                    </ProtectedRoute>
                }
            />

            {/* Unmatched paths land on the homepage now that it's real content,
          rather than forcing a signin redirect. */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}