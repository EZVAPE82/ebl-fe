import Link from "next/link";
import type { ProductSummary } from "@/types/api";
import { formatPrice } from "@/lib/format";

export function ProductCard({ p }: { p: ProductSummary }) {
    const isSoldOut = p.status === "SOLD_OUT";
    return (
        <Link
            href={`/p/${p.id}`}
            className="group flex flex-col rounded-md overflow-hidden border border-zinc-200 hover:border-zinc-400 transition"
        >
            <div className="aspect-square bg-zinc-100 relative">
                {p.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={p.thumbnailUrl}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs">
                        no image
                    </div>
                )}
                {isSoldOut && (
                    <span className="absolute top-2 left-2 rounded bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
                        품절
                    </span>
                )}
            </div>
            <div className="p-3 space-y-1">
                <h3 className="text-sm font-medium leading-tight line-clamp-2">{p.name}</h3>
                <div className="text-base font-semibold">{formatPrice(p.price)}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <span>★ {p.ratingAvg?.toFixed?.(1) ?? "0.0"}</span>
                    <span>·</span>
                    <span>후기 {p.reviewCount}</span>
                </div>
            </div>
        </Link>
    );
}
