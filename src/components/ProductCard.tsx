"use client";
import Link from "next/link";
import { useState } from "react";
import type { ProductSummary } from "@/types/api";
import { displayPrice, formatPrice } from "@/lib/format";
import { safeImageUrl } from "@/lib/url";

// -hover.png 변형 자산이 실제로 존재하는 시리즈 접두어만 호버 스왑 시도 → 없는 상품의 404 방지.
const HOVER_PREFIXES = ["crosamba", "frozen", "iceking", "icekingpro", "joinwon-kit"];
function hasHoverVariant(url: string): boolean {
    const file = url.split("/").pop() ?? "";
    return HOVER_PREFIXES.some((pre) => file.startsWith(pre));
}

/**
 * 상품 카드 — 시안 매칭:
 *  - default: device-only 깔끔한 thumbnail (object-contain, 세로 비율 그대로 letterbox)
 *  - hover  : 같은 파일명에 `-hover` suffix 가 있는 풍부한 배경 카드(1:1 정사각형)로 fade-in swap
 *             파일이 없으면 onError 로 default 그대로 유지.
 *
 * Convention: /images/foo.png → /images/foo-hover.png (자동 추론)
 */
export function ProductCard({ p }: { p: ProductSummary }) {
    const isSoldOut = p.status === "SOLD_OUT" || p.soldOut === true;
    const thumb = safeImageUrl(p.thumbnailUrl);
    const hoverThumb = thumb && hasHoverVariant(thumb) ? thumb.replace(/(\.[a-z]+)$/i, "-hover$1") : "";
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
                        {/* 순차 fade — 호버 ON: default 가 먼저 사라지고(0~500ms) hover 가 늦게 나타남(200~700ms).
                            호버 OFF: hover 가 먼저 사라지고(0~500ms) default 가 늦게 돌아옴(200~700ms).
                            delay-200 + group-hover:delay-0 (default) ↔ group-hover:delay-200 (hover) 의 비대칭 delay 로 구현. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={thumb}
                            alt={p.name}
                            loading="lazy"
                            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out delay-200 group-hover:delay-0 ${
                                hoverOk ? "group-hover:opacity-0" : ""
                            }`}
                        />
                        {hoverOk && hoverThumb && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={hoverThumb}
                                alt=""
                                onError={() => setHoverOk(false)}
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out group-hover:delay-200"
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
