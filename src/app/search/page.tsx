import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import type { Page, ProductSummary } from "@/types/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try { return await api<T>(path, { cache: "no-store" }); } catch { return fallback; }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
    const sp = await searchParams;
    const q = (sp.q ?? "").trim();
    const page = parseInt(sp.page ?? "0", 10);

    const empty: Page<ProductSummary> = {
        content: [], totalElements: 0, totalPages: 0, number: 0, size: 20,
        first: true, last: true, empty: true,
    };

    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", "20");
    if (q) qs.set("keyword", q);

    const list = q
        ? await safeFetch<Page<ProductSummary>>(`/api/v1/public/products?${qs.toString()}`, empty)
        : empty;

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--color-fg)] tracking-tight">SEARCH</h1>

            {/* 검색 폼 (GET) */}
            <form method="GET" action="/search" className="mb-8 flex gap-2">
                <input
                    name="q"
                    type="search"
                    defaultValue={q}
                    placeholder="상품명·브랜드·키워드 검색"
                    className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)]"
                />
                <button
                    type="submit"
                    className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                >
                    검색
                </button>
            </form>

            {/* 결과 */}
            {!q ? (
                <div className="rounded-[var(--radius-lg)] px-4 py-16 text-center text-sm text-[var(--color-fg-subtle)]">
                    검색어를 입력하시면 상품을 찾아드립니다.
                </div>
            ) : list.content.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] px-4 py-16 text-center">
                    <p className="text-sm text-[var(--color-fg)] mb-2">
                        &lsquo;<span className="font-semibold">{q}</span>&rsquo; 검색 결과가 없습니다.
                    </p>
                    <p className="text-xs text-[var(--color-fg-muted)]">철자를 확인하거나 다른 키워드로 시도해주세요.</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-[var(--color-fg-muted)] mb-4">
                        &lsquo;<span className="text-[var(--color-fg)] font-semibold">{q}</span>&rsquo;
                        검색 결과 <span className="text-[var(--color-accent)] font-semibold">{list.totalElements}</span>건
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {list.content.map(p => <ProductCard key={p.id} p={p} />)}
                    </div>

                    {/* 페이지네이션 (단순) */}
                    {list.totalPages > 1 && (
                        <div className="mt-10 flex justify-center gap-1.5 text-sm">
                            {page > 0 && <PageLink q={q} target={page - 1} label="‹" />}
                            {Array.from({ length: list.totalPages }, (_, i) => i)
                                .filter(i => Math.abs(i - page) <= 2 || i === 0 || i === list.totalPages - 1)
                                .map(i => <PageLink key={i} q={q} target={i} label={String(i + 1)} active={i === page} />)
                            }
                            {page < list.totalPages - 1 && <PageLink q={q} target={page + 1} label="›" />}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function PageLink({ q, target, label, active }: { q: string; target: number; label: string; active?: boolean }) {
    const sp = new URLSearchParams();
    sp.set("q", q);
    sp.set("page", String(target));
    return (
        <Link
            href={`/search?${sp.toString()}`}
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
