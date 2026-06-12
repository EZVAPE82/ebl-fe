import { api } from "@/lib/api";
import { ReviewerListClient, type ReviewVM } from "@/components/ReviewerListClient";

export const metadata = { title: "REVIEWER" };

type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number };

// /reviews/best 와 동일한 응답 shape (V23/V30 시드 리뷰).
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
    productName?: string | null;
    productThumbnailUrl?: string | null;
    authorName?: string | null;
};

// 후기 사진 등록 전에도 페이지가 비어보이지 않게 — 홈 "베스트 제품 후기"와 동일한
// mock fallback 패턴. 사진은 회색 placeholder(시안 bg-[#D9D9D9])로 대체.
const REVIEW_MOCKS: ReviewVM[] = [
    {
        id: "mock-1", photo: "/images/elfbar-product-1.png", rating: 5,
        text: "야외 캠핑 갈 때 챙겨갔는데 진짜 너무 좋아요. 가벼워서 부담 없고 한 번 충전으로 정말 오래 갑니다. 디자인도 깔끔하고 그립감도 편안해서 어디든 가지고 다닐 수 있어요. 강추!",
        author: "김** 님", date: "2026.05.18",
        productTitle: "ELFBAR BC5000 그린애플", productSubtitle: "일회용 · 5000puff", productThumb: "/images/elfbar-product-1.png",
        sortDate: Date.parse("2026-05-18"), recommend: 42,
    },
    {
        id: "mock-2", photo: "/images/elfbar-product-1.png", rating: 4,
        text: "디자인이 너무 깔끔해서 데일리로 쓰기 좋아요. 그립감도 편하고 손에 쥐기 딱 좋은 사이즈입니다. 출장 다닐 때 가방에 쏙 들어가고 한 번 충전으로 오래 가요. 재구매 의사 있음.",
        author: "이** 님", date: "2026.05.15",
        productTitle: "ELFBAR BC10000 블루라즈", productSubtitle: "일회용 · 10000puff", productThumb: "/images/elfbar-product-1.png",
        sortDate: Date.parse("2026-05-15"), recommend: 31,
    },
    {
        id: "mock-3", photo: "/images/elfbar-product-1.png", rating: 5,
        text: "출장 다닐 때 가방에 쏙 들어가서 너무 편해요. 맛도 깔끔하고 향이 진하면서도 텁텁하지 않아서 마음에 듭니다.",
        author: "박** 님", date: "2026.05.10",
        productTitle: "ELFBAR DUKE 멘솔", productSubtitle: "기기 · 멘솔", productThumb: "/images/elfbar-product-1.png",
        sortDate: Date.parse("2026-05-10"), recommend: 27,
    },
    {
        id: "mock-4", photo: "/images/elfbar-product-1.png", rating: 4,
        text: "선물용으로 샀는데 받으신 분이 너무 좋아하셨어요. 포장도 깔끔하고 맛도 좋아서 만족합니다. 강추!",
        author: "최** 님", date: "2026.05.08",
        productTitle: "ELFLIQ 30ml 워터멜론", productSubtitle: "액상 · 30ml", productThumb: "/images/elfbar-product-1.png",
        sortDate: Date.parse("2026-05-08"), recommend: 19,
    },
    {
        id: "mock-5", photo: "/images/elfbar-product-1.png", rating: 5,
        text: "맛이 깔끔하고 후미가 시원합니다. 향이 오래 가고 목넘김도 부드러워서 자주 찾게 되네요. 재구매 100%.",
        author: "정** 님", date: "2026.05.05",
        productTitle: "ELFBAR BC5000 워터멜론", productSubtitle: "일회용 · 5000puff", productThumb: "/images/elfbar-product-1.png",
        sortDate: Date.parse("2026-05-05"), recommend: 23,
    },
    {
        id: "mock-6", photo: "/images/elfbar-product-1.png", rating: 3,
        text: "무난하게 잘 쓰고 있어요. 가성비 괜찮고 배터리도 적당히 오래 갑니다. 다만 향은 조금 약한 편이에요.",
        author: "강** 님", date: "2026.05.02",
        productTitle: "ELFBAR BC10000 망고", productSubtitle: "일회용 · 10000puff", productThumb: "/images/elfbar-product-1.png",
        sortDate: Date.parse("2026-05-02"), recommend: 11,
    },
];

// YYYY.MM.DD (시안 포맷) — ko-KR toLocaleDateString 은 공백/끝점이 붙어 직접 포맷.
function toDots(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
}

async function fetchReviews(): Promise<ReviewView[]> {
    try {
        // /reviews/best 와 동일 엔드포인트 재사용. 정렬은 client에서 처리하므로 넉넉히 가져온다.
        const res = await api<Page<ReviewView>>("/api/v1/public/reviews/best?page=0&size=60", { cache: "no-store" });
        return res.content ?? [];
    } catch {
        return [];
    }
}

function toVM(r: ReviewView): ReviewVM {
    return {
        id: r.id,
        photo: (r.photoUrls && r.photoUrls[0]) || r.productThumbnailUrl || null,
        rating: Math.min(5, Math.max(0, r.rating)),
        text: r.content ?? "",
        author: r.authorName ? `${r.authorName} 님` : "구매고객 님",
        date: toDots(r.createdAt),
        productTitle: r.productName || "상품",
        productSubtitle: "",
        productThumb: r.productThumbnailUrl || null,
        sortDate: Date.parse(r.createdAt) || 0,
        // 추천 가중치는 별도 필드가 없어 별점*비중 + 사진 가산으로 근사.
        recommend: r.rating * 10 + (r.hasPhoto ? 5 : 0),
    };
}

/**
 * REVIEWER 페이지 — Figma REVIEWER 시안 매칭.
 * 데이터: /api/v1/public/reviews/best (홈 "베스트 제품 후기"·/reviews/best 와 동일 소스).
 * 실제 후기가 없으면 mock fallback 으로 빈 화면 방지(홈과 동일 정책).
 * Header/PromoStrip/Footer 는 layout 제공 — 여기서 추가하지 않음.
 */
export default async function ReviewerPage() {
    const raw = await fetchReviews();
    const reviews: ReviewVM[] = raw.length > 0 ? raw.map(toVM) : REVIEW_MOCKS;

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col items-center gap-[60px]">
            <ReviewerListClient reviews={reviews} />
        </div>
    );
}
