"use client";
import Link from "next/link";
import type { ProductSummary } from "@/types/api";
import { displayPrice, formatPrice } from "@/lib/format";
import { hoverImageUrl, safeImageUrl } from "@/lib/url";
import { useGated, useAdultGate, GateOverlay } from "@/components/AdultGate";

/**
 * 상품 카드.
 *  - 기본 이미지: `-hover` 배경 변형이 있으면 그걸 cover 로 꽉 채워 노출(배경 있는 이미지).
 *    변형이 없으면 device-only thumbnail 을 contain 으로 letterbox.
 *  - 호버 이미지 스왑 없음.
 *
 * Convention: /images/foo.png → /images/foo-hover.png (배경 변형, 자동 추론)
 */
export function ProductCard({ p }: { p: ProductSummary }) {
    const isSoldOut = p.status === "SOLD_OUT" || p.soldOut === true;
    const thumb = safeImageUrl(p.thumbnailUrl);
    const bg = hoverImageUrl(thumb);     // 배경 있는 변형(-hover) URL (없으면 null)
    const displayImg = bg || thumb;      // 기본 이미지 = 배경 있는 이미지 우선
    const gated = useGated();
    const { openGate } = useAdultGate();

    return (
        <Link
            href={`/p/${p.id}`}
            onClick={(e) => { if (gated) { e.preventDefault(); openGate(); } }}
            className="group flex flex-col rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition"
        >
            {/* 카드 이미지 — 배경 있는 변형(-hover)이 있으면 cover 로 꽉 채워 기본 노출. 호버 스왑 없음. */}
            <div className="aspect-square bg-[var(--color-bg-subtle)] relative">
                {displayImg ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={displayImg}
                        alt={p.name}
                        loading="lazy"
                        className={`absolute inset-0 w-full h-full ${bg ? "object-cover" : "object-contain"}`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--color-fg-subtle)] text-xs">
                        no image
                    </div>
                )}
                {isSoldOut && (
                    <span className="absolute top-2 left-2 rounded-[var(--radius-sm)] bg-[var(--color-fg)]/80 px-2 py-0.5 text-[11px] font-medium text-[var(--color-fg-inverse)] z-10">
                        품절
                    </span>
                )}
                {gated && <GateOverlay />}
            </div>
            <div className="p-3 space-y-1">
                <h3 className="text-sm font-medium leading-tight line-clamp-2 text-[var(--color-fg)]">{p.name}</h3>
                <div className="text-base font-semibold text-[var(--color-fg)]">{formatPrice(displayPrice(p))}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-fg-subtle)]">
                    <span>★ {p.ratingAvg?.toFixed?.(1) ?? "0.0"}</span>
                    <span>·</span>
                    <span>후기 {p.reviewCount}</span>
                </div>
            </div>
        </Link>
    );
}
