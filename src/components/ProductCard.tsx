"use client";
import Link from "next/link";
import type { ProductSummary } from "@/types/api";
import { displayPrice, formatPrice } from "@/lib/format";
import { hoverImageUrl, safeImageUrl } from "@/lib/url";
import { useGated, useAdultGate, GateOverlay } from "@/components/AdultGate";

/**
 * 상품 카드 — 시안 450:5994 영역 (이름16/500/#000 · 설명14/#767676 · 구분선 ·
 *   정가16/#999 취소선 · 할인%16/#0073DD + 판매가20/500/#222 · ★#F3C836 4.9 | N건).
 *   이미지 374×448 r12, 카드 테두리 없음, 목록엔 장바구니/하트 없음. 성인 게이팅 유지.
 */
export function ProductCard({ p }: { p: ProductSummary }) {
    const isSoldOut = p.status === "SOLD_OUT" || p.soldOut === true;
    const thumb = safeImageUrl(p.thumbnailUrl);
    const bg = hoverImageUrl(thumb);     // 배경 있는 변형(-hover) URL (없으면 null)
    const displayImg = bg || thumb;      // 기본 이미지 = 배경 있는 이미지 우선
    const final = displayPrice(p);
    const hasDiscount = p.onlinePrice != null && p.onlinePrice < p.price;
    const pct = hasDiscount ? Math.round(((p.price - (p.onlinePrice as number)) / p.price) * 100) : 0;
    const gated = useGated();
    const { openGate } = useAdultGate();

    return (
        <Link
            href={`/p/${p.id}`}
            onClick={(e) => { if (gated) { e.preventDefault(); openGate(); } }}
            className="group block"
        >
            {/* 이미지 374×448 r12 — 배경변형(-hover)은 cover, device-only는 contain */}
            <div className="relative aspect-[374/448] rounded-[12px] overflow-hidden bg-[var(--color-bg-subtle)]">
                {displayImg ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={displayImg}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition group-hover:scale-[1.02]"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--color-fg-subtle)] text-xs">no image</div>
                )}
                {isSoldOut && (
                    <span className="absolute top-3 left-3 z-10 rounded-md bg-[var(--color-fg)]/80 px-2 py-1 text-[11px] font-medium text-[var(--color-fg-inverse)]">품절</span>
                )}
                {gated && <GateOverlay />}
            </div>

            {/* 정보 블록 — 이미지와 16px(pt-4), 내부 gap 12 */}
            <div className="pt-4 flex flex-col gap-3">
                {/* 이름 + 설명 gap 4 */}
                <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] font-medium text-[#000] line-clamp-1">{p.name}</h3>
                    {p.description && (
                        <p className="text-[14px] text-[#767676] line-clamp-1">{p.description}</p>
                    )}
                </div>
                {/* 구분선 */}
                <div className="h-px bg-[var(--color-border)]" />
                {/* 가격 + 별점 gap 4 */}
                <div className="flex flex-col gap-1">
                    {hasDiscount && (
                        <span className="text-[16px] text-[#999999] line-through tabular-nums">{formatPrice(p.price)}</span>
                    )}
                    <div className="flex items-baseline gap-2">
                        {hasDiscount && <span className="text-[16px] font-medium text-[#0073DD] tabular-nums">{pct}%</span>}
                        <span className="text-[20px] font-medium text-[#222222] tabular-nums">{formatPrice(final)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[14px]">
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
