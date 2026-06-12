"use client";

import Link from "next/link";
import { useRef } from "react";
import type { ProductSummary } from "@/types/api";
import { displayPrice, formatPrice, productHref } from "@/lib/format";
import { hoverImageUrl, safeImageUrl } from "@/lib/url";
import { wrapScroll } from "@/lib/scroll";

/**
 * "엘프바의 추천 아이템" (Best Item) 캐러셀 — Figma 402:11091 1:1.
 *  헤더: eyebrow 18/#767676 + 타이틀 36/700/#000 + 우측 48×48 화살표(gap 12)
 *  카드(374w, gap 28): 이미지 374×448 r12 + 좌상단 뱃지(흰배경 파란#0072DD r4) ·
 *                      이름 16/500 · 설명 14/#767676 · 구분선 · 정가 16/#999 취소선 ·
 *                      할인% 16/#0073DD + 판매가 20/#222 · ★평점 | N건(14/#767676)
 *  하단: 더 알아보기 버튼 160×52 r4 (카드와 60px 간격, 가운데)
 */
export function FeaturedCarousel({ items }: { items: ProductSummary[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    function scroll(dir: -1 | 1) {
        wrapScroll(scrollRef.current, dir);
    }

    if (items.length === 0) {
        return (
            <section>
                <Header onPrev={() => scroll(-1)} onNext={() => scroll(1)} />
                <p className="text-sm text-[var(--color-fg-subtle)] py-8 text-center">
                    추천 아이템이 설정되지 않았습니다. 어드민에서 추천 슬롯에 상품을 배치해주세요.
                </p>
            </section>
        );
    }

    return (
        <section>
            <Header onPrev={() => scroll(-1)} onNext={() => scroll(1)} />

            {/* 카드 행 — 시안 gap 28(lg:gap-7), 4-up */}
            <div
                ref={scrollRef}
                className="flex gap-3 md:gap-7 overflow-x-auto snap-x scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {items.map((p) => (
                    <div key={p.id} className="snap-start shrink-0 w-[calc((100%-12px)/2)] sm:w-[46%] lg:w-[calc((100%-84px)/4)]">
                        <FeaturedCard p={p} />
                    </div>
                ))}
            </div>

            {/* 더 알아보기 — 시안: 카드와 60px, 가운데, 160×52 r4 아웃라인 */}
            <div className="mt-7 md:mt-[60px] flex justify-center">
                <Link
                    href="/products"
                    className="inline-flex items-center justify-center w-full md:w-[160px] h-11 md:h-[52px] rounded-[4px] border border-[#DDD] bg-white text-[13px] md:text-sm font-medium text-[#000] hover:bg-[var(--color-bg-subtle)] transition"
                >
                    더 알아보기
                </Link>
            </div>
        </section>
    );
}

function Header({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
    return (
        <div className="flex items-end justify-between mb-4 md:mb-8">
            <div className="flex flex-col gap-1 md:gap-2">
                <p className="text-[14px] md:text-[18px] leading-none text-[#767676]">Best Item</p>
                <h2 className="text-[20px] md:text-[36px] font-bold leading-tight text-[#000]">엘프바의 추천 아이템</h2>
            </div>
            <div className="flex gap-2 md:gap-3 shrink-0">
                <Arrow dir="prev" onClick={onPrev} />
                <Arrow dir="next" onClick={onNext} />
            </div>
        </div>
    );
}

function Arrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={dir === "prev" ? "이전" : "다음"}
            className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)] transition"
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
            </svg>
        </button>
    );
}

function FeaturedCard({ p }: { p: ProductSummary }) {
    const thumb = safeImageUrl(p.thumbnailUrl);
    const bg = hoverImageUrl(thumb);
    const img = bg || thumb;
    const final = displayPrice(p);
    const hasDiscount = p.onlinePrice != null && p.onlinePrice < p.price;
    const pct = hasDiscount ? Math.round(((p.price - (p.onlinePrice as number)) / p.price) * 100) : 0;
    const isSoldOut = p.status === "SOLD_OUT" || p.soldOut === true;

    return (
        <Link href={productHref(p)} className="group block">
            {/* 이미지 374×448 r12 + 좌상단 뱃지 */}
            <div className="relative aspect-[374/448] rounded-[12px] overflow-hidden bg-[var(--color-bg-subtle)]">
                {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={img}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition group-hover:scale-[1.02]"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--color-fg-subtle)] text-xs">no image</div>
                )}
                {/* 장바구니 · 하트 — 우하단 세로 스택 (Best 뱃지 삭제) */}
                <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                    <button
                        type="button"
                        aria-label="장바구니 담기"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--color-fg-muted)] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[var(--color-fg)]"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L22 7H6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        aria-label="위시리스트"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--color-fg-muted)] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#ff4d6d]"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                    </button>
                </div>
                {isSoldOut && (
                    <span className="absolute top-3 right-3 rounded-md bg-[var(--color-fg)]/80 px-2 py-1 text-[11px] font-medium text-[var(--color-fg-inverse)]">품절</span>
                )}
            </div>

            {/* 정보 블록 — 이미지와 16px(pt-4), 내부 gap 12 */}
            <div className="pt-4 flex flex-col gap-3">
                {/* 이름 + 설명 gap 4 */}
                <div className="flex flex-col gap-1">
                    <h3 className="text-[14px] md:text-[16px] font-medium text-[#000] line-clamp-1">{p.name}</h3>
                    {p.description && (
                        <p className="text-[13px] md:text-[14px] text-[#767676] line-clamp-1">{p.description}</p>
                    )}
                </div>
                {/* 구분선 */}
                <div className="h-px bg-[var(--color-border)]" />
                {/* 가격 + 별점 gap 4 */}
                <div className="flex flex-col gap-1">
                    {hasDiscount && (
                        <span className="text-[12px] md:text-[16px] text-[#999999] line-through tabular-nums">{formatPrice(p.price)}</span>
                    )}
                    <div className="flex items-baseline gap-1 md:gap-2">
                        {hasDiscount && <span className="text-[14px] md:text-[16px] font-medium text-[#0073DD] tabular-nums">{pct}%</span>}
                        <span className="text-[14px] md:text-[20px] font-medium text-[#222222] tabular-nums">{formatPrice(final)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[13px] md:text-[14px]">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#F3C836" aria-hidden="true" className="shrink-0">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span className="font-medium text-[#000]">{(p.ratingAvg ?? 0).toFixed(1)}</span>
                        <span className="mx-0.5 text-[var(--color-border-strong)]">|</span>
                        <span className="text-[#767676]">{p.reviewCount}건</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
