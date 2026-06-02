"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { safeImageUrl, safeLinkUrl } from "@/lib/url";
import type { Banner } from "@/types/api";

/**
 * 메인 히어로 캐러셀 (Figma 시안 매칭)
 *
 * 시안 구성:
 *  - 좌측 텍스트 오버레이: New Arrival 라벨 + 2줄 메인 카피 + 서브 카피
 *  - 우측 상하 풀폭으로 product 이미지 (banner image)
 *  - 좌하단: "01 ─── 05" 진행 인디케이터 + < > 화살표 원형 버튼
 *  - 자동 회전 5s, 호버 일시정지, 좌측 텍스트는 슬라이드별 alt/title 사용
 *
 * Banner DB가 title/subtitle 컬럼을 가지지 않으므로, 1번 슬라이드(또는 alt가 비어있는 슬라이드)는
 * design 기본 카피를 사용한다. 이후 도급인이 admin에서 alt(=헤드라인)·linkUrl 만 갱신해도 시안 유지.
 */
export function HeroCarousel({
    banners,
    fallbackImage = "/images/hero-bg.png",
    fallbackMobileImage,
    heightClass = "aspect-[360/520] md:aspect-[12/5] md:min-h-[440px] md:max-h-[720px]",
    showOverlay = true,
    defaultOverlay = DESIGN_DEFAULT_OVERLAY,
    children,
}: {
    banners: Banner[];
    fallbackImage?: string;
    /** 모바일 fallback (시안 276:9808 매칭 — 세로 비율 hero-mobile-1.png). 미지정 시 fallbackImage 사용. */
    fallbackMobileImage?: string;
    /**
     * Tailwind 높이 클래스. 시안 매칭:
     *  - 모바일(<md): 9:13 세로 비율 (모바일 시안 360x520 ≈ 9:13)
     *  - 데스크톱(>=md): 12:5 가로 와이드 + min-h 440 / max-h 720
     */
    heightClass?: string;
    /** false면 텍스트/인디케이터 오버레이를 숨기고 풀폭 이미지만 노출 (중간 DUKE 등 풀이미지 슬라이드용) */
    showOverlay?: boolean;
    /** 텍스트 컬럼이 비어있을 때 쓸 기본 카피 */
    defaultOverlay?: { label: string; title: React.ReactNode; subtitle: string };
    /** Hero 하단에 absolute 로 박힐 슬롯 (TrustBadges 등). 시안 214:17932 매칭. */
    children?: React.ReactNode;
}) {
    type Slide = { id: number; img: string; mobileImg: string; href: string; alt: string };

    const slides = useMemo<Slide[]>(() => {
        if (banners.length > 0) {
            return banners.map((b, i) => ({
                id: b.id ?? i,
                img: safeImageUrl(b.imageUrl),
                // 모바일 이미지 미지정 시 PC 이미지 폴백 (호환성 유지)
                mobileImg: b.mobileImageUrl ? safeImageUrl(b.mobileImageUrl) : safeImageUrl(b.imageUrl),
                href: safeLinkUrl(b.linkUrl),
                alt: b.altText ?? "",
            }));
        }
        return [{ id: 0, img: fallbackImage, mobileImg: fallbackMobileImage ?? fallbackImage, href: "#", alt: "" }];
    }, [banners, fallbackImage, fallbackMobileImage]);

    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const total = slides.length;
    const timerRef = useRef<number | null>(null);

    // 자동 회전 (slides.length > 1 일 때만)
    useEffect(() => {
        if (total <= 1 || paused) return;
        timerRef.current = window.setTimeout(() => {
            setIndex(i => (i + 1) % total);
        }, 5000);
        return () => {
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        };
    }, [index, paused, total]);

    function go(delta: number) {
        setIndex(i => (i + delta + total) % total);
    }

    return (
        <section
            className={`relative w-full overflow-hidden bg-[#1a0f3d] ${heightClass}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="메인 히어로 슬라이드"
        >
            {/* 슬라이드 (배경 이미지) — fade transition */}
            {slides.map((s, i) => {
                const isActive = i === index;
                return (
                    <div
                        key={s.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? "opacity-100" : "opacity-0"}`}
                        aria-hidden={!isActive}
                    >
                        {/* 시안 매칭: 모바일은 세로 hero(276:9808 360x520), 데스크탑은 와이드 hero.
                            <picture> + media query 로 viewport 별 다른 source 자동 swap. */}
                        <picture>
                            <source media="(max-width: 767px)" srcSet={s.mobileImg} />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={s.img}
                                alt={s.alt}
                                // 모바일은 wide 원본(2754x1536)을 세로 frame 에 cover crop. 시안 매칭 위해 center.
                                className="absolute inset-0 w-full h-full object-cover object-center"
                                draggable={false}
                            />
                        </picture>
                        {/* 좌측 어두운 그라데이션 — 텍스트 가독성 확보. 모바일은 하단에서 위로 어두운 그라데이션 추가 (텍스트 가독성). */}
                        {showOverlay && (
                            <>
                                <div
                                    className="absolute inset-0 pointer-events-none hidden md:block"
                                    style={{
                                        background:
                                            "linear-gradient(90deg, rgba(20,8,60,0.65) 0%, rgba(20,8,60,0.35) 35%, rgba(20,8,60,0) 65%)",
                                    }}
                                />
                                <div
                                    className="absolute inset-0 pointer-events-none md:hidden"
                                    style={{
                                        background:
                                            "linear-gradient(180deg, rgba(10,5,40,0.55) 0%, rgba(10,5,40,0.25) 30%, rgba(10,5,40,0.55) 100%)",
                                    }}
                                />
                            </>
                        )}
                    </div>
                );
            })}

            <div className="relative mx-auto max-w-screen-2xl h-full px-4 md:px-8 lg:px-12">
                {/* 좌측 오버레이 — 시안 매칭:
                    텍스트(라벨/제목/subtitle) vertical-center + 페이지네이션은 subtitle
                    바로 아래에 작은 간격으로 붙임 (기존 hero 하단 멀리 배치 → 변경). */}
                {showOverlay && (
                    <div className="absolute inset-y-0 left-4 md:left-8 lg:left-12 flex flex-col justify-center text-white max-w-md md:max-w-lg z-10">
                        <p className="text-xs md:text-sm tracking-[0.2em] uppercase opacity-90 mb-3 md:mb-4">
                            {defaultOverlay.label}
                        </p>
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">
                            {defaultOverlay.title}
                        </h1>
                        <p className="mt-3 md:mt-5 text-xs md:text-sm opacity-80 leading-relaxed">
                            {defaultOverlay.subtitle}
                        </p>
                        {/* 페이지네이션 + 화살표 — subtitle 바로 아래 (간격 작게) */}
                        {total > 1 && (
                            <div className="mt-5 md:mt-6">
                                <SlideIndicator
                                    index={index}
                                    total={total}
                                    onPrev={() => go(-1)}
                                    onNext={() => go(1)}
                                    onPick={(i) => setIndex(i)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 풀이미지 모드(showOverlay=false): 페이지네이션을 우하단 유지 */}
                {!showOverlay && total > 1 && (
                    <div className="absolute right-4 md:right-8 lg:right-12 bottom-3 md:bottom-5 z-10">
                        <SlideIndicator
                            index={index}
                            total={total}
                            onPrev={() => go(-1)}
                            onNext={() => go(1)}
                            onPick={(i) => setIndex(i)}
                        />
                    </div>
                )}

                {/* 현재 슬라이드 링크 영역 — 우측 빈 공간 클릭으로 이동 (오버레이 모드에서만) */}
                {showOverlay && slides[index].href !== "#" && (
                    <Link
                        href={slides[index].href}
                        aria-label="현재 슬라이드 자세히 보기"
                        className="absolute right-0 top-0 h-full w-1/2 z-0"
                    />
                )}

                {/* 풀이미지 모드: 전체 클릭 영역 */}
                {!showOverlay && slides[index].href !== "#" && (
                    <Link
                        href={slides[index].href}
                        aria-label="슬라이드 링크"
                        className="absolute inset-0 z-0"
                    />
                )}
            </div>

            {/* 시안 214:17932: TrustBadges 등 Hero 하단에 absolute 로 박히는 슬롯.
                Hero 이미지가 뒤에 비치고, 슬롯 자체는 반투명 다크 배경 (TrustBadges 내부 처리). */}
            {children && (
                <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
                    <div className="pointer-events-auto">
                        {children}
                    </div>
                </div>
            )}
        </section>
    );
}

/**
 * "01 ─── 05" 진행 인디케이터 + 좌/우 원형 화살표
 *  - 시안: 좌측 정렬, 흰색 톤, 가는 진행바 + 짙은 트랙
 *  - total = 1 이면 화살표 숨김 (정적 fallback 케이스)
 */
function SlideIndicator({
    index,
    total,
    onPrev,
    onNext,
    onPick,
}: {
    index: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
    onPick: (i: number) => void;
}) {
    const progress = total > 1 ? (index / (total - 1)) * 100 : 0;
    return (
        <div className="flex items-center gap-3 md:gap-4 text-white">
            {/* 진행바 트랙 + 채워진 영역 */}
            <div className="flex items-center gap-3 select-none">
                <span className="text-xs md:text-sm tabular-nums font-medium opacity-90">
                    {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative h-px w-24 md:w-32 bg-white/30">
                    <div
                        className="absolute inset-y-0 left-0 bg-white transition-[width] duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                    {/* 클릭 가능한 슬라이드 마커 (접근성) */}
                    {total > 1 && (
                        <div className="absolute inset-0 flex justify-between">
                            {Array.from({ length: total }, (_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`슬라이드 ${i + 1}로 이동`}
                                    aria-current={i === index}
                                    onClick={() => onPick(i)}
                                    className="w-3 h-3 -mt-1.5 rounded-full hover:bg-white/40"
                                />
                            ))}
                        </div>
                    )}
                </div>
                <span className="text-xs md:text-sm tabular-nums opacity-60">
                    {String(total).padStart(2, "0")}
                </span>
            </div>

            {/* 좌/우 원형 화살표 — 시안의 outline 스타일 */}
            {total > 1 && (
                <div className="flex items-center gap-1.5 md:gap-2 ml-2">
                    <button
                        type="button"
                        aria-label="이전 슬라이드"
                        onClick={onPrev}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/50 hover:border-white hover:bg-white/10 flex items-center justify-center transition"
                    >
                        <ArrowLeft />
                    </button>
                    <button
                        type="button"
                        aria-label="다음 슬라이드"
                        onClick={onNext}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/50 hover:border-white hover:bg-white/10 flex items-center justify-center transition"
                    >
                        <ArrowRight />
                    </button>
                </div>
            )}
        </div>
    );
}

const DESIGN_DEFAULT_OVERLAY = {
    label: "New Arrival",
    title: (
        <>
            새로워진 엘프바를
            <br />
            가장 먼저 만나보세요
        </>
    ),
    subtitle: "더 강력해진 맛과 비프, 새로운 경험의 시작",
};

function ArrowLeft() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-white">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}
function ArrowRight() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-white">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}
