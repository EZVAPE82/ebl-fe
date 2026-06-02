import Link from "next/link";
import { api } from "@/lib/api";
import { ReviewerGrid } from "@/components/ReviewerGrid";

export const metadata = { title: "REVIEWER" };

type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number };
export type ReviewView = {
    id: number;
    productId: number;
    memberId: number;
    rating: number;
    content: string | null;
    hasPhoto: boolean;
    photoUrls: string[];
    pointRewarded: boolean;
    createdAt: string;
};

type Search = Promise<{ page?: string; size?: string }>;

const PAGE_SIZE = 16;

async function fetchBest(page: number, size: number): Promise<Page<ReviewView>> {
    try {
        return await api<Page<ReviewView>>(`/api/v1/public/reviews/best?page=${page}&size=${size}`, { cache: "no-store" });
    } catch {
        return { content: [], totalElements: 0, totalPages: 0, number: 0, size };
    }
}

/**
 * REVIEWER 페이지 — 시안 252:10915 매칭.
 * 실제 DB 리뷰만 표시 (V23/V30 시드 — 멤버 5명 × 9 + 6 = 75 리뷰).
 * 페이지네이션은 동적 (Link 기반 server 컴포넌트).
 */
export default async function BestReviewerPage({ searchParams }: { searchParams: Search }) {
    const sp = await searchParams;
    const page = Math.max(0, parseInt(sp.page ?? "0", 10) || 0);
    const list = await fetchBest(page, PAGE_SIZE);
    const pageNumbers = compactPagination(page, list.totalPages);

    function pageHref(p: number) {
        return `/reviews/best?page=${p}`;
    }

    return (
        <div className="bg-[var(--color-bg)] min-h-screen">
            <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
                <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                    REVIEWER
                </h1>

                {list.content.length === 0 ? (
                    <p className="text-sm text-[var(--color-fg-subtle)] text-center py-20">
                        아직 등록된 후기가 없습니다.
                    </p>
                ) : (
                    <ReviewerGrid reviews={list.content} />
                )}

                {/* 페이지네이션 — Link 기반 동적 */}
                {list.totalPages > 1 && (
                    <nav className="mt-10 md:mt-14 flex justify-center items-center gap-1.5 text-sm" aria-label="페이지네이션">
                        {page > 0 && (
                            <Link href={pageHref(page - 1)} className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] rounded-md">‹</Link>
                        )}
                        {pageNumbers.map((n, i) =>
                            n === "ellipsis" ? (
                                <span key={`e${i}`} className="px-2 text-[var(--color-fg-subtle)]">…</span>
                            ) : n === page ? (
                                <span key={n} aria-current="page" className="min-w-9 h-9 inline-flex items-center justify-center bg-[var(--color-accent)] text-white font-medium rounded-md">
                                    {n + 1}
                                </span>
                            ) : (
                                <Link key={n} href={pageHref(n)} className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] rounded-md">
                                    {n + 1}
                                </Link>
                            )
                        )}
                        {page < list.totalPages - 1 && (
                            <Link href={pageHref(page + 1)} className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] rounded-md">›</Link>
                        )}
                    </nav>
                )}
            </div>
        </div>
    );
}

function compactPagination(current: number, total: number): (number | "ellipsis")[] {
    if (total <= 1) return [];
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const out: (number | "ellipsis")[] = [];
    const start = Math.max(0, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 0) {
        out.push(0);
        if (start > 1) out.push("ellipsis");
    }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) {
        if (end < total - 2) out.push("ellipsis");
        out.push(total - 1);
    }
    return out;
}
