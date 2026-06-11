import { api, ApiError } from "@/lib/api";
import { RelatedCarousel } from "@/components/RelatedCarousel";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductQna } from "@/components/ProductQna";
import { DetailTabs } from "@/components/DetailTabs";
import { DetailExpand } from "@/components/DetailExpand";
import { ProductBuyBox } from "@/components/ProductBuyBox";
import type { Page, ProductDetail, ProductSummary } from "@/types/api";
import { displayPrice, formatPrice } from "@/lib/format";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

// 공통 상세 뷰 — id 또는 slug 로 렌더 (백엔드가 id-or-slug 지원). /p/{id} 와 /product/{series}/{n} 양쪽에서 사용.
export async function ProductDetailView({ idOrSlug }: { idOrSlug: string }) {
    let product: ProductDetail;
    try {
        product = await api<ProductDetail>(`/api/v1/public/products/${idOrSlug}`, { cache: "no-store" });
    } catch (e) {
        if (e instanceof ApiError && e.status === 404) notFound();
        throw e;
    }

    const related = await safeFetch<Page<ProductSummary>>(
        `/api/v1/public/products/${product.id}/related?size=8`,
        { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8, first: true, last: true, empty: true }
    );

    // 다른맛 드롭다운 — 같은 시리즈 형제 맛 (slug prefix '<series>-flavor-N')
    const seriesKey = ((product as { slug?: string }).slug ?? "").replace(/-flavor-\d+$/, "");
    // 시리즈 전용 통이미지 상세(Figma 시안) — 있으면 그 한 장 + 더알아보기, 없으면 기본 상세이미지.
    //   dark=true: 검정 배경 시안(DUKE) / 미지정: 밝은 배경(ICEKING PRO 등)
    const SERIES_DETAIL: Record<string, { src: string; dark?: boolean }> = {
        duke: { src: "/images/duke-detail-full.jpg", dark: true },
        "iceking-pro": { src: "/images/iceking-pro-detail-full.jpg" },
        crosamba: { src: "/images/crosamba-detail-full.jpg", dark: true },
        iceking: { src: "/images/iceking-detail-full.jpg" },
        puffbar: { src: "/images/puffbar-detail-full.jpg" },
        frozen: { src: "/images/frozen-detail-full.jpg", dark: true },
        "joinwon-pot": { src: "/images/joinwon-pot-detail-full.jpg" },
        "joinwon-kit": { src: "/images/joinwon-kit-detail-full.jpg" },
        yangjuyeon: { src: "/images/yangjuyeon-detail-full.jpg" }, // 에디션 시리즈(슬러그=yangjuyeon)
    };
    const seriesDetail = SERIES_DETAIL[seriesKey];
    const siblingsData = seriesKey
        ? await safeFetch<Page<ProductSummary>>(
            `/api/v1/public/products?series=${encodeURIComponent(seriesKey)}&size=100`,
            { content: [], totalElements: 0, totalPages: 0, number: 0, size: 100, first: true, last: true, empty: true }
        )
        : null;
    const siblings = (siblingsData?.content ?? [])
        .filter((s) => s.id !== product.id)
        .map((s) => ({ id: s.id, name: s.name, price: displayPrice(s) }));

    type PromoBadge = { id: number; name: string; buyQuantity: number; getQuantity: number; label: string };
    const promos = await safeFetch<PromoBadge[]>(
        `/api/v1/public/products/${product.id}/promotions`,
        []
    );

    // 구매 동작·품절 처리는 ProductBuyBox(클라이언트)가 담당

    // 갤러리: thumbnail + product images (없으면 thumbnail 만)
    const gallery = product.thumbnailUrl
        ? [product.thumbnailUrl, ...product.images.filter(i => i.type === "THUMBNAIL").map(i => i.url)]
        : product.images.map(i => i.url);

    const hasDiscount = product.onlinePrice != null && product.onlinePrice < product.price;
    const pct = hasDiscount ? Math.round(((product.price - (product.onlinePrice as number)) / product.price) * 100) : 0;

    return (
        <div className="pb-28 md:pb-12">
            {/* ===== 상단: 갤러리 + 정보 ===== */}
            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] py-6 md:py-10 grid gap-8 md:gap-[60px] md:grid-cols-2">
                {/* 갤러리 (client island) */}
                <ProductGallery images={gallery} alt={product.name} />

                {/* 정보 */}
                <div className="space-y-5">
                    <div>
                        {/* 프로모션 뱃지: 시안에 없어 상세에서 미노출 (프로모션 기능·장바구니 로직은 유지). 복구하려면 promos.map 뱃지 블록 복원 */}
                        <div className="flex items-start justify-between gap-3">
                            <h1 className="text-[28px] md:text-[32px] font-bold leading-[42px] text-[#000]">{product.name}</h1>
                            {/* 시안: 공유 아이콘 (우측 상단) */}
                            <button
                                type="button"
                                aria-label="공유"
                                className="shrink-0 mt-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                            </button>
                        </div>
                        {/* 설명 16/#767676 */}
                        {product.description && (
                            <p className="mt-3 text-[16px] leading-relaxed text-[#767676]">{product.description}</p>
                        )}
                        {/* 정가 취소선 (할인 시) */}
                        {hasDiscount && (
                            <div className="mt-4 text-[16px] text-[#999999] line-through tabular-nums">{formatPrice(product.price)}</div>
                        )}
                        {/* 할인% + 판매가 */}
                        <div className="mt-1 flex items-baseline gap-1">
                            {hasDiscount && <span className="text-[20px] font-medium text-[#0073DD] tabular-nums">{pct}%</span>}
                            <span className="text-[24px] font-medium text-[#222222] tabular-nums">{formatPrice(displayPrice(product))}</span>
                        </div>
                        {/* 평점 */}
                        <div className="mt-3 flex items-center gap-2 text-[14px]">
                            <span className="flex items-center gap-1">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="#F3C836" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                <span className="font-medium text-[#000]">{product.ratingAvg?.toFixed?.(1) ?? "0.0"}</span>
                            </span>
                            <span className="text-[#767676]">{product.reviewCount}건</span>
                        </div>
                    </div>

                    {/* 배송 정보 — 시안: 상하 #DDD 보더 · py 20 · gap 12 · label 14/#767676 + value 14/500 */}
                    <dl className="flex flex-col gap-3 border-y border-[#DDDDDD] py-5">
                        <div className="flex items-center gap-8">
                            <dt className="w-[68px] text-[14px] text-[#767676]">배송</dt>
                            <dd className="text-[14px] font-medium text-[#000]">국내배송</dd>
                        </div>
                        <div className="flex items-center gap-8">
                            <dt className="w-[68px] text-[14px] text-[#767676]">택배사</dt>
                            <dd className="text-[14px] font-medium text-[#000]">우체국택배</dd>
                        </div>
                        <div className="flex items-center gap-8">
                            <dt className="w-[68px] text-[14px] text-[#767676]">배송비</dt>
                            <dd className="text-[14px] font-medium text-[#000]">3,000원 (5만원 이상 무료배송)</dd>
                        </div>
                    </dl>

                    {/* 호환성 정보 */}
                    {product.compatibilityInfo && (
                        <div>
                            <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-1">호환 정보</div>
                            <p className="text-sm text-[var(--color-fg)] whitespace-pre-line">{product.compatibilityInfo}</p>
                        </div>
                    )}

                    {/* 구매 영역 — 옵션/수량/총액/장바구니·바로구매·찜 (클라이언트) */}
                    <ProductBuyBox
                        productId={product.id}
                        productName={product.name}
                        basePrice={displayPrice(product)}
                        siblings={siblings}
                        productSoldOut={product.soldOut === true || product.status === "SOLD_OUT"}
                    />
                </div>
            </div>

            {/* ===== 이 제품도 같이 구매하면 좋아요! — 시안 14:3437 (Best Item + 화살표 캐러셀) ===== */}
            <RelatedCarousel items={related.content} />

            {/* ===== 탭 (상세정보 / 상품구매안내 / 제품리뷰(N) / Q&A) ===== */}
            <DetailTabs reviewCount={product.reviewCount} />

            {/* ===== 상세이미지 (탭 바로 아래, gap 32) — 시리즈 통이미지 / 그 외 기본, 둘 다 접기+더알아보기 ===== */}
            <section id="info" className="mx-auto mt-8 max-w-[1920px] px-4 xl:px-[170px]">
                {seriesDetail
                    ? <DetailExpand src={seriesDetail.src} alt={`${product.name} 상세`} dark={seriesDetail.dark} />
                    : <DetailExpand src="/images/detail-performance.png" alt={`${product.name} 상세`} />}
            </section>

            {/* ===== 상품정보고시 ===== */}
            <section className="mx-auto max-w-[1920px] px-4 xl:px-[170px] mt-16 md:mt-[100px]">
                <h2 className="mb-6 text-[24px] font-medium text-[#222222]">상품정보고시</h2>
                <dl className="border-t border-[#222222] text-[14px]">
                    {[
                        ["품명 및 모델명", product.name],
                        ["제조국", "중국"],
                        ["제조사", "Heaven Gifts (ELFBAR)"],
                        ["인증번호", "도급인 인증서 수령 후 게재 예정"],
                        ["니코틴 함량", "옵션 참조 (0mg / 3mg)"],
                        ["사용 연령", "만 19세 이상 (성인 인증 필수)"],
                        ["A/S 책임자", "엘프바 라운지 고객센터 010-8662-8575"],
                    ].map(([k, v]) => (
                        <div key={k} className="flex border-b border-[#E5E5EC]">
                            <dt className="w-[140px] shrink-0 bg-[#F6F7FB] px-4 py-4 text-[#767676] md:w-[240px] md:px-6 md:py-5">{k}</dt>
                            <dd className="flex-1 px-4 py-4 text-[#000] md:px-6">{v}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* ===== 리뷰 통계 ===== */}
            <section id="reviews" className="mx-auto max-w-[1920px] px-4 xl:px-[170px] mt-16 md:mt-[100px]">
                <h2 className="mb-6 text-[24px] font-medium text-[#222222]">상품 리뷰</h2>
                <ReviewStats avg={product.ratingAvg ?? 0} count={product.reviewCount ?? 0} />
                <div className="mt-6">
                    <ProductReviews productId={product.id} />
                </div>
            </section>

            {/* ===== 배송·교환·반품 안내 ===== */}
            <section id="ship" className="mx-auto max-w-[1920px] px-4 xl:px-[170px] mt-16 md:mt-[100px]">
                <h2 className="mb-6 text-[24px] font-medium text-[#222222]">배송·교환·반품 안내</h2>
                <dl className="border-t border-[#222222] text-[14px]">
                    {[
                        ["배송 방법",      "택배 (CJ대한통운 / 우체국 택배)"],
                        ["배송 지역",      "전국 (제주·도서산간 추가 배송비 3,000원)"],
                        ["배송 기간",      "평일 13시 이전 주문 시 당일 출고, 1~3일 내 수령"],
                        ["배송비",         "3만원 이상 무료, 미만 시 3,000원"],
                        ["교환·반품 신청", "수령 후 7일 이내 마이페이지에서 신청"],
                        ["교환·반품 불가", "사용 흔적 있는 상품, 개봉품, 단순 변심 시 반송 택배비 차감"],
                        ["환불 처리",      "반품 도착·검수 완료 후 영업일 기준 3~5일 내 환급"],
                    ].map(([k, v]) => (
                        <div key={k} className="flex border-b border-[#E5E5EC]">
                            <dt className="w-[140px] shrink-0 bg-[#F6F7FB] px-4 py-4 text-[#767676] md:w-[240px] md:px-6 md:py-5">{k}</dt>
                            <dd className="flex-1 px-4 py-4 text-[#000] md:px-6">{v}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* ===== Q&A ===== */}
            <section id="qna" className="mx-auto max-w-[1920px] px-4 xl:px-[170px] mt-16 md:mt-[100px]">
                <h2 className="mb-6 text-[24px] font-medium text-[#222222]">Q&amp;A</h2>
                <ProductQna productId={product.id} />
            </section>

            {/* 모바일 하단 고정 CTA 는 ProductBuyBox 가 렌더 */}
        </div>
    );
}

/* /p/{id} — id 기반 라우트(구 URL 호환). 정식 URL 은 /product/{series}/{n}(slug). */
export default async function ProductByIdPage({ params }: { params: Params }) {
    const { id } = await params;
    return <ProductDetailView idOrSlug={id} />;
}

/* ============================================================
 * ReviewStats — 평균 평점 카드 + 별점 분포 placeholder
 * ============================================================ */
function ReviewStats({ avg, count }: { avg: number; count: number }) {
    // 별점 분포는 시드에 없어서 placeholder
    const distribution = [70, 18, 8, 3, 1]; // 5★ ~ 1★ 퍼센트
    return (
        <div className="flex flex-col gap-4 md:flex-row md:gap-7">
            {/* 평점 — ★★★★★ + 4.9/5.0 */}
            <div className="flex h-[200px] flex-1 flex-col items-center justify-center gap-4 rounded-[16px] bg-[#F6F7FB] md:h-[240px]">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-[16px] font-medium text-[#000]">사용자의 총 평점은?</p>
                    <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} width="32" height="32" viewBox="0 0 24 24" fill={i < Math.round(avg) ? "#F3C836" : "#DDDDDD"} aria-hidden="true">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                        ))}
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-bold text-[#000]">{avg.toFixed(1)}</span>
                    <span className="text-[32px] font-bold text-[#999999]">/ 5.0</span>
                </div>
            </div>
            {/* 총 리뷰 수 */}
            <div className="flex h-[200px] flex-1 flex-col items-center justify-center gap-2 rounded-[16px] bg-[#F6F7FB] md:h-[240px]">
                <p className="text-[16px] font-medium text-[#000]">총 리뷰 수</p>
                <p className="text-[32px] font-bold text-[#0072DD]">{count.toLocaleString()}개</p>
            </div>
            {/* 별점 분포 — 세로 막대 */}
            <div className="flex h-[200px] flex-1 flex-col items-center justify-center gap-3 rounded-[16px] bg-[#F6F7FB] md:h-[240px]">
                <p className="text-[16px] font-medium text-[#000]">별점 분포</p>
                <div className="flex items-end gap-3">
                    {distribution.map((pct, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <span className="flex h-[74px] w-4 items-end rounded-[4px] bg-[#E6F3FE]">
                                <span className="block w-full rounded-[4px] bg-[#0072DD]" style={{ height: `${Math.max(8, pct)}%` }} />
                            </span>
                            <span className="text-[14px] font-medium text-[#222]">{5 - i}점</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try { return await api<T>(path, { cache: "no-store" }); } catch { return fallback; }
}
