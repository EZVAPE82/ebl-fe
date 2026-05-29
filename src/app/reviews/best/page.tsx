import { api } from "@/lib/api";
import { ReviewerGrid } from "@/components/ReviewerGrid";

export const metadata = { title: "REVIEWER" };

type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number };
export type ReviewView = {
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

/* 목데이터 — 시안 매칭 (16개 카드, 4 cols x 4 rows) */
const MOCK_REVIEWS: ReviewView[] = Array.from({ length: 16 }, (_, i) => ({
    id: 9000 + i,
    productId: (i % 4) + 1,
    memberId: 1000 + i,
    rating: 5.0,
    content:
        i % 4 === 0 ? "야외 캠핑 갈 때 챙겨갔는데 진짜 너무 좋아요. 가벼워서 부담 없고 한 번 충전으로 정말 오래 갑니다."
        : i % 4 === 1 ? "디자인이 너무 깔끔해서 데일리로 쓰기 좋아요. 그립감도 편하고 손에 쥐기 딱 좋은 사이즈입니다."
        : i % 4 === 2 ? "출장 다닐 때 가방에 쏙 들어가서 너무 편해요. 맛도 깔끔하고 향이 진하면서도 텁텁하지 않아서 마음에 듭니다."
        : "선물용으로 샀는데 받으신 분이 너무 좋아하셨어요. 강추!",
    hasPhoto: true,
    photoUrls: [`/images/review-photo-${(i % 4) + 1}-v2.png`],
    pointRewarded: true,
    createdAt: `2026-05-${String(22 - (i % 22)).padStart(2, "0")}T10:00:00`,
}));

async function fetchBest(): Promise<ReviewView[]> {
    try {
        const p = await api<Page<ReviewView>>("/api/v1/public/reviews/best?size=24", { cache: "no-store" });
        return p.content ?? [];
    } catch {
        return [];
    }
}

/**
 * REVIEWER 페이지 — 시안 252:10915 매칭.
 * 큰 REVIEWER 타이틀 + 카테고리 탭 + 4 cols 그리드 + 페이지네이션.
 * 카드 클릭 시 ReviewLightbox (시안 34:7826) 모달 오픈.
 */
export default async function BestReviewerPage() {
    const fetched = await fetchBest();
    const reviews = fetched.length === 0 ? MOCK_REVIEWS : fetched;

    return (
        <div className="bg-[var(--color-bg)] min-h-screen">
            <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
                {/* 큰 타이틀 */}
                <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                    REVIEWER
                </h1>

                {/* 그리드 + Lightbox (client component) */}
                <ReviewerGrid reviews={reviews} />
            </div>
        </div>
    );
}
