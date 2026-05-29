"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * 이미지 lightbox 모달.
 *
 *  - 클릭 시 원본 사진 풀 사이즈 표시
 *  - 좌/우 화살표 (또는 ←/→ 키) 로 navigate
 *  - ESC / 배경 클릭 / X 버튼으로 닫기
 *  - 비율 보존 (object-fit contain), 화면에 맞게 max-h/w 100%
 *
 * 사용법:
 *  const [open, setOpen] = useState(false);
 *  const [idx, setIdx] = useState(0);
 *  <Lightbox open={open} images={photos} index={idx} onClose={() => setOpen(false)} onChange={setIdx} />
 */
export type LightboxImage = {
    src: string;        // 원본 사진 URL (풀 사이즈)
    alt?: string;
    width?: number;     // 옵션, 비율 hint
    height?: number;
};

export function Lightbox({
    open,
    images,
    index,
    onClose,
    onChange,
}: {
    open: boolean;
    images: LightboxImage[];
    index: number;
    onClose: () => void;
    onChange: (i: number) => void;
}) {
    const [current, setCurrent] = useState(index);

    useEffect(() => { setCurrent(index); }, [index]);

    const go = useCallback((delta: number) => {
        const next = (current + delta + images.length) % images.length;
        setCurrent(next);
        onChange(next);
    }, [current, images.length, onChange]);

    // 키보드 navigation
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowLeft")  go(-1);
            else if (e.key === "ArrowRight") go(1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, go, onClose]);

    // 열려있는 동안 body scroll lock
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open || images.length === 0) return null;
    const img = images[current];

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-12"
            role="dialog"
            aria-modal="true"
            aria-label="사진 크게 보기"
            onClick={onClose}
        >
            {/* 닫기 버튼 */}
            <button
                type="button"
                aria-label="닫기"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>

            {/* 이전 */}
            {images.length > 1 && (
                <button
                    type="button"
                    aria-label="이전"
                    onClick={(e) => { e.stopPropagation(); go(-1); }}
                    className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            )}

            {/* 다음 */}
            {images.length > 1 && (
                <button
                    type="button"
                    aria-label="다음"
                    onClick={(e) => { e.stopPropagation(); go(1); }}
                    className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            )}

            {/* 이미지 본체 — 비율 보존 contain */}
            <div
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={img.src}
                    alt={img.alt ?? `사진 ${current + 1}`}
                    className="block max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                    draggable={false}
                />
                {/* 페이지네이션 — 우하단 */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs tabular-nums">
                        {current + 1} / {images.length}
                    </div>
                )}
            </div>
        </div>
    );
}
