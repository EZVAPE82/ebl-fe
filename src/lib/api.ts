/**
 * 백엔드 API 호출 래퍼.
 *
 * 보안 가이드:
 * - API 베이스 URL은 환경변수에서 (.env.local)
 * - 토큰은 httpOnly 쿠키 또는 Authorization 헤더 (XSS 방어)
 * - 시크릿/키는 절대 클라이언트에 노출 X (NEXT_PUBLIC_* 만 클라이언트 사용)
 * - 에러 응답에서 traceId 보존
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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
};

export async function api<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
    const { auth = false, headers, ...rest } = opts;

    const finalHeaders: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(headers ?? {}),
    };

    if (auth && typeof window !== "undefined") {
        const token = sessionStorage.getItem("accessToken");
        if (token) {
            (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
        }
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers: finalHeaders,
        credentials: "include",
    });

    if (!res.ok) {
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

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}
