"use client";

/**
 * 상품 상세 갤러리 — 시안 14:3437 좌측 영역.
 * 좌우 화살표 + 하단 dot indicator + thumbnail strip.
 * server component 인 /p/[id]/page.tsx 에서 import 해 client island 로 사용.
 */

import { useState } from "react";
import { useGated, useAdultGate, GateOverlay } from "@/components/AdultGate";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
    const [idx, setIdx] = useState(0);
    const total = images.length;
    const gated = useGated();
    const { openGate } = useAdultGate();
    if (total === 0) {
        return (
            <div className="aspect-square bg-[var(--color-bg-subtle)] rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--color-fg-subtle)] text-xs">
                no image
            </div>
        );
    }

    const prev = () => setIdx(i => (i - 1 + total) % total);
    const next = () => setIdx(i => (i + 1) % total);

    return (
        <div>
            <div className="aspect-square bg-[var(--color-bg-subtle)] rounded-[var(--radius-lg)] overflow-hidden relative group">
                {/* device 이미지가 세로로 길쭉(0.4~0.8) — contain 으로 잘림 방지. 약간의 padding 으로 가장자리 여백 확보. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={images[idx]}
                    alt={`${alt} ${idx + 1}/${total}`}
                    className="w-full h-full object-contain p-4 md:p-8 transition-opacity duration-200"
                    key={idx /* 강제 re-mount 로 자연스러운 fade 효과 (브라우저 단계) */}
                />
                {total > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prev}
                            aria-label="이전 이미지"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg)] opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white transition shadow-sm"
                        >‹</button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label="다음 이미지"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg)] opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white transition shadow-sm"
                        >›</button>
                    </>
                )}
                {gated && <GateOverlay />}
            </div>

            {/* dot indicator */}
            {total > 1 && (
                <div className="mt-3 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setIdx(i)}
                            aria-label={`${i + 1}번 이미지로 이동`}
                            className={`w-1.5 h-1.5 rounded-full transition ${
                                i === idx ? "bg-[var(--color-fg)] scale-125" : "bg-[var(--color-border-strong)] hover:bg-[var(--color-fg-muted)]"
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* thumbnail strip (4개 초과 시 의미) */}
            {total > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                    {images.slice(0, 5).map((src, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => (gated ? openGate() : setIdx(i))}
                            className={`relative aspect-square rounded-[var(--radius-sm)] overflow-hidden border-2 transition ${
                                i === idx ? "border-[var(--color-fg)]" : "border-transparent hover:border-[var(--color-border-strong)]"
                            }`}
                            aria-label={gated ? "성인인증 후 확인" : `썸네일 ${i + 1}`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className={`w-full h-full object-contain p-1 ${gated ? "blur-md" : ""}`} />
                            {gated && <span className="absolute inset-0 bg-black/15" aria-hidden="true" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
