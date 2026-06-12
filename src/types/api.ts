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
    /** 상품 코드(8자리) — 결제 주문명 등 외부 노출용. */
    code?: string | null;
    /** 카드 한 줄 설명 (추천 아이템 카드 등). */
    description?: string | null;
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
    /** 옵션 없는 상품의 품절 여부(상품 레벨 재고 추적 중 0 이하). 옵션 상품은 옵션 재고로 판단. */
    soldOut?: boolean;
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
    /** 상품 레벨 재고 (옵션 없는 상품). null = 무제한. 옵션 있는 상품은 옵션 재고 사용. */
    stock?: number | null;
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

// ── 캠페인(적립금/쿠폰) 룰 엔진 ───────────────────────────────
export type CampaignTrigger = "ORDER_PAID" | "SIGNUP" | "REVIEW_WRITTEN";

export type CampaignCondition = { field: string; op: string; value?: unknown };

export type CampaignReward = {
    type: "POINT_FIXED" | "POINT_RATE" | "COUPON_ISSUE";
    target?: "SELF" | "REFERRER";
    amount?: number | null;
    rate?: number | null;
    base?: string | null;
    cap?: number | null;
    couponId?: number | null;
};

export type CampaignView = {
    id: number;
    name: string;
    description: string | null;
    trigger: CampaignTrigger;
    conditions: CampaignCondition[];
    rewards: CampaignReward[];
    priority: number;
    stackable: boolean;
    active: boolean;
    validFrom: string | null;
    validTo: string | null;
    perMemberLimit: number | null;
    totalLimit: number | null;
    grantCount: number;
    createdAt: string;
};

// 카탈로그 (어드민 UI 동적 렌더용) — GET /api/v1/admin/campaigns/catalog
export type CatalogOption = { value: string; label: string };
export type CatalogField = {
    field: string; label: string; valueType: string;
    ops: string[]; triggers: string[]; options: CatalogOption[];
};
export type CatalogRewardParam = {
    key: string; label: string; type: string; required: boolean; options: CatalogOption[];
};
export type CatalogReward = {
    type: string; label: string; triggers: string[]; targets: string[]; params: CatalogRewardParam[];
};
export type CatalogOperator = { op: string; label: string };
export type CatalogTrigger = { key: string; label: string };
export type CampaignCatalog = {
    triggers: CatalogTrigger[];
    fields: CatalogField[];
    rewards: CatalogReward[];
    operators: CatalogOperator[];
    targets: string[];
};

export type CouponSummary = {
    id: number;
    code: string | null;
    name: string;
    type: string;
    discountType: string;
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number;
    validDays: number;
    active: boolean;
};
