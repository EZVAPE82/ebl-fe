import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const metadata = { title: "베스트 리뷰" };

type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number };
type ReviewView = {
    id: number;
    productId: number;
    memberId: number;
    rating: number;
    content: string | null;
    hasPhoto: boolean;
    photoUrls: string[];
    pointRewarded: boolean;
    createdAt: string;
};

async function fetchBest(): Promise<ReviewView[]> {
    try {
        const p = await api<Page<ReviewView>>("/api/v1/public/reviews/best?size=24", { cache: "no-store" });
        return p.content ?? [];
    } catch {
        return [];
    }
}

/**
 * BEST REVIEWER 페이지 — 별점 4+ / 사진 있는 것 우선 / 24개 그리드.
 * 통이미지(page-best-reviewer.png) 폐기 후 실제 컴포넌트로 재구현.
 */
export default async function BestReviewerPage() {
    const reviews = await fetchBest();

    return (
        <div className="bg-[var(--color-bg)] min-h-screen">
            <div className="mx-auto max-w-screen-2xl px-4 py-6 md:py-10">
                {/* 헤더 */}
                <header className="mb-6 md:mb-10">
                    <Link href="/" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                        ← 홈으로
                    </Link>
                    <div className="mt-3 md:mt-4">
                        <p className="text-xs md:text-sm text-[var(--color-fg-muted)]">Best Review</p>
                        <h1 className="mt-1 text-2xl md:text-3xl font-bold text-[var(--color-fg)]">
                            베스트 구매후기
                        </h1>
                        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
                            엘프바를 먼저 경험한 분들의 솔직한 후기를 확인해보세요.
                        </p>
                    </div>
                </header>

                {/* 본문 */}
                {reviews.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {reviews.map(r => (
                            <li key={r.id}>
                                <ReviewCard review={r} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ReviewCard({ review }: { review: ReviewView }) {
    const thumb = review.photoUrls?.[0];
    return (
        <Link href={`/p/${review.productId}`} className="flex flex-col h-full group">
            {/* 사진 박스 — 1:1 cover (사진 없으면 보라 그라데이션 placeholder) */}
            <div
                className="w-full overflow-hidden rounded-[18px]"
                style={{ aspectRatio: "1 / 1" }}
            >
                {thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center text-white/70 text-xs"
                        style={{ background: "linear-gradient(135deg, #d3bce8 0%, #b89cd6 100%)" }}
                        aria-hidden="true"
                    >
                        no photo
                    </div>
                )}
            </div>

            {/* 텍스트 */}
            <div className="mt-3 flex flex-col flex-1 space-y-2">
                <div className="flex items-center gap-1 text-xs">
                    <RatingStars rating={review.rating} />
                    <span className="text-[var(--color-fg)] font-medium">{review.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-[var(--color-fg)] leading-relaxed line-clamp-5">
                    {review.content ?? ""}
                </p>
                <p className="mt-auto text-[11px] text-[var(--color-fg-muted)] flex items-center gap-1.5">
                    <span>회원 {String(review.memberId).slice(-3)}**</span>
                    <span>|</span>
                    <span>{formatDate(review.createdAt)}</span>
                </p>
            </div>
        </Link>
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

function EmptyState() {
    return (
        <div className="py-16 md:py-24 text-center">
            <p className="text-base md:text-lg text-[var(--color-fg-muted)]">
                아직 등록된 베스트 후기가 없습니다.
            </p>
            <p className="mt-2 text-sm text-[var(--color-fg-subtle)]">
                상품을 구매하고 첫 후기를 남겨보세요!
            </p>
            <Link
                href="/c/best"
                className="inline-flex mt-6 px-5 py-2.5 rounded-[18px] bg-[var(--color-fg)] text-white text-sm font-medium hover:opacity-90 transition"
            >
                상품 보러가기
            </Link>
        </div>
    );
}
