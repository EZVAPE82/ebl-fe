"use client";

import { useEffect, useRef, useState } from "react";

/**
 * DetailExpand — 상세이미지 접기/펼치기 (시안: 이미지 + 하단 페이드 + "더 알아보기").
 *   접힘: 960px 까지만 노출 + 하단 페이드. 펼침: 전체(실측 높이) + 버튼 "접기".
 *   dark=true → 검정 배경 상세이미지(DUKE 통이미지)용 검정 페이드.
 *   버튼 시안: 가운데 · 160 · padding 16 · r4 · #DDD 보더 · 14/500.
 */
export function DetailExpand({ src, alt, dark = false }: { src: string; alt: string; dark?: boolean }) {
    const [open, setOpen] = useState(false);
    const [fullH, setFullH] = useState(0);
    const innerRef = useRef<HTMLDivElement>(null);

    // 이미지 로드/리사이즈에 따라 전체 높이 실측 → 펼칠 때 정확한 max-height 애니메이션.
    useEffect(() => {
        const el = innerRef.current;
        if (!el) return;
        const measure = () => setFullH(el.scrollHeight);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const COLLAPSED = 960;

    return (
        <div className="mx-auto max-w-[860px]">
            <div
                className="relative overflow-hidden rounded-[16px] transition-[max-height] duration-500 ease-in-out"
                style={{ maxHeight: open ? (fullH || 99999) : COLLAPSED }}
            >
                <div ref={innerRef}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={alt} className="block h-auto w-full" />
                </div>
                {/* 접힘 시 하단 페이드 (시안 흰→투명 / DUKE 검정 이미지는 검정 페이드) */}
                {!open && (
                    <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t to-transparent ${dark ? "from-black via-black/70" : "from-white via-white/70"}`} />
                )}
            </div>

            <div className="mt-4 flex justify-center">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    className="w-[160px] rounded-[4px] border border-[#DDDDDD] bg-white p-4 text-center text-[14px] font-medium leading-5 text-[#000] transition hover:bg-[#F6F7FB]"
                >
                    {open ? "접기" : "더 알아보기"}
                </button>
            </div>
        </div>
    );
}
