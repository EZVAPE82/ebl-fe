import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Docker 이미지 최적화 — standalone 모드는 .next/standalone 에 최소 의존성만 포함
    output: "standalone",

    // 이미지 외부 도메인 (운영 시 도급인 자산 CDN·S3 추가)
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "placehold.co" },
            { protocol: "https", hostname: "example.com" },
        ],
    },

    // 보안: X-Powered-By 헤더 제거
    poweredByHeader: false,
};

export default nextConfig;
