import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GuestRoute({ children }) {
    const { isAuthenticated, role } = useAuth();
    if (isAuthenticated) return <Navigate to={`/${role}`} replace />;
    return children;
}