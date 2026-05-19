import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elfbarlounge.co.kr";

export default function robots(): MetadataRoute.Robots {
    // 운영 도메인이면 허용, 그 외(개발·스테이징)는 전부 차단
    const isProd = SITE_URL.includes("elfbarlounge.co.kr");

    if (!isProd) {
        return {
            rules: [{ userAgent: "*", disallow: "/" }],
        };
    }

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/api/",
                    "/login",
                    "/signup",
                    "/mypage",
                    "/cart",
                    "/checkout",
                    "/orders/",
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
