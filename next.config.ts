import type { NextConfig } from "next";

/**
 * 외부 이미지 도메인 화이트리스트 (운영 시 도급인 자산 도메인 추가):
 *  - placehold.co (개발용 placeholder, 운영 전 제거 권장)
 *  - 운영 추가 자리: S3·CloudFront 도메인
 *
 * 참고: `<img>` 직접 사용 부분은 `src/lib/url.ts` `safeImageUrl()` 로 프로토콜 검증.
 *      `next/image`로 마이그레이션 시 본 화이트리스트가 자동 적용.
 */
const nextConfig: NextConfig = {
    output: "standalone",

    images: {
        remotePatterns: [
            { protocol: "https", hostname: "placehold.co" },
            // 디자이너 자산 도착 전 임시 라이프스타일 이미지 (Unsplash CDN)
            { protocol: "https", hostname: "images.unsplash.com" },
            // 운영 추가 자리 (도급인 가입 후 도메인 채울 것):
            // { protocol: "https", hostname: "elfbarlounge-assets.s3.ap-northeast-2.amazonaws.com" },
            // { protocol: "https", hostname: "cdn.elfbarlounge.co.kr" },
        ],
    },

    poweredByHeader: false,

    // 보안 헤더 — 프론트(elfbarlounge.com) 전 응답에 적용.
    // CSP: script/style/img/connect 는 Next 하이드레이션·외부 분석/채널톡 깨짐 방지 위해 https 허용(추후 nonce 강화).
    //      frame-ancestors/object-src/base-uri/form-action 은 엄격(클릭재킹·base 하이재킹·폼 탈취 차단).
    async headers() {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
            "style-src 'self' 'unsafe-inline' https:",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data: https:",
            "connect-src 'self' https: wss:",
            "frame-src 'self' https:",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join("; ");
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "Content-Security-Policy", value: csp },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
        ];
    },
};

export default nextConfig;
