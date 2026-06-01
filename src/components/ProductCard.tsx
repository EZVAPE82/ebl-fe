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
            {/* device 이미지가 세로로 긴 비율(0.4~0.8)이라 정사각형에 cover 하면 잘림.
                카드를 약간 세로(4:5)로 잡고 contain 으로 device 전체가 보이게 한다. */}
            <div className="aspect-[4/5] bg-[var(--color-bg-subtle)] relative">
                {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumb}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain p-2 group-hover:scale-105 transition"
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
