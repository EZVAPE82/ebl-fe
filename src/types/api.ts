// 백엔드 응답 타입 (OpenAPI 자동생성 전, 수동 정의)

export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
};

export type ProductSummary = {
    id: number;
    categoryId: number | null;
    brandId: number | null;
    name: string;
    slug: string;
    /** 기본 판매가 (오프라인 등). */
    price: number;
    /** 온라인몰 판매가. null 이면 price 사용. 프론트는 displayPrice() 헬퍼로 통일. */
    onlinePrice?: number | null;
    status: "DRAFT" | "ACTIVE" | "SOLD_OUT" | "DISCONTINUED";
    thumbnailUrl: string | null;
    reviewCount: number;
    ratingAvg: number;
    /** 메인 페이지 "엘프바의 추천 아이템" 슬롯 (1~4) — NULL = 추천 아님 */
    featuredOrder?: number | null;
};

export type ProductOption = {
    id: number;
    optionGroup: string;
    optionValue: string;
    priceDelta: number;
    stock: number;
    required: boolean;
    sortOrder: number;
    visible: boolean;
};

export type ProductImage = {
    id: number;
    url: string;
    type: "THUMBNAIL" | "DETAIL";
    sortOrder: number;
};

export type ProductDetail = ProductSummary & {
    description: string | null;
    compatibilityInfo: string | null;
    options: ProductOption[];
    images: ProductImage[];
};

export type Category = {
    id: number;
    parentId: number | null;
    name: string;
    slug: string;
    sortOrder: number;
    visible: boolean;
};

export type Brand = {
    id: number;
    name: string;
    slug: string;
    logoUrl: string | null;
    sortOrder: number;
};

export type Banner = {
    id: number;
    placement: "MAIN_HERO" | "MID_HERO" | "TOP_STRIP" | "SECTION";
    imageUrl: string;
    /** 모바일(<=767px) 전용 이미지. 시안에서 모바일 hero 비율(세로)이 PC(와이드)와 다를 때 사용. 미지정 시 imageUrl 폴백. */
    mobileImageUrl?: string;
    linkUrl: string | null;
    altText: string | null;
    sortOrder: number;
};

export type Notice = {
    id: number;
    title: string;
    content: string;
    pinned: boolean;
    visible: boolean;
    viewCount: number;
    createdAt: string;
};

export type SortKey =
    | "popular"
    | "newest"
    | "price_asc"
    | "price_desc"
    | "rating"
    | "reviews";
