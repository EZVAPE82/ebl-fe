import { api, ApiError } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductQna } from "@/components/ProductQna";
import { DetailTabs } from "@/components/DetailTabs";
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
        if (e instanceof ApiError && e.status === 404) notFound();
        throw e;
    }

    const related = await safeFetch<Page<ProductSummary>>(
        `/api/v1/public/products/${id}/related?size=8`,
        { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8, first: true, last: true, empty: true }
    );

    type PromoBadge = { id: number; name: string; buyQuantity: number; getQuantity: number; label: string };
    const promos = await safeFetch<PromoBadge[]>(
        `/api/v1/public/products/${id}/promotions`,
        []
    );

    const isSoldOut = product.status === "SOLD_OUT";

    // 갤러리: thumbnail + product images (없으면 thumbnail 만)
    const gallery = product.thumbnailUrl
        ? [product.thumbnailUrl, ...product.images.filter(i => i.type === "THUMBNAIL").map(i => i.url)]
        : product.images.map(i => i.url);

    return (
        <div className="pb-28 md:pb-12">
            {/* ===== 상단: 갤러리 + 정보 ===== */}
            <div className="mx-auto max-w-screen-xl px-4 py-6 grid gap-8 md:grid-cols-2">
                {/* 갤러리 (client island) */}
                <ProductGallery images={gallery} alt={product.name} />

                {/* 정보 */}
                <div className="space-y-5">
                    <div>
                        {/* 프로모션 뱃지 (있을 때만) */}
                        {promos.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
                                {promos.map(p => (
                                    <span
                                        key={p.id}
                                        className="inline-flex items-center rounded-[var(--radius-sm)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] px-2.5 py-1 text-xs font-bold"
                                        title={p.name}
                                    >
                                        🎁 {p.label} 진행 중
                                    </span>
                                ))}
                            </div>
                        )}
                        <h1 className="text-xl md:text-2xl font-semibold leading-tight text-[var(--color-fg)]">{product.name}</h1>
                        <div className="mt-3 flex items-end gap-2">
                            <span className="text-2xl md:text-3xl font-bold text-[var(--color-fg)]">{formatPrice(product.price)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="text-[var(--color-warning)]">★ {product.ratingAvg?.toFixed?.(1) ?? "0.0"}</span>
                            <span className="text-[var(--color-fg-subtle)]">·</span>
                            <span className="text-[var(--color-fg-muted)]">후기 {product.reviewCount}</span>
                        </div>
                    </div>

                    {/* 상품 메타 (배송·혜택 등 정적 placeholder) */}
                    <dl className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 text-xs grid grid-cols-[80px_1fr] gap-y-2">
                        <dt className="text-[var(--color-fg-muted)]">배송</dt>
                        <dd className="text-[var(--color-fg)]">평일 13시 이전 주문 시 당일 발송 · 3만원 이상 무료배송</dd>
                        <dt className="text-[var(--color-fg-muted)]">적립금</dt>
                        <dd className="text-[var(--color-fg)]">{Math.floor(product.price * 0.01).toLocaleString()}원 (구매 1% · 리뷰 추가 적립)</dd>
                        <dt className="text-[var(--color-fg-muted)]">인증</dt>
                        <dd className="text-[var(--color-fg)]">만 19세 이상 성인 인증 후 결제 가능</dd>
                    </dl>

                    {/* 옵션 */}
                    {product.options.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">옵션 선택</div>
                            <ul className="space-y-1.5 text-sm">
                                {product.options.map(o => {
                                    const out = o.stock <= 0;
                                    return (
                                        <li
                                            key={o.id}
                                            className={`flex items-center justify-between rounded-[var(--radius-sm)] border px-3 py-2.5 ${
                                                out
                                                    ? "border-[var(--color-border)] bg-[var(--color-bg-subtle)] opacity-60"
                                                    : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] cursor-pointer"
                                            }`}
                                        >
                                            <span className="text-[var(--color-fg)]">
                                                <span className="text-[var(--color-fg-muted)]">{o.optionGroup}</span>
                                                <span className="mx-2">·</span>
                                                <span>{o.optionValue}</span>
                                            </span>
                                            <span className="text-[var(--color-fg-muted)] text-xs">
                                                {o.priceDelta !== 0 && `+${formatPrice(o.priceDelta)} `}
                                                {out ? "품절" : `재고 ${o.stock}`}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* 호환성 정보 */}
                    {product.compatibilityInfo && (
                        <div>
                            <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-1">호환 정보</div>
                            <p className="text-sm text-[var(--color-fg)] whitespace-pre-line">{product.compatibilityInfo}</p>
                        </div>
                    )}

                    {/* PC 액션 */}
                    <div className="hidden md:flex gap-2 pt-2">
                        <Button variant="secondary" size="lg" fullWidth>장바구니</Button>
                        <Button size="lg" fullWidth disabled={isSoldOut}>
                            {isSoldOut ? "품절" : "바로구매"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ===== 탭 ===== */}
            <DetailTabs />

            {/* ===== 상세 설명 (큰 라이프스타일 이미지 + 텍스트) ===== */}
            <section id="info" className="mx-auto max-w-screen-xl px-4 mt-10">
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-[var(--color-fg)]">상세 정보</h2>
                <div className="rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-bg-subtle)] aspect-[16/9] md:aspect-[16/7]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`https://placehold.co/1200x520/1e1e1e/c9a87a?text=${encodeURIComponent(product.name)}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                {product.description && (
                    <p className="mt-4 text-sm text-[var(--color-fg)] whitespace-pre-line leading-relaxed">{product.description}</p>
                )}
            </section>

            {/* ===== 상품정보고시 ===== */}
            <section className="mx-auto max-w-screen-xl px-4 mt-10">
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-[var(--color-fg)]">상품정보고시</h2>
                <dl className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden divide-y divide-[var(--color-border)] text-sm">
                    {[
                        ["품명 및 모델명", product.name],
                        ["제조국", "중국"],
                        ["제조사", "Heaven Gifts (ELFBAR)"],
                        ["인증번호", "도급인 인증서 수령 후 게재 예정"],
                        ["니코틴 함량", "옵션 참조 (0mg / 3mg)"],
                        ["사용 연령", "만 19세 이상 (성인 인증 필수)"],
                        ["A/S 책임자", "엘프바 라운지 고객센터 02-1234-5678"],
                    ].map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] gap-3 px-4 py-3">
                            <dt className="text-[var(--color-fg-muted)]">{k}</dt>
                            <dd className="text-[var(--color-fg)]">{v}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* ===== 리뷰 통계 ===== */}
            <section id="reviews" className="mx-auto max-w-screen-xl px-4 mt-10">
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-[var(--color-fg)]">상품 리뷰</h2>
                <ReviewStats avg={product.ratingAvg ?? 0} count={product.reviewCount ?? 0} />
                <div className="mt-6">
                    <ProductReviews productId={product.id} />
                </div>
            </section>

            {/* ===== 배송·교환·반품 안내 ===== */}
            <section id="ship" className="mx-auto max-w-screen-xl px-4 mt-10">
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-[var(--color-fg)]">배송·교환·반품 안내</h2>
                <dl className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden text-sm">
                    {[
                        ["배송 방법",      "택배 (CJ대한통운 / 우체국 택배)"],
                        ["배송 지역",      "전국 (제주·도서산간 추가 배송비 3,000원)"],
                        ["배송 기간",      "평일 13시 이전 주문 시 당일 출고, 1~3일 내 수령"],
                        ["배송비",         "3만원 이상 무료, 미만 시 3,000원"],
                        ["교환·반품 신청", "수령 후 7일 이내 마이페이지에서 신청"],
                        ["교환·반품 불가", "사용 흔적 있는 상품, 액상 개봉품, 단순 변심 시 반송 택배비 차감"],
                        ["환불 처리",      "반품 도착·검수 완료 후 영업일 기준 3~5일 내 환급"],
                    ].map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[120px_1fr] md:grid-cols-[180px_1fr] gap-3 px-4 py-3">
                            <dt className="text-[var(--color-fg-muted)]">{k}</dt>
                            <dd className="text-[var(--color-fg)]">{v}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* ===== Q&A ===== */}
            <section id="qna" className="mx-auto max-w-screen-xl px-4 mt-10">
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-[var(--color-fg)]">Q&amp;A</h2>
                <ProductQna productId={product.id} />
            </section>

            {/* ===== 연관 상품 ===== */}
            {related.content.length > 0 && (
                <section className="mx-auto max-w-screen-xl px-4 mt-10">
                    <h2 className="text-lg md:text-xl font-semibold mb-3 text-[var(--color-fg)]">관련 상품</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {related.content.map(p => <ProductCard key={p.id} p={p} />)}
                    </div>
                </section>
            )}

            {/* ===== 모바일 하단 고정 CTA ===== */}
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

/* ============================================================
 * ReviewStats — 평균 평점 카드 + 별점 분포 placeholder
 * ============================================================ */
function ReviewStats({ avg, count }: { avg: number; count: number }) {
    // 별점 분포는 시드에 없어서 placeholder
    const distribution = [70, 18, 8, 3, 1]; // 5★ ~ 1★ 퍼센트
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center">
                <div className="text-xs text-[var(--color-fg-muted)] mb-1">나의 만족도는?</div>
                <div className="text-[var(--color-warning)] text-2xl">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}</div>
                <div className="mt-2 text-xl font-bold text-[var(--color-fg)]">{avg.toFixed(1)} / 5.0</div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center">
                <div className="text-xs text-[var(--color-fg-muted)] mb-1">총 리뷰 수</div>
                <div className="mt-2 text-2xl font-bold text-[var(--color-accent)]">{count.toLocaleString()}개</div>
                <div className="mt-2 text-[11px] text-[var(--color-fg-subtle)]">최근 30일 사이 작성된 리뷰 포함</div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="text-xs text-[var(--color-fg-muted)] mb-2 text-center">별점 분포</div>
                <ul className="space-y-1.5">
                    {distribution.map((pct, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-[var(--color-fg-muted)] w-6">{5 - i}★</span>
                            <span className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                                <span className="block h-full bg-[var(--color-warning)]" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="text-[var(--color-fg-muted)] w-8 text-right">{pct}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try { return await api<T>(path, { cache: "no-store" }); } catch { return fallback; }
}
