import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elfbarlounge.co.kr";

type ProductSummary = { id: number; updatedAt?: string };
type Page<T> = { content: T[]; totalPages: number; number: number };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticEntries: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, lastModified: now, priority: 1.0, changeFrequency: "daily" },
        { url: `${SITE_URL}/c/best`, lastModified: now, priority: 0.8, changeFrequency: "daily" },
        { url: `${SITE_URL}/c/new`, lastModified: now, priority: 0.8, changeFrequency: "daily" },
        { url: `${SITE_URL}/c/disposable`, lastModified: now, priority: 0.7, changeFrequency: "daily" },
        { url: `${SITE_URL}/c/liquid`, lastModified: now, priority: 0.7, changeFrequency: "daily" },
        { url: `${SITE_URL}/events`, lastModified: now, priority: 0.6, changeFrequency: "weekly" },
        { url: `${SITE_URL}/notices`, lastModified: now, priority: 0.5, changeFrequency: "weekly" },
        { url: `${SITE_URL}/faq`, lastModified: now, priority: 0.5, changeFrequency: "monthly" },
    ];

    // 상품 페이지 — 페이징 조회 (실패 시 정적 엔트리만)
    const productEntries: MetadataRoute.Sitemap = [];
    try {
        let page = 0;
        for (let i = 0; i < 5; i++) { // 최대 5페이지(최대 ~300건) — 운영 시 조정
            const res = await api<Page<ProductSummary>>(`/api/v1/public/products?size=60&page=${page}`, { cache: "no-store" });
            res.content.forEach(p => {
                productEntries.push({
                    url: `${SITE_URL}/p/${p.id}`,
                    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
                    priority: 0.6,
                    changeFrequency: "weekly",
                });
            });
            if (res.number + 1 >= res.totalPages) break;
            page++;
        }
    } catch {
        // 백엔드 미응답 시 정적만
    }

    return [...staticEntries, ...productEntries];
}
