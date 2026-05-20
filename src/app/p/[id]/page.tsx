import { api, ApiError } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ProductReviews } from "@/components/ProductReviews";
import { Button } from "@/components/ui";
import type { Page, ProductDetail, ProductSummary } from "@/types/api";
import { formatPrice } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";

type Params = Promise<{ id: string }>;

export default async function ProductDetailPage({ params }: { params: Params }) {
    const { id } = await params;

    let product: ProductDetail;
    try {
        product = await api<ProductDetail>(`/api/v1/public/products/${id}`, { cache: "no-store" });
    } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
            notFound();
        }
        throw e;
    }

    const related = await safeFetch<Page<ProductSummary>>(
        `/api/v1/public/products/${id}/related?size=8`,
        { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8, first: true, last: true, empty: true }
    );

    const isSoldOut = product.status === "SOLD_OUT";

    return (
        <div className="pb-28 md:pb-12">
            <div className="mx-auto max-w-screen-xl px-4 py-6 grid gap-8 md:grid-cols-2">
                {/* 이미지 */}
                <div className="aspect-square bg-[var(--color-bg-subtle)] rounded-[var(--radius-lg)] overflow-hidden">
                    {product.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-fg-subtle)] text-xs">no image</div>
                    )}
                </div>

                {/* 정보 */}
                <div className="space-y-5">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold leading-tight text-[var(--color-fg)]">{product.name}</h1>
                        <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                            <span>★ {product.ratingAvg?.toFixed?.(1) ?? "0.0"}</span>
                            <span>·</span>
                            <span>후기 {product.reviewCount}</span>
                        </div>
                    </div>

                    <div className="text-2xl font-bold text-[var(--color-fg)]">{formatPrice(product.price)}</div>

                    {/* 옵션 */}
                    {product.options.length > 0 && (
                        <div>
                            <div className="text-xs text-[var(--color-fg-muted)] mb-1.5">옵션</div>
                            <ul className="space-y-1.5 text-sm">
                                {product.options.map(o => (
                                    <li key={o.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2.5">
                                        <span className="text-[var(--color-fg)]">
                                            <span className="text-[var(--color-fg-muted)]">{o.optionGroup}</span>
                                            <span className="mx-2">·</span>
                                            <span>{o.optionValue}</span>
                                        </span>
                                        <span className="text-[var(--color-fg-muted)] text-xs">
                                            {o.priceDelta !== 0 && `+${formatPrice(o.priceDelta)} `}
                                            {o.stock <= 0 ? "품절" : `재고 ${o.stock}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 호환성 정보 */}
                    {product.compatibilityInfo && (
                        <div>
                            <div className="text-xs text-[var(--color-fg-muted)] mb-1">호환 정보</div>
                            <p className="text-sm text-[var(--color-fg)] whitespace-pre-line">{product.compatibilityInfo}</p>
                        </div>
                    )}

                    {/* PC 전용 액션 */}
                    <div className="hidden md:flex gap-2 pt-2">
                        <Button variant="secondary" size="lg" fullWidth>
                            장바구니
                        </Button>
                        <Button size="lg" fullWidth disabled={isSoldOut}>
                            {isSoldOut ? "품절" : "바로구매"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 상세 설명 */}
            {product.description && (
                <section className="mx-auto max-w-screen-xl px-4 mt-6">
                    <h2 className="text-lg font-semibold mb-3 text-[var(--color-fg)]">상품 상세</h2>
                    <p className="text-sm text-[var(--color-fg)] whitespace-pre-line">{product.description}</p>
                </section>
            )}

            {/* 리뷰 */}
            <section className="mx-auto max-w-screen-xl px-4 mt-10">
                <ProductReviews productId={product.id} />
            </section>

            {/* 연관 상품 */}
            {related.content.length > 0 && (
                <section className="mx-auto max-w-screen-xl px-4 mt-10">
                    <h2 className="text-lg font-semibold mb-3 text-[var(--color-fg)]">관련 상품</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {related.content.map(p => <ProductCard key={p.id} p={p} />)}
                    </div>
                </section>
            )}

            {/* 모바일 하단 고정 CTA */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
                <div className="flex gap-2 px-4 py-3">
                    <Link
                        href="/cart"
                        className="flex-1 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] py-3.5 text-sm font-medium text-[var(--color-fg)]"
                    >
                        장바구니
                    </Link>
                    <Button size="lg" fullWidth disabled={isSoldOut} className="flex-1">
                        {isSoldOut ? "품절" : "바로구매"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try { return await api<T>(path, { cache: "no-store" }); } catch { return fallback; }
}
