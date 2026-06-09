"use client";

import Link from "next/link";
import { useRef } from "react";
import type { ProductSummary } from "@/types/api";
import { displayPrice, formatPrice } from "@/lib/format";
import { hoverImageUrl, safeImageUrl } from "@/lib/url";

/**
 * "엘프바의 추천 아이템" (Best Item) 캐러셀 — 시안 매칭.
 *  - 헤더: 라벨 + 타이틀 + 우측 ‹ › 화살표(가로 스크롤)
 *  - 카드: Best N 배지 · 배경 이미지(cover) · 이름 · 한 줄 설명 · 정가취소선+할인%+판매가 · ★평점 | N건
 *  - 데스크탑 4-up, 모바일은 가로 스크롤(다음 카드 peek)
 */
export function FeaturedCarousel({ items }: { items: ProductSummary[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    function scroll(dir: -1 | 1) {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
    }

    if (items.length === 0) {
        return (
            <section>
                <Header onPrev={() => scroll(-1)} onNext={() => scroll(1)} />
                <p className="text-sm text-[var(--color-fg-subtle)] py-8 text-center">
                    추천 아이템이 설정되지 않았습니다. 어드민에서 추천 슬롯(1~4)에 상품을 배치해주세요.
                </p>
            </section>
        );
    }

    return (
        <section>
            <Header onPrev={() => scroll(-1)} onNext={() => scroll(1)} />

            <div
                ref={scrollRef}
                className="flex gap-4 md:gap-6 overflow-x-auto snap-x scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {items.map((p, i) => (
                    <div key={p.id} className="snap-start shrink-0 w-[72%] sm:w-[46%] lg:w-[calc((100%-72px)/4)]">
                        <FeaturedCard p={p} rank={i + 1} />
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-center">
                <Link
                    href="/products"
                    className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-8 py-2.5 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                >
                    더 알아보기
                </Link>
            </div>
        </section>
    );
}

function Header({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
    return (
        <div className="flex items-end justify-between mb-4">
            <div>
                <p className="text-xs text-[var(--color-fg-muted)] mb-4">Best Item</p>
                <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">엘프바의 추천 아이템</h2>
            </div>
            <div className="flex gap-2">
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
            className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)] transition"
        >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
            </svg>
        </button>
    );
}

function FeaturedCard({ p, rank }: { p: ProductSummary; rank: number }) {
    const thumb = safeImageUrl(p.thumbnailUrl);
    const bg = hoverImageUrl(thumb);
    const img = bg || thumb;
    const final = displayPrice(p);
    const hasDiscount = p.onlinePrice != null && p.onlinePrice < p.price;
    const pct = hasDiscount ? Math.round(((p.price - (p.onlinePrice as number)) / p.price) * 100) : 0;
    const isSoldOut = p.status === "SOLD_OUT" || p.soldOut === true;

    return (
        <Link href={`/p/${p.id}`} className="group block">
            <div className="relative aspect-square rounded-[16px] overflow-hidden bg-[var(--color-bg-subtle)]">
                {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={img}
                        alt={p.name}
                        loading="lazy"
                        className={`w-full h-full ${bg ? "object-cover" : "object-contain p-3"}`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--color-fg-subtle)] text-xs">no image</div>
                )}
                <span className="absolute top-3 left-3 rounded-md bg-gradient-to-br from-[#4f7cf7] to-[#7b61ff] text-white text-[11px] font-semibold px-2 py-0.5 shadow-sm">
                    Best {rank}
                </span>
                {isSoldOut && (
                    <span className="absolute top-3 right-3 rounded-md bg-[var(--color-fg)]/80 px-2 py-0.5 text-[11px] font-medium text-[var(--color-fg-inverse)]">품절</span>
                )}
            </div>

            <div className="pt-3 space-y-1">
                <h3 className="text-sm font-semibold text-[var(--color-fg)] line-clamp-1">{p.name}</h3>
                {p.description && (
                    <p className="text-xs text-[var(--color-fg-muted)] line-clamp-1 leading-relaxed">{p.description}</p>
                )}
                <div className="flex items-baseline gap-1.5 pt-0.5">
                    {hasDiscount && (
                        <span className="text-xs text-[var(--color-fg-subtle)] line-through tabular-nums">{formatPrice(p.price)}</span>
                    )}
                    {hasDiscount && (
                        <span className="text-sm font-bold text-[#16b1c4] tabular-nums">{pct}%</span>
                    )}
                    <span className="text-base font-bold text-[var(--color-fg)] tabular-nums">{formatPrice(final)}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[var(--color-fg-subtle)] pt-0.5">
                    <span className="text-yellow-400">★</span>
                    <span className="text-[var(--color-fg)] font-medium">{(p.ratingAvg ?? 0).toFixed(1)}</span>
                    <span className="text-[var(--color-border-strong)]">|</span>
                    <span>{p.reviewCount}건</span>
                </div>
            </div>
        </Link>
    );
}
