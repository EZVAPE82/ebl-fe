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
            // 운영 추가 자리 (도급인 가입 후 도메인 채울 것):
            // { protocol: "https", hostname: "elfbarlounge-assets.s3.ap-northeast-2.amazonaws.com" },
            // { protocol: "https", hostname: "cdn.elfbarlounge.co.kr" },
        ],
    },

    poweredByHeader: false,
};

export default nextConfig;
