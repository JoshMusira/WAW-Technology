import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "~/hooks/use-auth";

type AuthContextValue = {
    user: AuthUser | null;
    setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
    clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser) as AuthUser);
        }
    }, []);

    const setSession = (accessToken: string, refreshToken: string, nextUser: AuthUser) => {
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(nextUser));
        setUser(nextUser);
    };

    const clearSession = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setSession, clearSession }}>
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
