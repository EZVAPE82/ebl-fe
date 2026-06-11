"use client";

import { useMemo, useState } from "react";
import { ReviewModal } from "./ReviewModal";

/**
 * REVIEWER 리스트 — Figma REVIEWER 시안 매칭.
 *
 * 데이터는 server(page.tsx)에서 /api/v1/public/reviews/best 로 받아 ReviewVM[] 으로
 * 매핑해 내려준다(없으면 page.tsx 가 mock fallback 주입). 이 컴포넌트는 정렬/필터/
 * 페이지네이션 같은 인터랙션만 담당한다.
 *
 *  - 정렬 탭(최신순/별점순/추천순): sort state 토글 → active 스타일 + 재정렬
 *  - 카테고리/별점 드롭다운: 시각 shell (필터 미와이어 — 시안 정합용)
 *  - 페이지네이션: 12개 초과 시 client paging (compact + 말줄임 + 다음 chevron)
 */

export type ReviewVM = {
    id: number | string;
    photo: string | null;     // 후기 사진 URL. 없으면 회색 fallback.
    rating: number;           // 0~5
    text: string;
    author: string;
    date: string;             // YYYY.MM.DD
    productTitle: string;
    productSubtitle: string;
    productThumb: string | null;
    // 정렬 기준값 (server에서 계산해 내려줌)
    sortDate: number;         // createdAt epoch ms (최신순)
    recommend: number;        // 추천 가중치 (추천순)
};

type Sort = "newest" | "rating" | "recommended";

const PAGE_SIZE = 12;

const SORT_TABS: { key: Sort; label: string }[] = [
    { key: "newest", label: "최신순" },
    { key: "rating", label: "별점순" },
    { key: "recommended", label: "추천순" },
];

export function ReviewerListClient({ reviews }: { reviews: ReviewVM[] }) {
    const [sort, setSort] = useState<Sort>("newest");
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<ReviewVM | null>(null);

    const sorted = useMemo(() => {
        const arr = [...reviews];
        if (sort === "rating") {
            arr.sort((a, b) => b.rating - a.rating || b.sortDate - a.sortDate);
        } else if (sort === "recommended") {
            arr.sort((a, b) => b.recommend - a.recommend || b.sortDate - a.sortDate);
        } else {
            arr.sort((a, b) => b.sortDate - a.sortDate);
        }
        return arr;
    }, [reviews, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

    function changeSort(next: Sort) {
        setSort(next);
        setPage(0);
    }

    return (
        <div className="w-full flex flex-col gap-7">
            {/* 1) 헤더 블록 */}
            <div className="w-full flex flex-col gap-8">
                <h1 className="text-[40px] md:text-[56px] font-bold leading-tight text-[#222222]">
                    REVIEWER
                </h1>

                {/* 컨트롤 행 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* LEFT — 정렬 탭 (wired) */}
                    <div className="flex gap-3">
                        {SORT_TABS.map((t) => {
                            const active = sort === t.key;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => changeSort(t.key)}
                                    aria-pressed={active}
                                    className={
                                        active
                                            ? "px-4 py-3 rounded-[4px] bg-[#0072DD] text-white text-[14px] font-medium"
                                            : "px-4 py-3 rounded-[4px] border border-[#DDDDDD] text-[14px] font-medium text-[#000]"
                                    }
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* RIGHT — 필터 드롭다운 shell (시각) */}
                    <div className="flex gap-3">
                        <div className="w-[260px] p-4 rounded-[4px] border border-[#E5E5EC] bg-white flex justify-between items-center">
                            <span className="text-[14px] font-light text-[#767676]">전체카테고리</span>
                            <ChevronDown />
                        </div>
                        <div className="w-[150px] p-4 rounded-[4px] border border-[#E5E5EC] bg-white flex justify-between items-center">
                            <span className="text-[14px] font-light text-[#767676]">별점</span>
                            <ChevronDown />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2) 리뷰 그리드 / 빈 상태 */}
            {pageItems.length === 0 ? (
                <p className="w-full py-24 text-center text-[14px] text-[#767676]">
                    등록된 후기가 없습니다.
                </p>
            ) : (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12">
                    {pageItems.map((r) => (
                        <ReviewCard key={r.id} review={r} onOpen={() => setSelected(r)} />
                    ))}
                </div>
            )}

            {/* 3) 페이지네이션 (목록이 페이징될 때만) */}
            {totalPages > 1 && (
                <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onChange={setPage}
                />
            )}

            {/* 4) 후기 상세 팝업 — 카드 클릭 시 오픈 */}
            {selected && (
                <ReviewModal
                    review={selected}
                    reviews={sorted}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}

function ReviewCard({ review, onOpen }: { review: ReviewVM; onOpen: () => void }) {
    return (
        <article
            role="button"
            tabIndex={0}
            aria-label={`${review.author} 후기 자세히 보기`}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen();
                }
            }}
            className="flex flex-col gap-4 cursor-pointer text-left rounded-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072DD]"
        >
            {/* 후기 사진 — 회색 fallback */}
            {review.photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={review.photo}
                    alt=""
                    className="w-full aspect-[374/448] rounded-[12px] object-cover bg-[#D9D9D9]"
                    loading="lazy"
                    draggable={false}
                />
            ) : (
                <div className="w-full aspect-[374/448] rounded-[12px] bg-[#D9D9D9]" />
            )}

            {/* 내용 */}
            <div className="flex flex-col gap-3">
                {/* 별점 행 */}
                <div className="flex items-center gap-2">
                    <Stars rating={review.rating} />
                    <span className="text-[18px] font-medium text-[#000]">
                        {review.rating.toFixed(1)}
                    </span>
                </div>

                {/* 후기 텍스트 */}
                <p className="text-[14px] text-[#767676] line-clamp-3">{review.text}</p>

                {/* 작성자 / 날짜 */}
                <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#000]">{review.author}</span>
                    <span className="text-[14px] text-[#767676]">{review.date}</span>
                </div>

                {/* 상품 미니 카드 */}
                <div className="flex items-center gap-2.5">
                    {review.productThumb ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={review.productThumb}
                            alt=""
                            className="w-[56px] h-[67px] rounded-[4px] object-cover bg-[#F6F7FB]"
                            loading="lazy"
                            draggable={false}
                        />
                    ) : (
                        <div className="w-[56px] h-[67px] rounded-[4px] bg-[#F6F7FB]" />
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#000] line-clamp-1">
                            {review.productTitle}
                        </p>
                        <p className="text-[14px] text-[#767676] line-clamp-1">
                            {review.productSubtitle}
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}

/* 5개 별 SVG — rating 으로 채움/비움 */
function Stars({ rating }: { rating: number }) {
    const rounded = Math.round(rating);
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`별점 ${rating} / 5`}>
            {Array.from({ length: 5 }, (_, i) => (
                <svg
                    key={i}
                    width="20"
                    height="20"
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

function ChevronDown() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#222222"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function Pagination({
    page,
    totalPages,
    onChange,
}: {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
}) {
    const numbers = compactPages(page, totalPages);
    return (
        <nav className="flex items-center justify-center gap-1" aria-label="페이지네이션">
            {numbers.map((n, i) =>
                n === "ellipsis" ? (
                    <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-[14px] text-[#767676]">
                        …
                    </span>
                ) : (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        aria-current={n === page ? "page" : undefined}
                        className={
                            n === page
                                ? "w-8 h-8 rounded-[4px] text-[14px] font-medium bg-[#0072DD] text-white"
                                : "w-8 h-8 rounded-[4px] text-[14px] font-medium bg-white text-[#767676] hover:bg-[#F6F7FB]"
                        }
                    >
                        {n + 1}
                    </button>
                )
            )}
            {page < totalPages - 1 && (
                <button
                    type="button"
                    onClick={() => onChange(page + 1)}
                    aria-label="다음 페이지"
                    className="w-8 h-8 rounded-[4px] flex items-center justify-center bg-white text-[#767676] hover:bg-[#F6F7FB]"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            )}
        </nav>
    );
}

function compactPages(current: number, total: number): (number | "ellipsis")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const out: (number | "ellipsis")[] = [];
    const start = Math.max(0, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 0) {
        out.push(0);
        if (start > 1) out.push("ellipsis");
    }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) {
        if (end < total - 2) out.push("ellipsis");
        out.push(total - 1);
    }
    return out;
}
