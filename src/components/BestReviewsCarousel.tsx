"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { useGated, useAdultGate } from "@/components/AdultGate";
import { wrapScroll } from "@/lib/scroll";

/**
 * 베스트 후기 4 카드 + Lightbox.
 *
 *  - 메인 그리드: thumbnail (800x800 1:1 cover)
 *  - 카드의 사진 박스 클릭 → Lightbox 모달 (원본 풀 사이즈)
 *  - 사진 외 카드 영역 (텍스트, 상품줄) 클릭 → /c/best 페이지로 이동
 *  - 4 사진 사이 좌/우 화살표 navigate
 *
 * 운영 흐름: 후기 API 에서 받은 photos[] = [{url, thumbnailUrl}] 형식.
 * 현재는 review.photo (단일) + review.original (옵션) 로 mock.
 */
export type ReviewMock = {
    photo: string;        // thumbnail URL (800x800)
    original?: string;    // 원본 URL (lightbox 용). 없으면 photo 그대로.
    rating: number;
    review: string;
    author: string;
    date: string;
    product: string;
    productThumb: string;
};

export function BestReviewsCarousel({ reviews }: { reviews: ReviewMock[] }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const scrollRef = useRef<HTMLUListElement>(null);

    const lightboxImages = reviews.map(r => ({
        src: r.original ?? r.photo,
        alt: r.product,
    }));

    function openLightbox(i: number, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        setLightboxIndex(i);
        setLightboxOpen(true);
    }

    return (
        <>
            <section id="best-reviews" className="scroll-mt-24">
                <header className="flex items-end justify-between mb-4 md:mb-8">
                    <div className="flex flex-col gap-1 md:gap-2">
                        <p className="text-[14px] md:text-[18px] leading-none text-[#767676]">Best Review</p>
                        <h2 className="text-[20px] md:text-[36px] font-bold leading-tight text-[#000]">베스트 제품 후기</h2>
                    </div>
                    <nav className="flex gap-2 md:gap-3" aria-label="베스트 후기 캐러셀">
                        <ReviewArrow direction="prev" onClick={() => wrapScroll(scrollRef.current, -1)} />
                        <ReviewArrow direction="next" onClick={() => wrapScroll(scrollRef.current, 1)} />
                    </nav>
                </header>

                <ul ref={scrollRef} className="flex gap-3 md:gap-7 overflow-x-auto snap-x scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {reviews.map((r, i) => (
                        <ReviewCard key={i} review={r} onPhotoClick={(e) => openLightbox(i, e)} />
                    ))}
                </ul>

                {/* 모바일(Figma 670-13600): 후기 아래 풀폭 더 알아보기 */}
                <Link href="/reviews" className="md:hidden mt-7 flex h-11 w-full items-center justify-center rounded-[4px] border border-[#DDD] bg-white text-[13px] font-medium text-[#000]">
                    더 알아보기
                </Link>
            </section>

            <Lightbox
                open={lightboxOpen}
                images={lightboxImages}
                index={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
                onChange={setLightboxIndex}
            />
        </>
    );
}

function ReviewCard({ review, onPhotoClick }: { review: ReviewMock; onPhotoClick: (e: React.MouseEvent) => void }) {
    const isColor = review.photo.startsWith("#");
    const gated = useGated();
    const { openGate } = useAdultGate();
    return (
        <li className="flex h-full shrink-0 snap-start w-[calc((100%-12px)/2)] sm:w-[44%] lg:w-[calc((100%-84px)/4)]">
            <Link href="/reviews/best" className="flex flex-col w-full h-full">
                {/* 사진 박스 — 비회원은 블러+자물쇠(클릭 시 성인인증), 회원은 Lightbox 원본 보기. */}
                <button
                    type="button"
                    aria-label={gated ? "성인인증 후 확인 가능" : `${review.product} 사진 크게 보기`}
                    onClick={gated ? (e) => { e.preventDefault(); e.stopPropagation(); openGate(); } : onPhotoClick}
                    className="relative w-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#7c5cff)] rounded-[12px]"
                    style={{
                        aspectRatio: "374 / 448",
                        overflow: "hidden",
                        borderRadius: 12,
                        backgroundColor: isColor ? review.photo : undefined,
                        flexShrink: 0,
                        cursor: gated ? "pointer" : "zoom-in",
                    }}
                >
                    {!isColor && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={review.photo}
                            alt={review.product}
                            className={gated ? "blur-lg" : undefined}
                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                            draggable={false}
                        />
                    )}
                    {gated && (
                        <span className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/25 text-white" aria-hidden="true">
                            <span className="text-xl">🔒</span>
                            <span className="text-[10px] font-semibold drop-shadow">성인인증 후 확인</span>
                        </span>
                    )}
                </button>

                <div className="mt-2 md:mt-4 flex flex-col flex-1 gap-2 md:gap-3">
                    {/* 평점 — ★ + 5.0 (모바일 14 / 데스크탑 18) */}
                    <div className="flex items-center gap-2">
                        <RatingStars rating={review.rating} />
                        <span className="text-[14px] md:text-[18px] font-medium leading-none text-[#000]">{review.rating.toFixed(1)}</span>
                    </div>
                    {/* 후기 텍스트 13/14 */}
                    <p className="text-[13px] md:text-[14px] leading-relaxed text-[#767676] line-clamp-3">{review.review}</p>
                    {/* 작성자 | 날짜 13/14 */}
                    <p className="flex items-center gap-1.5 text-[13px] md:text-[14px] text-[#767676]">
                        <span>{review.author}</span>
                        <span className="text-[var(--color-border-strong)]">|</span>
                        <span>{review.date}</span>
                    </p>
                    {/* 제품 — 썸네일 + 타이틀 14/500 */}
                    <div className="mt-auto flex items-center gap-3 pt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={review.productThumb}
                            alt=""
                            className="h-10 w-10 flex-shrink-0 rounded-lg bg-[var(--color-bg-subtle)] object-cover"
                        />
                        <p className="min-w-0 flex-1 text-[14px] font-medium text-[#000] line-clamp-2">{review.product}</p>
                    </div>
                </div>
            </Link>
        </li>
    );
}

function RatingStars({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.25 && rating - full < 0.75;
    const empty = 5 - full - (half ? 1 : 0);
    return (
        <span className="inline-flex items-center" aria-label={`별점 ${rating} / 5`}>
            <span className="text-yellow-400 tracking-tight">{"★".repeat(full)}</span>
            {half && (
                <span className="relative tracking-tight">
                    <span className="text-[var(--color-border-strong,#d4d4d4)]">★</span>
                    <span className="absolute inset-0 overflow-hidden text-yellow-400" style={{ width: "50%" }}>★</span>
                </span>
            )}
            <span className="text-[var(--color-border-strong,#d4d4d4)] tracking-tight">{"★".repeat(empty)}</span>
        </span>
    );
}

function ReviewArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={direction === "prev" ? "이전" : "다음"}
            className="w-12 h-12 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)] transition"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {direction === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
            </svg>
        </button>
    );
}
