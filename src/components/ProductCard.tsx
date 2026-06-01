"use client";
import Link from "next/link";
import { useState } from "react";
import type { ProductSummary } from "@/types/api";
import { displayPrice, formatPrice } from "@/lib/format";
import { safeImageUrl } from "@/lib/url";

/**
 * 상품 카드 — 시안 매칭:
 *  - default: device-only 깔끔한 thumbnail (object-contain, 세로 비율 그대로 letterbox)
 *  - hover  : 같은 파일명에 `-hover` suffix 가 있는 풍부한 배경 카드(1:1 정사각형)로 fade-in swap
 *             파일이 없으면 onError 로 default 그대로 유지.
 *
 * Convention: /images/foo.png → /images/foo-hover.png (자동 추론)
 */
export function ProductCard({ p }: { p: ProductSummary }) {
    const isSoldOut = p.status === "SOLD_OUT";
    const thumb = safeImageUrl(p.thumbnailUrl);
    const hoverThumb = thumb ? thumb.replace(/(\.[a-z]+)$/i, "-hover$1") : "";
    const [hoverOk, setHoverOk] = useState(true);

    return (
        <Link
            href={`/p/${p.id}`}
            className="group flex flex-col rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition"
        >
            {/* 카드 thumbnail 영역 — 시안 정사각형(445x445).
                device-only 세로 길쭉(0.4~0.8) 이미지는 contain 으로 letterbox.
                hover 시 -hover.png(1:1 풍부한 배경)가 cover 로 fade-in. */}
            <div className="aspect-square bg-[var(--color-bg-subtle)] relative">
                {thumb ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={thumb}
                            alt={p.name}
                            loading="lazy"
                            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ease-in-out ${
                                hoverOk ? "group-hover:opacity-0" : ""
                            }`}
                        />
                        {/* hover 풍부한 배경 카드 — 사전 로드(prefetch) 해서 첫 호버 시에도 부드러운 0.3초 fade 보장.
                            파일 없으면 onError → 비활성화 (default 만 유지). */}
                        {hoverOk && hoverThumb && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={hoverThumb}
                                alt=""
                                onError={() => setHoverOk(false)}
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                            />
                        )}
                    </>
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
