"use client";

import Link from "next/link";
import { useState } from "react";
import { Lightbox } from "@/components/Lightbox";

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
                <header className="flex items-end justify-between mb-6">
                    <div>
                        <p className="text-xs text-[var(--color-fg-muted)] mb-1">Best Review</p>
                        <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">베스트 제품 후기</h2>
                    </div>
                    <nav className="flex gap-2" aria-label="베스트 후기 캐러셀">
                        <ReviewArrow direction="prev" />
                        <ReviewArrow direction="next" />
                    </nav>
                </header>

                <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {reviews.map((r, i) => (
                        <ReviewCard key={i} review={r} onPhotoClick={(e) => openLightbox(i, e)} />
                    ))}
                </ul>
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
    return (
        <li className="flex h-full">
            <Link href="/c/best" className="flex flex-col w-full h-full">
                {/* 사진 박스 — 1:1 + object-fit cover (Shopify Dawn / Amazon 표준).
                    클릭 시 Lightbox 로 원본 풀 사이즈 보기 (텍스트 영역 클릭은 /c/best 로 이동). */}
                <button
                    type="button"
                    aria-label={`${review.product} 사진 크게 보기`}
                    onClick={onPhotoClick}
                    className="w-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#7c5cff)] rounded-[18px]"
                    style={{
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        borderRadius: 18,
                        backgroundColor: isColor ? review.photo : undefined,
                        flexShrink: 0,
                        cursor: "zoom-in",
                    }}
                >
                    {!isColor && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={review.photo}
                            alt={review.product}
                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                            draggable={false}
                        />
                    )}
                </button>

                <div className="mt-4 flex flex-col flex-1 space-y-2">
                    <div className="flex items-center gap-1 text-xs">
                        <RatingStars rating={review.rating} />
                        <span className="text-[var(--color-fg)] font-medium">{review.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-fg)] leading-relaxed line-clamp-5">{review.review}</p>
                    <p className="text-[11px] text-[var(--color-fg-muted)] flex items-center gap-1.5">
                        <span>{review.author}</span>
                        <span>|</span>
                        <span>{review.date}</span>
                    </p>
                    <div className="mt-auto pt-2 border-t border-[var(--color-border)] flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={review.productThumb}
                            alt=""
                            className="w-8 h-8 rounded object-cover bg-[var(--color-bg-subtle)] flex-shrink-0"
                        />
                        <p className="text-[11px] text-[var(--color-fg)] line-clamp-2 flex-1 min-w-0">{review.product}</p>
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

function ReviewArrow({ direction }: { direction: "prev" | "next" }) {
    return (
        <button
            type="button"
            aria-label={direction === "prev" ? "이전" : "다음"}
            className="w-12 h-12 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)] transition"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {direction === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
            </svg>
        </button>
    );
}
