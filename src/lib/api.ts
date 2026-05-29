/**
 * 백엔드 API 호출 래퍼.
 *
 * 보안 가이드:
 * - API 베이스 URL은 환경변수에서 (.env.local)
 * - 토큰은 httpOnly 쿠키 또는 Authorization 헤더 (XSS 방어)
 * - 시크릿/키는 절대 클라이언트에 노출 X (NEXT_PUBLIC_* 만 클라이언트 사용)
 * - 에러 응답에서 traceId 보존
 *
 * 401 처리:
 * - auth=true 요청이 401이면 자동으로 /api/v1/auth/refresh 시도
 * - 성공: 새 토큰으로 원 요청 재시도
 * - 실패: 토큰 정리 후 /login?redirect=현재경로 이동 (브라우저 환경 한정)
 */

// .env.local 의 NEXT_PUBLIC_API_BASE_URL 가 우선. fallback 은 로컬 백엔드 기본 포트.
// 다른 프로젝트와 충돌 회피해 8090 사용 (application-local.yml 의 server.port 와 일치).
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8090";
// raw POST/multipart 같이 api() 헬퍼 거치지 않는 경우 (이미지 업로드 등) 위해 export.
export const API_BASE = BASE_URL;

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly traceId?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

type FetchOptions = RequestInit & {
    auth?: boolean;
    /** 내부 재진입 방지 플래그 — 외부 호출자는 사용 금지 */
    _retried?: boolean;
};

export async function api<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
    const { auth = false, headers, _retried = false, ...rest } = opts;

    const finalHeaders: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(headers ?? {}),
    };

    if (auth && typeof window !== "undefined") {
        const token = sessionStorage.getItem(ACCESS_KEY);
        if (token) {
            (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
        }
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers: finalHeaders,
        credentials: "include",
    });

    if (res.status === 204) {
        return undefined as T;
    }

    if (res.ok) {
        return res.json() as Promise<T>;
    }

    // ----- 401 자동 처리 (auth 요청 한정, 1회만 재시도) -----
    if (res.status === 401 && auth && !_retried && typeof window !== "undefined") {
        // 어드민 토큰 경로는 별도 처리 (lib/admin.ts)이므로 여기선 일반 회원 refresh만
        const refreshed = await tryRefresh();
        if (refreshed) {
            return api<T>(path, { ...opts, _retried: true });
        }
        // refresh 실패 → 토큰 정리 + 로그인 페이지로
        clearMemberTokens();
        if (!window.location.pathname.startsWith("/login")) {
            const redirect = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.replace(`/login?redirect=${redirect}`);
        }
    }

    let body: { code?: string; message?: string; traceId?: string } = {};
    try {
        body = await res.json();
    } catch {
        // body가 JSON이 아닌 경우
    }
    throw new ApiError(
        res.status,
        body.code ?? "UNKNOWN",
        body.message ?? "요청을 처리하지 못했습니다.",
        body.traceId
    );
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
        const rt = sessionStorage.getItem(REFRESH_KEY);
        if (!rt) return false;
        try {
            const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: rt }),
                credentials: "include",
            });
            if (!res.ok) return false;
            const data = await res.json() as { accessToken?: string; refreshToken?: string };
            if (!data.accessToken) return false;
            sessionStorage.setItem(ACCESS_KEY, data.accessToken);
            if (data.refreshToken) sessionStorage.setItem(REFRESH_KEY, data.refreshToken);
            return true;
        } catch {
            return false;
        } finally {
            refreshInFlight = null;
        }
    })();

    return refreshInFlight;
}

function clearMemberTokens() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
}
