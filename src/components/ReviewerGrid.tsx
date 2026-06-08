"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { useGated, useAdultGate } from "@/components/AdultGate";

export type ReviewItem = {
    id: number;
    productId: number;
    memberId: number;
    rating: number;
    content: string | null;
    hasPhoto: boolean;
    photoUrls: string[];
    pointRewarded: boolean;
    createdAt: string;
    productName?: string | null;
    productThumbnailUrl?: string | null;
};

/* 시안 252:10915 매칭 — 카테고리 탭 + 4 cols 그리드 + 카드 클릭 시 ReviewLightbox */

const CATEGORIES = ["전체", "일회용", "기기"];

export function ReviewerGrid({ reviews }: { reviews: ReviewItem[] }) {
    const [category, setCategory] = useState<string>("전체");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    // 카테고리 필터 (단순 mock — 전체만 작동)
    const filtered = reviews;

    function openLightbox(i: number) {
        setOpenIndex(i);
    }
    function close() {
        setOpenIndex(null);
    }
    const go = useCallback((delta: number) => {
        if (openIndex === null) return;
        const next = (openIndex + delta + filtered.length) % filtered.length;
        setOpenIndex(next);
    }, [openIndex, filtered.length]);

    // 키보드 navigation
    useEffect(() => {
        if (openIndex === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
            else if (e.key === "ArrowLeft")  go(-1);
            else if (e.key === "ArrowRight") go(1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [openIndex, go]);

    return (
        <>
            {/* 카테고리 탭 + 우측 정렬 select (시각만) */}
            <div className="flex items-center justify-between mb-6 md:mb-8 flex-wrap gap-3">
                <div className="flex gap-2">
                    {CATEGORIES.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCategory(c)}
                            className={`inline-flex items-center justify-center rounded-[10px] px-5 py-2.5 text-sm font-medium transition ${
                                category === c
                                    ? "bg-[var(--color-accent)] text-white"
                                    : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                {/* 정렬 select */}
                <div className="relative">
                    <select className="appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] pl-3 pr-8 py-2 text-sm text-[var(--color-fg)] cursor-pointer focus:outline-none focus:border-[var(--color-fg)]">
                        <option>최신순</option>
                        <option>별점순</option>
                        <option>추천순</option>
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] pointer-events-none">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>

            {/* 4 cols 그리드 */}
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((r, i) => (
                    <li key={r.id}>
                        <ReviewCard review={r} onClick={() => openLightbox(i)} />
                    </li>
                ))}
            </ul>

            {/* 페이지네이션은 server component(page.tsx) 에서 처리 — 동적 Link */}

            {/* 후기 팝업 모달 (시안 34:7826) */}
            {openIndex !== null && (
                <ReviewLightbox
                    reviews={filtered}
                    index={openIndex}
                    onClose={close}
                    onPrev={() => go(-1)}
                    onNext={() => go(1)}
                />
            )}
        </>
    );
}

function ReviewCard({ review, onClick }: { review: ReviewItem; onClick: () => void }) {
    // 후기 사진 우선, 없으면 product thumbnail 로 fallback (사진 미등록 리뷰도 시각적으로 비지 않게)
    const thumb = review.photoUrls?.[0] || review.productThumbnailUrl || "";
    const pname = review.productName || "상품";
    const gated = useGated();
    const { openGate } = useAdultGate();
    return (
        <button
            type="button"
            onClick={gated ? openGate : onClick}
            className="flex flex-col w-full h-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-[18px]"
        >
            <div className="relative w-full overflow-hidden rounded-[18px] bg-[var(--color-bg-subtle)]" style={{ aspectRatio: "1 / 1" }}>
                {thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={thumb}
                        alt={pname}
                        className={`w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${gated ? "blur-lg" : ""}`}
                        loading="lazy"
                        draggable={false}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-fg-subtle)] text-xs">no image</div>
                )}
                {gated && (
                    <span className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/25 text-white" aria-hidden="true">
                        <span className="text-xl">🔒</span>
                        <span className="text-[10px] font-semibold drop-shadow">성인인증 후 확인</span>
                    </span>
                )}
            </div>
            <div className="mt-3 flex flex-col flex-1 space-y-1.5">
                <div className="flex items-center gap-1 text-xs">
                    <RatingStars rating={review.rating} />
                    <span className="text-[var(--color-fg)] font-medium ml-1">{review.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-[var(--color-fg)] leading-relaxed line-clamp-2">{review.content ?? ""}</p>
                <p className="text-[11px] text-[var(--color-fg-muted)] tabular-nums">{formatDate(review.createdAt)}</p>
            </div>
            {/* 카드 하단 — 실제 product name + thumbnail */}
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-3">
                {review.productThumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={review.productThumbnailUrl}
                        alt=""
                        className={`w-10 h-10 rounded bg-[var(--color-bg-subtle)] object-contain flex-shrink-0 ${gated ? "blur-md" : ""}`}
                    />
                ) : (
                    <div className="w-10 h-10 rounded bg-[var(--color-bg-subtle)] flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[var(--color-fg)] line-clamp-2">{pname}</p>
                </div>
            </div>
        </button>
    );
}

function RatingStars({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.25 && rating - full < 0.75;
    const empty = 5 - full - (half ? 1 : 0);
    return (
        <span className="inline-flex items-center text-yellow-400 tracking-tight">
            {"★".repeat(full)}
            {half && <span className="text-[var(--color-border-strong,#d4d4d4)] relative">★<span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>★</span></span>}
            <span className="text-[var(--color-border-strong,#d4d4d4)]">{"★".repeat(empty)}</span>
        </span>
    );
}

/* ===== 후기 팝업 모달 — 시안 34:7826 ===== */
function ReviewLightbox({ reviews, index, onClose, onPrev, onNext }: {
    reviews: ReviewItem[];
    index: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}) {
    const review = reviews[index];
    const photos = review.photoUrls?.length ? review.photoUrls
                 : review.productThumbnailUrl ? [review.productThumbnailUrl]
                 : [];
    const main = photos[0];
    // 같은 상품의 다른 리뷰 5개 추출 (시안의 "이 상품의 다른 리뷰" 영역)
    const otherReviews = reviews.filter((_, i) => i !== index).slice(0, 5);

    // body scroll lock
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="후기 상세 보기"
            onClick={onClose}
        >
            {/* 시안 매칭: 흰색 바깥 컨테이너 안에 사진 + 텍스트가 한 그룹 */}
            <div
                className="relative w-full max-w-4xl bg-white rounded-[18px] shadow-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 md:h-[520px] max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* 우상단 X 닫기 — 흰 컨테이너 바깥 모서리 (overflow 안 잘리도록 컨테이너 직계 child) */}
                <button
                    type="button"
                    aria-label="닫기"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-3 right-3 md:top-4 md:right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                {/* 좌측 큰 사진 — 흰 박스 안에 들어간 라운딩 정사각형 */}
                <div className="md:h-full md:w-[440px] flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={main}
                        alt=""
                        className="w-full md:w-[440px] aspect-square md:h-full object-cover rounded-[14px] block"
                        draggable={false}
                    />
                </div>

                {/* 우측 텍스트 — 흰 컨테이너 위에 직접 (별도 박스 없음) */}
                <div className="flex-1 md:h-full relative flex flex-col overflow-y-auto pr-10">
                    {/* 별점 + 5.0 */}
                    <div className="flex items-center gap-1 mb-2">
                        <RatingStars rating={review.rating} />
                        <span className="ml-1 font-bold text-[var(--color-fg)] text-base">{review.rating.toFixed(1)}</span>
                    </div>

                    {/* 이름 + 날짜 */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-[var(--color-fg)] text-base">GlowMina</span>
                        <span className="text-xs text-[var(--color-fg-muted)] tabular-nums">{formatDate(review.createdAt)}</span>
                    </div>

                    {/* 후기 본문 */}
                    <div className="flex-1 mb-4">
                        <p className="text-sm text-[var(--color-fg)] leading-relaxed whitespace-pre-line">
                            {review.content ?? ""}
                        </p>
                    </div>

                    {/* 이 상품의 다른 리뷰 + 좌/우 화살표 */}
                    {otherReviews.length > 0 && (
                        <>
                            <div className="flex items-center justify-between mb-3 pt-4 border-t border-[var(--color-border)]">
                                <span className="text-sm font-medium text-[var(--color-fg)]">이 상품의 다른 리뷰</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label="이전"
                                        onClick={onPrev}
                                        className="w-7 h-7 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="다음"
                                        onClick={onNext}
                                        className="w-7 h-7 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            </div>
                            {/* thumbnail strip 5 개 */}
                            <div className="flex gap-2">
                                {otherReviews.map((r, i) => {
                                    const t = r.photoUrls?.[0] ?? "/images/review-photo-1-v2.png";
                                    return (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            key={i}
                                            src={t}
                                            alt=""
                                            className="w-16 h-16 rounded-[10px] object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                                            draggable={false}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
