"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * DUKE 시그니처 캐러셀 — 시안 33:3892 / 39:7028 / 39:7073 매칭.
 * 사용자 요구 순서:
 *   1) 파란색 active (뒤: 파→초→회) = duke-full-1.png
 *   2) 초록색 active (뒤: 초→회→파) = duke-full-3.png
 *   3) 회색 active (뒤: 회→파→초) = duke-full-2.png
 */
// Figma 최신 (122:12316/12002/12230) — 파→초→회 순서 정확
const SLIDES = [
    "/images/duke-slide-blue.png",  // 슬라이드 1: 파란색 active
    "/images/duke-slide-green.png", // 슬라이드 2: 초록색 active
    "/images/duke-slide-gray.png",  // 슬라이드 3: 회색 active
];

export function DukeCarousel() {
    const [idx, setIdx] = useState(0);
    function go(d: number) {
        setIdx(i => (i + d + SLIDES.length) % SLIDES.length);
    }

    return (
        <section
            className="relative rounded-[var(--radius-lg)] overflow-hidden"
            style={{ aspectRatio: "2218 / 880" }}
        >
            {/* 3 슬라이드 fade transition */}
            {SLIDES.map((src, i) => (
                <div
                    key={src}
                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${i === idx ? "opacity-100 z-[1]" : "opacity-0 z-0"}`}
                    aria-hidden={i !== idx}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={`ELFBAR DUKE 슬라이드 ${i + 1}`}
                        className="w-full h-full object-cover block"
                        draggable={false}
                    />
                </div>
            ))}

            {/* 화살표 button overlay — 베이크된 < > 위치 정밀 정렬 */}
            <button
                type="button"
                aria-label="이전 슬라이드"
                onClick={() => go(-1)}
                className="absolute z-10 cursor-pointer rounded-full hover:bg-white/15 transition"
                style={{ left: "10.7%", top: "65%", width: "2.9%", height: "9.5%" }}
            />
            <button
                type="button"
                aria-label="다음 슬라이드"
                onClick={() => go(1)}
                className="absolute z-10 cursor-pointer rounded-full hover:bg-white/15 transition"
                style={{ left: "13.7%", top: "65%", width: "2.9%", height: "9.5%" }}
            />

            {/* 우측 영역 전체를 카테고리 link 로 */}
            <Link
                href="/c/disposable"
                className="absolute right-0 top-0 h-full w-1/2 z-[5]"
                aria-label="DUKE 시그니처 일회용 보기"
            />
        </section>
    );
}
