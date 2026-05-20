import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import type { Category, Page, ProductSummary, SortKey } from "@/types/api";
import Link from "next/link";

type Search = Promise<{
    sort?: SortKey;
    page?: string;
    brandId?: string;
    minPrice?: string;
    maxPrice?: string;
}>;
type Params = Promise<{ slug: string }>;

const SORTS: { key: SortKey; label: string }[] = [
    { key: "popular", label: "인기순" },
    { key: "newest", label: "신상품" },
    { key: "price_asc", label: "낮은가격" },
    { key: "price_desc", label: "높은가격" },
    { key: "rating", label: "평점순" },
    { key: "reviews", label: "후기많은순" },
];

export default async function CategoryPage({
    params, searchParams,
}: { params: Params; searchParams: Search }) {
    const { slug } = await params;
    const sp = await searchParams;
    const sort = (sp.sort ?? "popular") as SortKey;
    const page = parseInt(sp.page ?? "0", 10);

    const categories = await safeFetch<Category[]>("/api/v1/public/categories", []);
    const cat = categories.find(c => c.slug === slug);

    const qs = new URLSearchParams();
    qs.set("sort", sort);
    qs.set("page", String(page));
    qs.set("size", "20");
    if (cat) qs.set("categoryId", String(cat.id));
    if (sp.brandId) qs.set("brandId", sp.brandId);
    if (sp.minPrice) qs.set("minPrice", sp.minPrice);
    if (sp.maxPrice) qs.set("maxPrice", sp.maxPrice);

    const list = await safeFetch<Page<ProductSummary>>(
        `/api/v1/public/products?${qs.toString()}`,
        { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, empty: true }
    );

    const pages = compactPagination(page, list.totalPages);

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-8">
            {/* 헤더: 타이틀 큰 글씨 (시안 "아이템리스트" 톤) */}
            <header className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)]">
                    {cat?.name ?? slug.toUpperCase()}
                </h1>
            </header>

            {/* 좌측 카운트 + 우측 정렬 selector */}
            <div className="flex items-center justify-between mb-5 text-xs">
                <p className="text-[var(--color-fg-muted)]">
                    총 <span className="text-[var(--color-fg)] font-medium">{list.totalElements}</span>개의 상품
                </p>
                <div className="flex items-center gap-1">
                    {SORTS.map((s, i) => {
                        const params = new URLSearchParams(qs);
                        params.set("sort", s.key);
                        params.delete("page");
                        const active = sort === s.key;
                        return (
                            <span key={s.key} className="flex items-center gap-1">
                                {i > 0 && <span className="text-[var(--color-border-strong)]">·</span>}
                                <Link
                                    href={`/c/${slug}?${params.toString()}`}
                                    className={`px-1.5 transition ${
                                        active
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

            {/* 목록 */}
            {list.content.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-4 py-16 text-center text-sm text-[var(--color-fg-subtle)]">
                    표시할 상품이 없습니다.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {list.content.map(p => <ProductCard key={p.id} p={p} />)}
                </div>
            )}

            {/* 페이지네이션 (압축) */}
            {list.totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center gap-1.5 text-sm">
                    {page > 0 && (
                        <PageLink slug={slug} qs={qs} target={page - 1} label="‹" />
                    )}
                    {pages.map((p, idx) =>
                        p === "..." ? (
                            <span key={`gap-${idx}`} className="px-2 text-[var(--color-fg-subtle)]">…</span>
                        ) : (
                            <PageLink key={p} slug={slug} qs={qs} target={p} label={String(p + 1)} active={p === page} />
                        )
                    )}
                    {page < list.totalPages - 1 && (
                        <PageLink slug={slug} qs={qs} target={page + 1} label="›" />
                    )}
                </div>
            )}
        </div>
    );
}

function PageLink({ slug, qs, target, label, active }: { slug: string; qs: URLSearchParams; target: number; label: string; active?: boolean }) {
    const p = new URLSearchParams(qs);
    p.set("page", String(target));
    return (
        <Link
            href={`/c/${slug}?${p.toString()}`}
            className={`min-w-8 h-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] border text-sm transition ${
                active
                    ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)] border-[var(--color-brand)]"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}

// 1 2 3 4 5 ... 30 형태로 압축. 현재 페이지 기준 ±2 보여줌.
function compactPagination(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const out: (number | "...")[] = [];
    out.push(0);
    if (current > 3) out.push("...");
    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);
    for (let i = start; i <= end; i++) out.push(i);
    if (current < total - 4) out.push("...");
    out.push(total - 1);
    return out;
}

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try { return await api<T>(path, { cache: "no-store" }); } catch { return fallback; }
}
