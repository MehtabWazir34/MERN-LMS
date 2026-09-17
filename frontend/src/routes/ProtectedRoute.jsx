import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, children }) {
    const { isAuthenticated, role } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // Logged in, just not allowed on this route — send them to their own
        // dashboard instead of a dead-end "forbidden" page.
        return <Navigate to={`/${role}`} replace />;
    }

    return children;
}