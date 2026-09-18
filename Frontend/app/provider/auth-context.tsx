import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { AuthUser } from "~/hooks/use-auth";

type AuthContextValue = {
    user: AuthUser | null;
    setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
    clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    const navigate = useNavigate();
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser) as AuthUser);
        }
    }, []);

    useEffect(() => {
        const handleForceLogout = () => {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            setUser(null);
            navigate("/login", { replace: true });
        };

        window.addEventListener("force-logout", handleForceLogout);
        return () => window.removeEventListener("force-logout", handleForceLogout);
    }, [navigate]);

    const setSession = useCallback((accessToken: string, refreshToken: string, nextUser: AuthUser) => {
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(nextUser));
        setUser(nextUser);
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
    }, []);

    const contextValue = useMemo(() => ({ user, setSession, clearSession }), [user, setSession, clearSession]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return context;
}
