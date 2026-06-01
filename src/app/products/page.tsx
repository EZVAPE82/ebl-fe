import Link from "next/link";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import type { Page, ProductSummary, SortKey } from "@/types/api";

export const metadata = { title: "전체상품" };

/**
 * 전체상품 페이지 — 시리즈 9 탭 + 페이지네이션.
 * series query param 으로 백엔드 filter (slug LIKE '<series>-flavor-%').
 */

type Search = Promise<{
    series?: string;
    sort?: SortKey;
    page?: string;
}>;

const SORTS: { key: SortKey; label: string }[] = [
    { key: "popular",    label: "인기순" },
    { key: "newest",     label: "최신순" },
    { key: "price_asc",  label: "가격 낮은순" },
    { key: "price_desc", label: "가격 높은순" },
    { key: "rating",     label: "평점순" },
    { key: "reviews",    label: "후기많은순" },
];

// "all" 은 series 필터 없이 전체 상품 조회.
// 9 시리즈는 slug prefix 와 한글 표시명 매핑.
const SERIES: { key: string; label: string }[] = [
    { key: "all",          label: "전체보기" },
    { key: "iceking-pro",  label: "아이스킹 프로" },
    { key: "duke",         label: "듀크" },
    { key: "iceking",      label: "아이스킹" },
    { key: "yangjuyeon",   label: "양주연" },
    { key: "joinwon-kit",  label: "조인원 킷" },
    { key: "joinwon-pot",  label: "조인원 팟" },
    { key: "crosamba",     label: "크로싱바" },
    { key: "puffbar",      label: "퍼프바" },
    { key: "frozen",       label: "프로즌" },
];
const DEFAULT_SERIES = "iceking-pro";

const PAGE_SIZE = 20;

export default async function ProductsPage({ searchParams }: { searchParams: Search }) {
    const sp = await searchParams;
    const sort = (sp.sort ?? "popular") as SortKey;
    const page = Math.max(0, parseInt(sp.page ?? "0", 10) || 0);
    const active = SERIES.find(s => s.key === sp.series)?.key ?? DEFAULT_SERIES;
    const activeMeta = SERIES.find(s => s.key === active)!;

    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", String(PAGE_SIZE));
    qs.set("sort", sort);
    // "all" 은 series 필터 미적용
    if (active !== "all") qs.set("series", active);

    const list = await safeFetch<Page<ProductSummary>>(
        `/api/v1/public/products?${qs.toString()}`,
        { content: [], totalElements: 0, totalPages: 0, number: 0, size: PAGE_SIZE, first: true, last: true, empty: true }
    );

    const pageNumbers = compactPagination(page, list.totalPages);

    function urlForPage(p: number) {
        const u = new URLSearchParams();
        u.set("series", active);
        u.set("sort", sort);
        u.set("page", String(p));
        return `/products?${u.toString()}`;
    }
    function urlForSort(s: SortKey) {
        const u = new URLSearchParams();
        u.set("series", active);
        u.set("sort", s);
        return `/products?${u.toString()}`;
    }
    function urlForSeries(key: string) {
        const u = new URLSearchParams();
        u.set("series", key);
        u.set("sort", sort);
        return `/products?${u.toString()}`;
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                {activeMeta.label}
            </h1>

            {/* 시리즈 탭 (9개) */}
            <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                {SERIES.map(s => (
                    <Link
                        key={s.key}
                        href={urlForSeries(s.key)}
                        className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium transition ${
                            active === s.key
                                ? "bg-[var(--color-accent)] text-white"
                                : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                        }`}
                    >
                        {s.label}
                    </Link>
                ))}
            </div>

            {/* 카운트 + 정렬 */}
            <div className="flex items-center justify-between mb-4 md:mb-6 pb-3 border-b border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-fg-muted)]">
                    총 <span className="text-[var(--color-fg)] font-bold">{list.totalElements}</span>개의 상품
                </p>
                <div className="flex items-center gap-1 text-xs">
                    {SORTS.map((s, i) => {
                        const isActive = sort === s.key;
                        return (
                            <span key={s.key} className="flex items-center gap-1">
                                {i > 0 && <span className="text-[var(--color-border-strong)]">·</span>}
                                <Link
                                    href={urlForSort(s.key)}
                                    className={`px-1.5 transition ${
                                        isActive
                                            ? "text-[var(--color-fg)] font-semibold"
                                            : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                                    }`}
                                >
                                    {s.label}
                                </Link>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* 4-cols 그리드 */}
            {list.content.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-16">상품이 없습니다.</p>
            ) : (
                <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {list.content.map(p => (
                        <li key={p.id}>
                            <ProductCard p={p} />
                        </li>
                    ))}
                </ul>
            )}

            {/* 페이지네이션 */}
            {list.totalPages > 1 && (
                <nav className="mt-10 md:mt-14 flex justify-center items-center gap-1.5 text-sm" aria-label="페이지네이션">
                    {page > 0 && (
                        <Link
                            href={urlForPage(page - 1)}
                            aria-label="이전 페이지"
                            className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] rounded-md"
                        >
                            ‹
                        </Link>
                    )}
                    {pageNumbers.map((n, i) =>
                        n === "ellipsis" ? (
                            <span key={`e${i}`} className="px-2 text-[var(--color-fg-subtle)]">…</span>
                        ) : n === page ? (
                            <span
                                key={n}
                                aria-current="page"
                                className="min-w-9 h-9 inline-flex items-center justify-center bg-[var(--color-accent)] text-white font-medium rounded-md"
                            >
                                {n + 1}
                            </span>
                        ) : (
                            <Link
                                key={n}
                                href={urlForPage(n)}
                                className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] rounded-md"
                            >
                                {n + 1}
                            </Link>
                        )
                    )}
                    {page < list.totalPages - 1 && (
                        <Link
                            href={urlForPage(page + 1)}
                            aria-label="다음 페이지"
                            className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] rounded-md"
                        >
                            ›
                        </Link>
                    )}
                </nav>
            )}
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

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try {
        return await api<T>(path, { cache: "no-store" });
    } catch {
        return fallback;
    }
}
