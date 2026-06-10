"use client";

import { useRef } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { ProductSummary } from "@/types/api";

/**
 * 상품 상세 "이 제품도 같이 구매하면 좋아요!" — 시안 14:3437.
 * eyebrow "Best Item"(18/#767676) + 타이틀 36/700 + 우측 화살표 48 원형 + 가로 스크롤 카드(374, ProductCard).
 */
export function RelatedCarousel({ items }: { items: ProductSummary[] }) {
    const ref = useRef<HTMLDivElement>(null);

    function scroll(dir: -1 | 1) {
        const el = ref.current;
        if (!el) return;
        el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
    }

    if (items.length === 0) return null;

    return (
        <section className="mx-auto mt-16 max-w-[1920px] px-4 md:mt-[100px] xl:px-[170px]">
            {/* 헤더 — eyebrow + 타이틀 + 화살표 */}
            <div className="mb-8 flex items-end justify-between">
                <div className="flex flex-col gap-2">
                    <p className="text-[18px] leading-none text-[#767676]">Best Item</p>
                    <h2 className="text-[26px] font-bold leading-tight text-[#000] md:text-[36px]">이 제품도 같이 구매하면 좋아요!</h2>
                </div>
                <div className="hidden shrink-0 gap-3 md:flex">
                    <Arrow dir="prev" onClick={() => scroll(-1)} />
                    <Arrow dir="next" onClick={() => scroll(1)} />
                </div>
            </div>

            {/* 카드 가로 스크롤 — 4-up (374), gap 28 */}
            <div
                ref={ref}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-1 snap-x lg:gap-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {items.map((p) => (
                    <div key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-84px)/4)]">
                        <ProductCard p={p} />
                    </div>
                ))}
            </div>
        </section>
    );
}

function Arrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={dir === "prev" ? "이전" : "다음"}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DDDDDD] text-[#222] transition hover:border-[#222]"
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
            </svg>
        </button>
    );
}
