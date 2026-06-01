import Link from "next/link";
import type { ProductSummary } from "@/types/api";
import { displayPrice, formatPrice } from "@/lib/format";
import { safeImageUrl } from "@/lib/url";

export function ProductCard({ p }: { p: ProductSummary }) {
    const isSoldOut = p.status === "SOLD_OUT";
    const thumb = safeImageUrl(p.thumbnailUrl);
    return (
        <Link
            href={`/p/${p.id}`}
            className="group flex flex-col rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition"
        >
            {/* 시안 카드 thumbnail 영역은 정사각형(445x445). icekingpro 처럼 풍부한 배경+device 1:1 이미지는
                cover 로 꽉 채워지고, 일부 series 의 세로 길쭉 device-only 이미지(0.4~0.8)는 contain 으로 letterbox 처리.
                여기서는 모든 series 호환을 위해 contain 유지 — 정사각형 1:1 은 letterbox 거의 없음. */}
            <div className="aspect-square bg-[var(--color-bg-subtle)] relative">
                {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumb}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--color-fg-subtle)] text-xs">
                        no image
                    </div>
                )}
                {isSoldOut && (
                    <span className="absolute top-2 left-2 rounded-[var(--radius-sm)] bg-[var(--color-fg)]/80 px-2 py-0.5 text-[11px] font-medium text-[var(--color-fg-inverse)]">
                        품절
                    </span>
                )}
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
