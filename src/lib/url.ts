/**
 * 외부 입력 URL을 안전하게 처리하기 위한 유틸.
 *
 * 어드민(콘텐츠 등록)이 자유 텍스트로 URL 입력하면 사용자에게 그대로 노출되므로,
 * `<Link href>`·`<a href>`·`<img src>` 등에 박기 전에 반드시 검증.
 *
 * 허용 프로토콜: http, https
 * 허용 형태: 절대경로(/path), 같은 오리진 path, 위 프로토콜
 * 차단: javascript:, data:, vbscript:, file: 등
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * 안전한 링크 URL만 반환. 위험하면 fallback (기본 "#").
 */
export function safeLinkUrl(raw: string | null | undefined, fallback = "#"): string {
    if (!raw) return fallback;
    const s = raw.trim();
    if (!s) return fallback;

    // 같은 오리진 절대경로 — OK (예: /promo, /c/disposable)
    if (s.startsWith("/") && !s.startsWith("//")) {
        return s;
    }

    try {
        // base 없이 절대 URL만 파싱 — 상대 URL은 일부러 거절
        const u = new URL(s);
        if (ALLOWED_PROTOCOLS.has(u.protocol)) {
            return u.toString();
        }
    } catch {
        // 파싱 실패 — 위험 가능성, fallback
    }
    return fallback;
}

/**
 * 외부 이미지 URL 검증. 잘못된 경우 빈 문자열.
 */
export function safeImageUrl(raw: string | null | undefined): string {
    if (!raw) return "";
    const s = raw.trim();
    if (!s) return "";
    if (s.startsWith("/") && !s.startsWith("//")) {
        return s;
    }
    try {
        const u = new URL(s);
        if (ALLOWED_PROTOCOLS.has(u.protocol)) {
            return u.toString();
        }
    } catch {
        // ignore
    }
    return "";
}
