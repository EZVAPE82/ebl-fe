"use client";

import {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
    type ReactNode
} from "react";
import { api, ApiError } from "@/lib/api";

const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

type Me = {
    id: number;
    email: string;
    name: string;
    phone: string;
    memberType: string;
    status: string;
};

type AuthState = {
    user: Me | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

function setTokens(access: string, refresh: string) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(TOKEN_KEY, access);
    if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh);
}

function clearTokens() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        try {
            const me = await api<Me>("/api/v1/members/me", { auth: true });
            setUser(me);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        (async () => {
            await fetchMe();
            setLoading(false);
        })();
    }, [fetchMe]);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api<{ accessToken: string; refreshToken: string }>(
            "/api/v1/auth/login",
            { method: "POST", body: JSON.stringify({ email, password }) }
        );
        setTokens(res.accessToken, res.refreshToken);
        await fetchMe();
    }, [fetchMe]);

    const logout = useCallback(async () => {
        try {
            await api("/api/v1/auth/logout", { method: "POST", auth: true });
        } catch { /* ignore */ }
        clearTokens();
        setUser(null);
    }, []);

    const refresh = useCallback(async () => {
        const rt = sessionStorage.getItem(REFRESH_KEY);
        if (!rt) throw new ApiError(401, "NO_REFRESH", "리프레시 토큰이 없습니다.");
        const res = await api<{ accessToken: string; refreshToken: string }>(
            "/api/v1/auth/refresh",
            { method: "POST", body: JSON.stringify({ refreshToken: rt }) }
        );
        setTokens(res.accessToken, res.refreshToken);
        await fetchMe();
    }, [fetchMe]);

    const value = useMemo<AuthState>(() => ({
        user, loading, login, logout, refresh,
    }), [user, loading, login, logout, refresh]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
    const v = useContext(Ctx);
    if (!v) throw new Error("useAuth must be used within AuthProvider");
    return v;
}
