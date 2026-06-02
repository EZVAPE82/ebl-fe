/**
 * 어드민 전용 API 호출.
 *
 * 인증: httpOnly 쿠키(adminAccess)만 사용 — 토큰을 JS(sessionStorage)에 보관하지 않음(XSS 차단).
 * 로그인 상태는 verifyAdminSession()(GET /api/v1/admin/me)으로 확인.
 *
 * 401 처리:
 *  - 어드민은 refresh 없음(짧은 15분 access). 401/403 시 /admin/login 으로 이동.
 */

import { api, ApiError } from "@/lib/api";

/** 어드민 세션 유효성 확인 — 쿠키 기반. 유효하면 true. */
export async function verifyAdminSession(): Promise<boolean> {
    try {
        await api("/api/v1/admin/me");
        return true;
    } catch {
        return false;
    }
}

export async function adminApi<T = unknown>(
    path: string,
    opts: { method?: string; body?: string; headers?: HeadersInit } = {}
): Promise<T> {
    try {
        // 인증은 쿠키(credentials:'include')로 전송 — Authorization 헤더 주입 없음.
        return await api<T>(path, { ...opts });
    } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403
            || e.code === "TOKEN_EXPIRED" || e.code === "TOKEN_INVALID" || e.code === "ADMIN_UNAUTHENTICATED")) {
            if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
                window.location.replace("/admin/login");
            }
        }
        throw e;
    }
}

export async function adminLogin(username: string, password: string) {
    // 응답 토큰은 무시 — 백엔드가 httpOnly 어드민 쿠키(Set-Cookie)를 세팅한다.
    await api("/api/v1/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
}

export async function adminLogout() {
    try {
        await api("/api/v1/admin/auth/logout", { method: "POST" });
    } catch {
        // 로그아웃은 어떤 경우에도 클라이언트 상태는 항상 정리
    }
    // 레거시: 과거 세션의 잔존 sessionStorage 토큰 정리
    if (typeof window !== "undefined") {
        sessionStorage.removeItem("adminAccessToken");
        window.location.replace("/admin/login");
    }
}
