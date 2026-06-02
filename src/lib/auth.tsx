"use client";

/**
 * 인증 컨텍스트 — 점진 전환 단계.
 *
 * 현재(P0-8 hybrid):
 *  - 백엔드: Set-Cookie (httpOnly, Secure, SameSite=Strict) + JSON body 둘 다 반환
 *  - 프론트: sessionStorage 토큰 유지 + credentials: 'include' 로 쿠키도 자동 전송
 *  - 점진 마이그레이션 후 sessionStorage 부분 제거 예정 (XSS 토큰 탈취 완전 차단)
 *
 * Next phase:
 *  - sessionStorage 사용 제거 → fetchMe()만으로 인증 상태 확인
 *  - login 응답에서 토큰 무시 (쿠키만 사용)
 */

import {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
    type ReactNode
} from "react";
import { api } from "@/lib/api";

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

function clearTokens() {
    // 토큰은 httpOnly 쿠키로만 보관 — 과거 세션의 잔존 sessionStorage 만 정리 (레거시 클린업).
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
        // 로그인 응답의 토큰은 무시 — 백엔드가 httpOnly 쿠키(Set-Cookie)로 세팅한다.
        // 인증 상태는 fetchMe()(쿠키로 /members/me 호출)로 확인.
        await api("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
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
        // refresh 토큰도 httpOnly 쿠키 — body 없이 호출(백엔드 쿠키 fallback). 새 쿠키는 Set-Cookie 로 갱신.
        await api("/api/v1/auth/refresh", { method: "POST" });
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
