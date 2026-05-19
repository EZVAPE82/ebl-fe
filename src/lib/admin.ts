/**
 * 어드민 전용 API 호출 + 토큰 관리.
 * 일반 회원 sessionStorage 토큰(accessToken)과 분리: adminAccessToken
 *
 * 401 처리:
 *  - 어드민은 refresh 토큰 없음(짧은 15분 access만)
 *  - 401 발생 시 토큰 즉시 정리 + /admin/login 으로 이동
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
    if (!token) {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
            window.location.replace("/admin/login");
        }
        throw new ApiError(401, "ADMIN_UNAUTHENTICATED", "어드민 로그인이 필요합니다.");
    }
    const headers: HeadersInit = {
        ...(opts.headers ?? {}),
        Authorization: `Bearer ${token}`,
    };
    try {
        return await api<T>(path, { ...opts, headers });
    } catch (e) {
        // 일반 api()는 401 시 일반 회원 refresh를 시도하는데 어드민은 별도 처리 필요
        if (e instanceof ApiError && (e.status === 401 || e.code === "TOKEN_EXPIRED" || e.code === "TOKEN_INVALID")) {
            clearAdminToken();
            if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
                window.location.replace("/admin/login");
            }
        }
        throw e;
    }
}

export async function adminLogin(username: string, password: string) {
    const res = await api<{ accessToken: string }>("/api/v1/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
    // httpOnly 쿠키도 백엔드에서 자동 발급되므로 향후 sessionStorage 제거 예정.
    // 현재는 점진 전환 단계: 헤더 + 쿠키 둘 다 운용.
    setAdminToken(res.accessToken);
    return res;
}

export async function adminLogout() {
    try {
        await api("/api/v1/admin/auth/logout", { method: "POST" });
    } catch {
        // 로그아웃은 어떤 경우에도 클라이언트 상태는 항상 정리
    }
    clearAdminToken();
    if (typeof window !== "undefined") {
        window.location.replace("/admin/login");
    }
}
