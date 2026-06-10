"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";

type Review = {
    id: number;
    productId: number;
    memberId: number;
    rating: number;
    content: string | null;
    hasPhoto: boolean;
    pointRewarded: boolean;
    createdAt: string;
};

type Page<T> = { content: T[]; totalElements: number };

function ReviewWriteCta() {
    const { user } = useAuth();
    return (
        <Link
            href={user ? "/mypage" : "/login?redirect=/mypage"}
            className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] underline"
            title="배송 완료된 주문에서 작성 가능합니다"
        >
            리뷰 작성하기 →
        </Link>
    );
}

function StarRow({ rating }: { rating: number }) {
    return (
        <>
            {[0, 1, 2, 3, 4].map(i => (
                <svg key={i} width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                        fill={i < Math.round(rating) ? "#F3C836" : "#DDDDDD"}
                    />
                </svg>
            ))}
        </>
    );
}

function ChevronDown() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ProductReviews({ productId }: { productId: number }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api<Page<Review>>(`/api/v1/public/products/${productId}/reviews?size=10`)
            .then(p => { setReviews(p.content); setTotal(p.totalElements); })
            .catch(() => { /* ignore */ })
            .finally(() => setLoading(false));
    }, [productId]);

    return (
        <section>
            <div className="flex items-end justify-between mb-3">
                <h2 className="text-lg font-semibold text-[var(--color-fg)]">
                    리뷰 {total > 0 && <span className="text-[var(--color-fg-muted)] text-sm font-normal">({total})</span>}
                </h2>
                <ReviewWriteCta />
            </div>

            {/* Filter row (visual only — no filter state exists yet) */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3">
                    <button type="button" className="px-4 py-3 rounded-[4px] bg-[#0072DD] text-white text-[14px] font-medium">
                        카테고리
                    </button>
                    <button type="button" className="px-4 py-3 rounded-[4px] border border-[#DDDDDD] text-[#000] text-[14px] font-medium">
                        카테고리
                    </button>
                    <button type="button" className="px-4 py-3 rounded-[4px] border border-[#DDDDDD] text-[#000] text-[14px] font-medium">
                        카테고리
                    </button>
                </div>
                <div className="flex gap-3">
                    <div className="w-[260px] p-4 rounded-[4px] border border-[#DDDDDD] bg-white flex justify-between items-center">
                        <span className="text-[14px] font-light text-[#767676]">전체카테고리</span>
                        <ChevronDown />
                    </div>
                    <div className="w-[150px] p-4 rounded-[4px] border border-[#DDDDDD] bg-white flex justify-between items-center">
                        <span className="text-[14px] font-light text-[#767676]">별점</span>
                        <ChevronDown />
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-[var(--color-fg-subtle)]">불러오는 중...</p>
            ) : reviews.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-8 rounded-[var(--radius-lg)]">
                    아직 리뷰가 없습니다.
                </p>
            ) : (
                <div className="border-t border-[#222]">
                    {reviews.map(r => (
                        <div
                            key={r.id}
                            className={`py-7 border-b border-[#DDDDDD] flex flex-col ${r.hasPhoto ? "gap-5" : "gap-3"}`}
                        >
                            <div className="flex items-center gap-2">
                                <StarRow rating={r.rating} />
                                <span className="text-[14px] font-medium text-[#000]">회원{r.memberId}</span>
                                <span className="w-px h-[12px] bg-[#DDDDDD]" />
                                <span className="text-[14px] font-light text-[#767676]">{formatDate(r.createdAt)}</span>
                            </div>
                            {r.content && (
                                <p className="text-[16px] font-light text-[#767676] leading-[24px] max-w-[860px] whitespace-pre-line">
                                    {r.content}
                                </p>
                            )}
                            {r.hasPhoto && (
                                <div className="flex gap-1">
                                    <div className="w-[118px] h-[118px] rounded-[4px] bg-[#F6F7FB] flex items-center justify-center text-[11px] text-[#767676]">
                                        📷 포토
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
