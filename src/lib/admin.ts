/**
 * 어드민 전용 API 호출 + 토큰 관리.
 * 일반 회원 sessionStorage 토큰(accessToken)과 분리: adminAccessToken
 */

import { api, ApiError } from "@/lib/api";

const KEY = "adminAccessToken";

export function getAdminToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(KEY);
}

export function setAdminToken(token: string) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(KEY, token);
}

export function clearAdminToken() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(KEY);
}

export async function adminApi<T = unknown>(
    path: string,
    opts: { method?: string; body?: string; headers?: HeadersInit } = {}
): Promise<T> {
    const token = getAdminToken();
    if (!token) throw new ApiError(401, "ADMIN_UNAUTHENTICATED", "어드민 로그인이 필요합니다.");
    const headers: HeadersInit = {
        ...(opts.headers ?? {}),
        Authorization: `Bearer ${token}`,
    };
    return api<T>(path, { ...opts, headers });
}

export async function adminLogin(username: string, password: string) {
    const res = await api<{ accessToken: string }>("/api/v1/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
    setAdminToken(res.accessToken);
    return res;
}
