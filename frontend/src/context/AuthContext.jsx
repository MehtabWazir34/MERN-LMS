import { createContext, useContext, useMemo, useState } from "react";
import { getToken, getStoredUser, saveSession, clearSession } from "../utils/tokenStorage";
import { logout as apiLogout } from "../api/auth";

const AuthContext = createContext(null);

// Deliberately no /me verification call on mount (a project decision, not
// an oversight): state is seeded straight from localStorage and trusted
// until an actual API call comes back 401 — see http.js's response
// interceptor, which is what catches an expired/invalid token in
// practice and forces a clean logout.
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => getToken());
    const [user, setUser] = useState(() => getStoredUser());

    const login = (newToken, newUser) => {
        saveSession(newToken, newUser);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = async () => {
        try {
            // logoutLearner/Instructor/Admin are currently stateless (no token
            // blocklist), so this call doesn't invalidate the token server-side —
            // it's here for symmetry and in case that changes later. The
            // client-side clear below is what actually ends the session today.
            if (user?.role) await apiLogout(user.role);
        } catch {
            // Never let a network hiccup block logout.
        } finally {
            clearSession();
            setToken(null);
            setUser(null);
        }
    };

    const value = useMemo(
        () => ({
            token,
            user,
            role: user?.role ?? null,
            isAuthenticated: Boolean(token),
            login,
            logout,
        }),
        [token, user, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}