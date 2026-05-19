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

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6">
            <header className="mb-4">
                <h1 className="text-xl md:text-2xl font-bold">
                    {cat?.name ?? slug.toUpperCase()}
                </h1>
                <p className="text-xs text-zinc-500 mt-1">총 {list.totalElements}개</p>
            </header>

            {/* 정렬 */}
            <div className="flex flex-wrap gap-1 mb-4 text-xs">
                {SORTS.map(s => {
                    const params = new URLSearchParams(qs);
                    params.set("sort", s.key);
                    params.delete("page");
                    return (
                        <Link
                            key={s.key}
                            href={`/c/${slug}?${params.toString()}`}
                            className={`px-3 py-1.5 rounded-full border ${
                                sort === s.key
                                    ? "bg-zinc-900 text-white border-zinc-900"
                                    : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500"
                            }`}
                        >
                            {s.label}
                        </Link>
                    );
                })}
            </div>

            {/* 목록 */}
            {list.content.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-300 px-4 py-16 text-center text-sm text-zinc-500">
                    표시할 상품이 없습니다.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {list.content.map(p => <ProductCard key={p.id} p={p} />)}
                </div>
            )}

            {/* 페이지네이션 (간단) */}
            {list.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2 text-sm">
                    {Array.from({ length: list.totalPages }, (_, i) => i).map(i => {
                        const p = new URLSearchParams(qs);
                        p.set("page", String(i));
                        return (
                            <Link
                                key={i}
                                href={`/c/${slug}?${p.toString()}`}
                                className={`px-3 py-1 rounded border ${
                                    i === page ? "bg-zinc-900 text-white border-zinc-900"
                                              : "border-zinc-300 hover:border-zinc-500"
                                }`}
                            >
                                {i + 1}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try { return await api<T>(path, { cache: "no-store" }); } catch { return fallback; }
}
