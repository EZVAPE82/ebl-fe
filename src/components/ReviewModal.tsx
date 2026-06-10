"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReviewVM } from "./ReviewerListClient";

/**
 * 리뷰 후기 팝업 — Figma "리뷰 후기 팝업" 시안 매칭.
 *
 *  - LEFT: 후기 대표 사진(정사각, 회색 fallback)
 *  - RIGHT TOP: 별점 + 작성자/날짜 + 구분선 + 후기 전문
 *  - RIGHT BOTTOM: "이 상품의 다른 리뷰" 썸네일 스트립
 *      → 같은 상품(productTitle 매칭) 리뷰 우선, 없으면 그 외 리뷰로 채움
 *      → 썸네일 클릭 시 해당 리뷰로 본문 교체(사진/별점/작성자/날짜/텍스트)
 *  - 닫기: 배경 클릭 / X 버튼 / ESC
 *  - 열려있는 동안 body scroll lock
 *
 * 사용법(ReviewerListClient):
 *  const [selected, setSelected] = useState<ReviewVM | null>(null);
 *  {selected && <ReviewModal review={selected} reviews={reviews} onClose={() => setSelected(null)} />}
 */
export function ReviewModal({
    review,
    reviews,
    onClose,
}: {
    review: ReviewVM;
    reviews: ReviewVM[];
    onClose: () => void;
}) {
    // 모달 내부에서 썸네일로 교체되는 "현재 보고있는 리뷰".
    const [active, setActive] = useState<ReviewVM>(review);
    const stripRef = useRef<HTMLDivElement>(null);

    // 부모가 다른 카드를 열면(selected 교체) 동기화.
    useEffect(() => { setActive(review); }, [review]);

    // ESC 닫기.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // 열려있는 동안 body scroll lock.
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // "이 상품의 다른 리뷰" — 같은 상품(productTitle) 우선, 부족하면 그 외로 보충.
    // 현재 active 리뷰 자신은 제외.
    const otherReviews = useMemo(() => {
        const rest = reviews.filter((r) => r.id !== active.id);
        const sameProduct = rest.filter(
            (r) => r.productTitle && r.productTitle === active.productTitle
        );
        const seen = new Set(sameProduct.map((r) => r.id));
        const others = rest.filter((r) => !seen.has(r.id));
        return [...sameProduct, ...others];
    }, [reviews, active.id, active.productTitle]);

    function scrollStrip(delta: number) {
        stripRef.current?.scrollBy({ left: delta, behavior: "smooth" });
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="후기 상세 보기"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[1280px] max-h-[90vh] overflow-y-auto bg-white rounded-[16px] p-10 flex flex-col md:flex-row gap-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* LEFT — 대표 사진 (회색 fallback) */}
                {active.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={active.photo}
                        alt=""
                        className="w-full md:w-[580px] md:h-[580px] aspect-square rounded-[16px] object-cover bg-[#D9D9D9] shrink-0"
                        draggable={false}
                    />
                ) : (
                    <div className="w-full md:w-[580px] md:h-[580px] aspect-square rounded-[16px] bg-[#D9D9D9] shrink-0" />
                )}

                {/* RIGHT */}
                <div className="flex-1 flex flex-col justify-between gap-8">
                    {/* TOP */}
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4">
                            {/* 별점 행 + 닫기 */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <ModalStars rating={active.rating} />
                                    <span className="text-[24px] font-medium text-[#000]">
                                        {active.rating.toFixed(1)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    aria-label="닫기"
                                    onClick={onClose}
                                    className="shrink-0 flex items-center justify-center"
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* 작성자 / 날짜 */}
                            <div className="flex justify-between items-end">
                                <span className="text-[20px] font-medium text-[#000]">
                                    {active.author}
                                </span>
                                <span className="text-[14px] text-[#767676]">
                                    {active.date}
                                </span>
                            </div>
                        </div>

                        {/* 구분선 */}
                        <div className="h-px bg-[#E5E5EC]" />

                        {/* 후기 전문 */}
                        <p className="text-[16px] text-[#767676] leading-6 whitespace-pre-line">
                            {active.text}
                        </p>
                    </div>

                    {/* BOTTOM — 이 상품의 다른 리뷰 */}
                    {otherReviews.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[16px] font-medium text-[#222222]">
                                    이 상품의 다른 리뷰
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label="이전 리뷰 보기"
                                        onClick={() => scrollStrip(-240)}
                                        className="shrink-0 flex items-center justify-center text-[#222222]"
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="다음 리뷰 보기"
                                        onClick={() => scrollStrip(240)}
                                        className="shrink-0 flex items-center justify-center text-[#222222]"
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div
                                ref={stripRef}
                                className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {otherReviews.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setActive(r)}
                                        aria-label={`${r.author} 후기 보기`}
                                        className="shrink-0"
                                    >
                                        {r.photo ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={r.photo}
                                                alt=""
                                                className="w-[118px] h-[118px] rounded-[4px] object-cover shrink-0 bg-[#D9D9D9]"
                                                loading="lazy"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="w-[118px] h-[118px] rounded-[4px] shrink-0 bg-[#D9D9D9]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* 5개 별 SVG 30px — rating 으로 채움/비움 */
function ModalStars({ rating }: { rating: number }) {
    const rounded = Math.round(rating);
    return (
        <span className="inline-flex items-center gap-1" aria-label={`별점 ${rating} / 5`}>
            {Array.from({ length: 5 }, (_, i) => (
                <svg
                    key={i}
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill={i < rounded ? "#F3C836" : "#DDDDDD"}
                    aria-hidden="true"
                >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            ))}
        </span>
    );
}
