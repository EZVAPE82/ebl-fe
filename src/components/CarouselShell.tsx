"use client";

import { useRef, type ReactNode } from "react";
import { wrapScroll } from "@/lib/scroll";

/**
 * 공용 캐러셀 셸 — 아이브로 라벨 + 한글 타이틀 + 우측 ‹ › 화살표 + 가로 스크롤.
 * children 으로 받은 아이템들을 가로로 나열하고 화살표로 페이징. (추천 아이템 캐러셀과 동일 톤)
 * 각 아이템은 `snap-start shrink-0 w-[...]` 로 폭을 지정.
 */
export function CarouselShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    function scroll(dir: -1 | 1) {
        wrapScroll(ref.current, dir);
    }

    return (
        <section>
            {/* 시안 공통 헤더: eyebrow 18/#767676 · 타이틀 36/700/#000 · 48px 화살표 · 콘텐츠와 32px */}
            <div className="flex items-end justify-between mb-8">
                <div className="flex flex-col gap-2">
                    <p className="text-[18px] leading-none text-[#767676]">{eyebrow}</p>
                    <h2 className="text-[26px] md:text-[36px] font-bold leading-tight text-[#000]">{title}</h2>
                </div>
                <div className="flex gap-3 shrink-0">
                    <Arrow dir="prev" onClick={() => scroll(-1)} />
                    <Arrow dir="next" onClick={() => scroll(1)} />
                </div>
            </div>

            <div
                ref={ref}
                className="flex gap-4 md:gap-7 overflow-x-auto snap-x scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {children}
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
            className="w-12 h-12 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)] transition"
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
            </svg>
        </button>
    );
}
