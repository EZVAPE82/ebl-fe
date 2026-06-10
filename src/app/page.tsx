import { api } from "@/lib/api";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TrustBadges } from "@/components/TrustBadges";
import { BestReviewsCarousel } from "@/components/BestReviewsCarousel";
import { ProductCard } from "@/components/ProductCard";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { CarouselShell } from "@/components/CarouselShell";
import { GatedMedia } from "@/components/GatedMedia";
import { formatDate, formatPrice } from "@/lib/format";
import type { Banner, Category, Page, ProductSummary } from "@/types/api";
import Link from "next/link";

type Notice = { id: number; title: string; createdAt: string; pinned: boolean };
type EventLite = { id: number; title: string; bannerUrl: string | null };
type ReviewView = {
    id: number; productId: number; memberId: number; rating: number; content: string | null;
    hasPhoto: boolean; photoUrls: string[]; createdAt: string;
    productName?: string | null; productThumbnailUrl?: string | null;
};

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try {
        return await api<T>(path, { cache: "no-store" });
    } catch {
        return fallback;
    }
}


export default async function Home() {
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8, first: true, last: true, empty: true };

    const [bannersHero, featured, bestItems, categoriesRaw, notices, bestReviews, eventsPage] = await Promise.all([
        safeFetch<Banner[]>("/api/v1/public/banners?placement=MAIN_HERO", []),
        safeFetch<ProductSummary[]>("/api/v1/public/products/featured", []),
        // 베스트(핫한 아이템 순위) — best_mode 정책(판매량/조회수/직접지정)에 따라 산정
        safeFetch<ProductSummary[]>("/api/v1/public/products/best?size=9", []),
        safeFetch<Category[]>("/api/v1/public/categories", []),
        safeFetch<Page<Notice>>("/api/v1/public/notices?size=4", { ...emptyPage, content: [] } as unknown as Page<Notice>),
        safeFetch<Page<ReviewView>>("/api/v1/public/reviews/best?page=0&size=4", { ...emptyPage, content: [] } as unknown as Page<ReviewView>),
        safeFetch<Page<EventLite>>("/api/v1/public/events?size=12", { ...emptyPage, content: [] } as unknown as Page<EventLite>),
    ]);

    // "엘프바의 이벤트" 디자인 카드 2종 — 배경 위 텍스트·버튼을 HTML 로 얹고, 실제 이벤트 글(제목 키워드)로 라우팅.
    const eventHref = (kw: string) => {
        const e = eventsPage.content.find(ev => ev.title.includes(kw));
        return e ? `/events/${e.id}` : "/events";
    };
    // 완성 배경 1장씩 → 이미지 전체 클릭 시 이벤트 상세로 이동 (버튼·오버레이 없음)
    const EVENT_CARDS = [
        { bg: "/images/main-event1.png", href: eventHref("할인"), alt: "신제품 출시 기념 최대 20% 할인" },
        { bg: "/images/main-event2.png", href: eventHref("리뷰"), alt: "포토 리뷰 쓰고 적립금 받자" },
    ];

    const categories = categoriesRaw.length > 0 ? categoriesRaw : DEFAULT_CATEGORIES;
    const heroSlides = bannersHero.length > 0 ? bannersHero : DESIGN_FALLBACK_MAIN_HERO;

    // 실제 V23/V30 시드 리뷰 → BestReviewsCarousel 의 ReviewMock 으로 매핑.
    // 리뷰 사진(photoUrls)이 비면 product thumbnail 로 fallback.
    const realReviews = bestReviews.content.map(r => ({
        photo: (r.photoUrls && r.photoUrls[0]) || r.productThumbnailUrl || "/images/elfbar-product-1.png",
        rating: Math.min(5, Math.max(0, r.rating)),
        review: r.content ?? "",
        author: "구매고객 님",
        date: formatDate(r.createdAt),
        product: r.productName || "상품",
        productThumb: r.productThumbnailUrl || "/images/elfbar-product-1.png",
    }));

    return (
        <div>
            {/* ===== 1. Hero 캐러셀 (MAIN_HERO 다중 슬라이드) =====
                헤더가 홈에서 fixed 투명 오버레이라 Hero 위 spacer 불필요 — Hero 가 헤더 위로 침범. */}
            {/* TrustBadges (혜택 안내 5카드): 데스크탑만 Hero 안 absolute. 모바일은 사용자 요청으로 완전 제거. */}
            {/* 히어로 — 1920×840 고정. 양옆 남는 영역은 흰색, 1920보다 좁은 화면은 가운데 크롭. */}
            <div className="w-full overflow-hidden flex justify-center bg-white">
                <GatedMedia className="w-[1920px] h-[840px] flex-shrink-0">
                    <HeroCarousel
                        banners={heroSlides}
                        fallbackImage="/images/main-hero1.png"
                        fallbackMobileImage="/images/main-hero1.png"
                        showOverlay={false}
                        heightClass="h-full"
                    >
                        <div className="hidden md:block">
                            <TrustBadges />
                        </div>
                    </HeroCarousel>
                </GatedMedia>
            </div>

            {/* ===== 카테고리 아이콘 ===== */}
            <GatedMedia>
                <CategoryIcons categories={categories} />
            </GatedMedia>

            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] space-y-20 md:space-y-40">
                {/* ===== 3. 엘프바의 추천 아이템 — 어드민 설정 (featured_order 1~4) · 시안 캐러셀 ===== */}
                <FeaturedCarousel items={featured} />

                {/* ===== 5. 엘프바의 이벤트 (디자인 카드 2종 — 배경+오버레이 텍스트+버튼, 이벤트 상세로 라우팅) ===== */}
                <CarouselShell eyebrow="Event" title="엘프바의 이벤트">
                    {EVENT_CARDS.map(c => (
                        <div key={c.alt} className="snap-start shrink-0 w-[88%] sm:w-[70%] lg:w-[calc((100%-28px)/2)]">
                            {/* 시안: 776×340 r16 · 이미지 전체 클릭 → 이벤트 상세 */}
                            <Link href={c.href} className="group block aspect-[776/340] rounded-[16px] overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.bg} alt={c.alt} className="w-full h-full object-cover transition group-hover:opacity-95" />
                            </Link>
                        </div>
                    ))}
                </CarouselShell>

                {/* ===== 6. 제품별 순위 (캐러셀 — 화살표로 페이징) ===== */}
                <CarouselShell eyebrow="Ranking" title="제품별 베스트 순위">
                    <Ranking items={bestItems.slice(0, 9)} />
                </CarouselShell>
            </div>

            {/* ===== 7. 시리즈 배너 — 각 960×680 고정(비율 960/680). 2개=1920 상한, 그 이상 화면은 흰 여백 ===== */}
            <GatedMedia className="my-20 md:my-40 mx-auto max-w-[1920px] grid grid-cols-1 md:grid-cols-2 gap-0">
                <Link href="/products?series=iceking" className="block aspect-[960/680] overflow-hidden hover:opacity-95 transition">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/series-ice.png" alt="ICE COOL AS YOU WANT" className="w-full h-full object-cover" />
                </Link>
                <Link href="/products?series=icekingpro" className="block aspect-[960/680] overflow-hidden hover:opacity-95 transition">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/series-shimmer.png" alt="SHIMMERING IN YOUR HAND" className="w-full h-full object-cover" />
                </Link>
            </GatedMedia>

            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] space-y-20 md:space-y-40">
                {/* ===== 공지사항 + FAQ 2컬럼 ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                    <NoticeBox notices={notices.content} />
                    <FaqBox />
                </div>

                {/* ===== 베스트 제품 후기 — Lightbox 연결 client component ===== */}
                {/* 실제 후기 있으면 그걸로, 없으면 REVIEW_MOCKS 폴백 → 섹션 항상 노출(시안) */}
                <BestReviewsCarousel reviews={realReviews.length > 0 ? realReviews : REVIEW_MOCKS} />
            </div>

            {/* ===== CTA 풀폭 배너 ===== */}
            <ContactCTA />
        </div>
    );
}

/* DUKE 캐러셀은 client component (DukeCarousel) 로 분리되어 위에서 import */

/* ============================================================
 * 카테고리 아이콘 (Figma 시안 통이미지)
 * ============================================================ */

const DEFAULT_CATEGORIES: Category[] = [
    { id: 1, parentId: null, name: "베스트",  slug: "best",       sortOrder: 1, visible: true },
    { id: 2, parentId: null, name: "신상품",  slug: "new",        sortOrder: 2, visible: true },
    { id: 3, parentId: null, name: "일회용",  slug: "disposable", sortOrder: 3, visible: true },
    { id: 5, parentId: null, name: "기기",    slug: "devices",    sortOrder: 4, visible: true },
    { id: 6, parentId: null, name: "악세서리", slug: "accessory",  sortOrder: 5, visible: true },
];

/**
 * 시안 fallback — Figma 2026-05-26 업데이트 반영, 메인 히어로 3장 캐러셀.
 * 각 자산은 1920x800 (2.4:1) hero 비율, Figma 노드 41:8762/41:8761/41:8763.
 */
const DESIGN_FALLBACK_MAIN_HERO: Banner[] = [
    { id: -1, placement: "MAIN_HERO", imageUrl: "/images/main-hero1.png", mobileImageUrl: "/images/main-hero1.png", linkUrl: "/c/best",       altText: "새로워진 엘프바를 가장 먼저 만나보세요", sortOrder: 1 },
    { id: -2, placement: "MAIN_HERO", imageUrl: "/images/main-hero2.png", mobileImageUrl: "/images/main-hero2.png", linkUrl: "/c/disposable", altText: "엘프바 라인업",          sortOrder: 2 },
    { id: -3, placement: "MAIN_HERO", imageUrl: "/images/main-hero3.png", mobileImageUrl: "/images/main-hero3.png", linkUrl: "/products",     altText: "엘프바 프리미엄 컬렉션",          sortOrder: 3 },
];

/**
 * 중간 히어로 fallback — 단일 cinematic banner.
 * `duke-banner.png` / `duke-full-banner.png` 모두 3패널 mockup (사이 빈 gap) → 단일 hero 부적합.
 * 대신 `hero-3.png` (3840×1600 = 2.4:1, 다크 시네마틱 ELFBAR 단일 composition) 사용.
 */
const DESIGN_FALLBACK_MID_HERO: Banner[] = [
    { id: -11, placement: "MID_HERO", imageUrl: "/images/hero-3.png", linkUrl: "/c/disposable", altText: "ELFBAR DUKE 시그니처", sortOrder: 1 },
];

function CategoryIcons({ categories: _categories }: { categories: Category[] }) {
    // Figma 11:820 시안 1:1 매칭 — 3D 일러스트 PNG 7개 (Figma 노드 14:12732 등에서 export)
    const items: { label: string; href: string; src: string }[] = [
        { label: "BEST",     href: "/c/best",       src: "/images/cat-best.png" },
        { label: "NEW",      href: "/c/new",        src: "/images/cat-new.png" },
        { label: "이벤트",   href: "/events",       src: "/images/cat-event.png" },
        { label: "일회용",   href: "/c/disposable", src: "/images/cat-disposable.png" },
        { label: "공지사항", href: "/notices",      src: "/images/cat-notice.png" },
        { label: "구매후기", href: "/reviews", src: "/images/cat-review.png" },
    ];
    return (
        <section className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-16 md:pt-[100px] pb-24 md:pb-[160px]">
            {/* 시안 CSS: 컨테이너 inline-flex · gap 48 / 타일 148×148 · padding 26 · radius 20 · border 1px · 아이콘 96×96 / 타일↔라벨 16 */}
            <ul className="flex flex-wrap justify-center items-start gap-x-6 md:gap-x-12 gap-y-8">
                {items.map(it => (
                    <li key={it.label}>
                        <Link
                            href={it.href}
                            aria-label={it.label}
                            className="group flex flex-col items-center gap-4 hover:opacity-90 transition"
                        >
                            {/* cat-*.png = 타일 통째(회색 배경+라운드+일러스트). 풀사이즈 148로 원본 그대로 */}
                            <span className="w-[110px] h-[110px] md:w-[148px] md:h-[148px] flex items-center justify-center group-hover:scale-105 transition-transform">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={it.src} alt={it.label} className="w-full h-full object-contain" />
                            </span>
                            <span className="text-xs md:text-sm text-[var(--color-fg)]">{it.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/* ============================================================
 * Section — 타이틀 + 더보기
 * ============================================================ */
function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
    return (
        <section>
            <div className="flex items-end justify-between mb-4">
                <h2 className="text-lg md:text-2xl font-semibold text-[var(--color-fg)]">{title}</h2>
                {href && (
                    <Link href={href} className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">더보기 →</Link>
                )}
            </div>
            {children}
        </section>
    );
}

function ProductGrid({ items }: { items: ProductSummary[] }) {
    if (items.length === 0) {
        return (
            <div className="rounded-[var(--radius-lg)] px-4 py-12 text-center text-sm text-[var(--color-fg-subtle)]">
                아직 상품이 없습니다.
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {items.slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}
        </div>
    );
}

/* ============================================================
 * Ranking — 제품별 순위 (3 그룹, 캐러셀 아이템)
 * ============================================================ */
function Ranking({ items }: { items: ProductSummary[] }) {
    // 시안 11:1819~33:5307 — 3 카드 = 라이프스타일 photo + 진짜 product mini list
    // popular 상위 9개를 3 그룹으로 split. photo 는 통이미지 그대로 + 진짜 product 클릭 가능.
    const PHOTOS = ["/images/rank-1-photo.png", "/images/rank-2-photo.png", "/images/rank-3-photo.png"];
    const LABELS = ["변치 않는 시원함", "터지는 풍미 그 이상", "그 속에 이루는 한 방울"];

    // popular API 응답이 비어있어도 시안에 보이는 mini list (각 카드 3 row) 가 안 빈
    // 줄로 떨어지지 않게 fallback mock 9개 항상 보장.
    const FALLBACK_MOCK: ProductSummary[] = Array.from({ length: 9 }, (_, i) => ({
        id: -(i + 1),
        name: ["BC5000 그린애플","BC10000 블루라즈","DUKE 멘솔","BC5000 워터멜론","BC10000 망고","DUKE 그레이프","BC5000 피치","BC10000 코코넛","DUKE 라임"][i],
        thumbnailUrl: `/images/elfbar-product-${(i % 2) + 1}.png`,
        price: 25000,
    })) as unknown as ProductSummary[];

    const source = items.length >= 9 ? items : (items.length > 0
        ? [...items, ...FALLBACK_MOCK].slice(0, 9)
        : FALLBACK_MOCK);
    const top = source.slice(0, 9);
    const groups: ProductSummary[][] = [
        top.slice(0, 3),
        top.slice(3, 6),
        top.slice(6, 9),
    ];
    return (
        <>
            {groups.map((group, gi) => (
                <div key={gi} className="snap-start shrink-0 w-[86%] sm:w-[62%] lg:w-[calc((100%-56px)/3)] flex flex-col gap-5">
                    {/* 라이프스타일 사진 508×320 r12 (라벨 베이크) */}
                    <Link href="/c/best" aria-label={LABELS[gi]} className="block rounded-[12px] overflow-hidden hover:opacity-95 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={PHOTOS[gi]} alt={LABELS[gi]} className="w-full block aspect-[508/320] object-cover" />
                    </Link>
                    {/* 순위 리스트 — 3행 gap 24. 행 = 순위뱃지 + 흰카드(썸네일100 + 이름/설명/가격 + 장바구니·하트 40×40) */}
                    <ul className="flex flex-col gap-6">
                        {group.map((p, ri) => {
                            const rankNo = gi * 3 + ri + 1;
                            const hasDisc = p.onlinePrice != null && p.onlinePrice < p.price;
                            const sale = hasDisc ? (p.onlinePrice as number) : p.price;
                            return (
                                <li key={p.id} className="relative pt-1.5">
                                    {/* 순위 뱃지 (펜넌트) */}
                                    <span
                                        className="absolute top-0 left-3 z-10 flex h-9 w-7 items-start justify-center pt-1 text-[12px] font-bold text-white"
                                        style={{ background: "#0073DD", clipPath: "polygon(0 0,100% 0,100% 72%,50% 100%,0 72%)" }}
                                    >
                                        {rankNo}
                                    </span>
                                    {/* 흰 카드 r8 */}
                                    <div className="flex items-center justify-between gap-2 rounded-[8px] bg-white p-3 transition hover:shadow-sm">
                                        <Link href={`/p/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                                            {/* 썸네일 100×100 (#F6F7FB) */}
                                            <div className="flex h-[84px] w-[84px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F6F7FB] p-2 lg:h-[100px] lg:w-[100px]">
                                                {p.thumbnailUrl && (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={p.thumbnailUrl} alt={p.name} className="max-h-full max-w-full object-contain" />
                                                )}
                                            </div>
                                            {/* 이름 14/500 · 설명 14/#767676 · 가격(취소선 16/#999 + 판매가 16/#222) */}
                                            <div className="flex min-w-0 flex-col gap-1">
                                                <p className="line-clamp-1 text-[14px] font-medium text-[#000]">{p.name}</p>
                                                {p.description && <p className="line-clamp-1 text-[14px] text-[#767676]">{p.description}</p>}
                                                <div className="flex items-baseline gap-1.5">
                                                    {hasDisc && <span className="text-[16px] text-[#999999] line-through tabular-nums">{formatPrice(p.price)}</span>}
                                                    <span className="text-[16px] font-medium text-[#222222] tabular-nums">{formatPrice(sale)}</span>
                                                </div>
                                            </div>
                                        </Link>
                                        {/* 장바구니 + 하트 40×40 r4 */}
                                        <div className="flex flex-shrink-0 flex-col gap-2">
                                            <Link href={`/p/${p.id}`} aria-label="장바구니" className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-[var(--color-border)] text-[var(--color-fg-muted)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]">
                                                <CartMiniIcon />
                                            </Link>
                                            <Link href={`/p/${p.id}`} aria-label="찜" className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-[var(--color-border)] text-[var(--color-fg-muted)] transition hover:border-[var(--color-border-strong)] hover:text-[#e23744]">
                                                <HeartMiniIcon />
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </>
    );
}

function CartMiniIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
            <path d="M2 3h3l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L22 7H6" />
        </svg>
    );
}
function HeartMiniIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.8 7.6a5 5 0 0 0-8.8-2.2A5 5 0 0 0 3.2 7.6c0 4.2 5.2 7.9 8.8 10.4 3.6-2.5 8.8-6.2 8.8-10.4z" />
        </svg>
    );
}

/* ============================================================
 * WhyChooseUs — 6 카드 3×2 그리드 (시안 41:15605 매칭)
 * 각 카드: 컬러 박스 + 짧은 카피 + 부연 설명
 * ============================================================ */
/* 시안 매칭: 6 카드 = 통일된 흰 배경 + 1px 보더만. 첫 카드 highlight (파란 보더) 제거. */
const REASONS: { title: string; body: string; icon: string }[] = [
    { title: "정품 100%",     body: "공식 인증 제품만 판매합니다",              icon: "/images/reason-genuine.png" },
    { title: "빠른 배송",     body: "오후 2시 이전 주문 시 당일 출고",          icon: "/images/reason-fast.png" },
    { title: "안전한 결제",   body: "다중 보안 시스템으로 안전한 거래",         icon: "/images/reason-secure.png" },
    { title: "다양한 혜택",   body: "적립금 / 쿠폰 / 회원등급\n다양한 혜택",    icon: "/images/reason-benefit.png" },
    { title: "전문 고객센터", body: "평일 10:00 ~ 18:00\n(점심 13:00 ~ 14:00)", icon: "/images/reason-cs.png" },
    { title: "멤버십 혜택",   body: "구매할수록 더 커지는\n혜택",               icon: "/images/reason-membership.png" },
];
function WhyChooseUs() {
    return (
        <section>
            <div className="mb-4">
                <p className="text-xs text-[var(--color-fg-muted)]">Benefit</p>
                <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">엘프바를 선택해야하는 이유</h2>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {REASONS.map(r => (
                    <li
                        key={r.title}
                        className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 md:p-6 flex items-center justify-between gap-4 hover:border-[var(--color-border-strong)] transition"
                    >
                        <div className="min-w-0">
                            <p className="text-sm md:text-base font-bold text-[var(--color-fg)]">{r.title}</p>
                            <p className="text-xs text-[var(--color-fg-muted)] mt-1 whitespace-pre-line">{r.body}</p>
                        </div>
                        <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.icon} alt={r.title} className="w-full h-full object-contain" />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/* ============================================================
 * NoticeBox / EventBox — 좌우 분할 위젯
 * ============================================================ */
function NoticeBox({ notices }: { notices: Notice[] }) {
    // 시안 402:10620 — 타이틀 28/500 · 항목(제목 18/500 + 날짜 14/#767676, pad 24) · 더알아보기 #F6F7FB r4
    const display = notices.slice(0, 4);
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
                <h3 className="text-[28px] font-medium leading-none text-[#000]">공지사항</h3>
                <ul className="divide-y divide-[var(--color-border)]">
                    {display.length === 0 && (
                        <li className="py-6 text-center text-sm text-[var(--color-fg-subtle)]">등록된 공지가 없습니다.</li>
                    )}
                    {display.map(n => (
                        <li key={n.id}>
                            <Link href={`/notices/${n.id}`} className="flex flex-col gap-2 py-6 hover:opacity-70 transition">
                                <p className="text-[18px] font-medium text-[#000] line-clamp-1">
                                    {n.pinned && <span className="mr-1.5 rounded bg-[var(--color-danger)]/10 px-1.5 py-0.5 text-[12px] font-medium text-[var(--color-danger)]">필독</span>}
                                    {n.title}
                                </p>
                                <p className="text-[14px] text-[#767676]">{formatDate(n.createdAt)}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <Link href="/notices" className="flex items-center justify-center rounded-[4px] bg-[#F6F7FB] py-6 text-[14px] font-medium text-[#767676] hover:text-[var(--color-fg)] transition">
                더 알아보기
            </Link>
        </div>
    );
}

/**
 * FaqBox — 시안 402:10620. FAQ 4건(질문 18/500 + 날짜 14 + 답변완료 14/#0072DD) + 더알아보기.
 */
function FaqBox() {
    const items = [
        { id: 1, q: "결제 수단은 어떤 것이 있나요?",        date: "2025.07.15", answered: true },
        { id: 2, q: "주문 후 취소는 언제까지 가능한가요?", date: "2025.07.10", answered: true },
        { id: 3, q: "배송은 얼마나 걸리나요?",              date: "2025.07.05", answered: true },
        { id: 4, q: "도서·산간 지역도 배송 가능한가요?",     date: "2025.07.01", answered: true },
    ];
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
                <h3 className="text-[28px] font-medium leading-none text-[#000]">FAQ</h3>
                <ul className="divide-y divide-[var(--color-border)]">
                    {items.map(f => (
                        <li key={f.id}>
                            <Link href="/faq" className="flex items-center justify-between gap-4 py-6 hover:opacity-70 transition">
                                <div className="flex min-w-0 flex-col gap-2">
                                    <p className="text-[18px] font-medium text-[#000] line-clamp-1">{f.q}</p>
                                    <p className="text-[14px] text-[#767676]">{f.date}</p>
                                </div>
                                {f.answered && (
                                    <span className="flex-shrink-0 text-[14px] font-medium text-[#0072DD]">답변완료</span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <Link href="/faq" className="flex items-center justify-center rounded-[4px] bg-[#F6F7FB] py-6 text-[14px] font-medium text-[#767676] hover:text-[var(--color-fg)] transition">
                더 알아보기
            </Link>
        </div>
    );
}

function CalendarIconMini() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
    );
}

/* ============================================================
 * BestReviewsSection — 시안 11:947 4 카드 (각 카드: 라이프스타일 사진 + 평점 + 후기 + 제품 미니)
 * 후기 텍스트는 한국어 목데이터, 사진은 review-photo-1~4.png 사용.
 * ============================================================ */
// 후기 길이 다양화: 5줄 / 4줄 / 3줄 / 2줄 + 별점 5.0 / 4.5 / 5.0 / 4.0
// 데이터 검증·layout 안정성 확인용 (mt-auto + grid stretch 로 상품줄 정렬 보장)
const REVIEW_MOCKS = [
    {
        photo: "/images/review-photo-1-v2.png",
        rating: 5.0,
        review: "야외 캠핑 갈 때 챙겨갔는데 진짜 너무 좋아요. 가벼워서 부담 없고 한 번 충전으로 정말 오래 갑니다. 디자인도 깔끔하고 손에 쥐는 그립감도 편안해서 어디든 부담 없이 가지고 다닐 수 있어요. 친구들이 다 어디서 샀냐고 물어볼 정도였습니다. 다음에 또 살 거예요. 강추!",
        author: "김** 님",
        date: "2026.05.18",
        product: "ELFBAR BC5000 그린애플",
        productThumb: "/images/elfbar-product-1.png",
    },
    {
        photo: "/images/review-photo-2-v2.png",
        rating: 4.5,
        review: "디자인이 너무 깔끔해서 데일리로 쓰기 좋아요. 그립감도 편하고 손에 쥐기 딱 좋은 사이즈입니다. 출장 다닐 때 가방에 쏙 들어가고 한 번 충전으로 정말 오래 가요. 재구매 의사 있음.",
        author: "이** 님",
        date: "2026.05.15",
        product: "ELFBAR BC10000 블루라즈",
        productThumb: "/images/elfbar-product-2.png",
    },
    {
        photo: "/images/review-photo-3-v2.png",
        rating: 5.0,
        review: "출장 다닐 때 가방에 쏙 들어가서 너무 편해요. 맛도 깔끔하고 향이 진하면서도 텁텁하지 않아서 마음에 듭니다.",
        author: "박** 님",
        date: "2026.05.10",
        product: "ELFBAR DUKE 멘솔",
        productThumb: "/images/elfbar-product-1.png",
    },
    {
        photo: "/images/review-photo-4-v2.png",
        rating: 4.0,
        review: "선물용으로 샀는데 받으신 분이 너무 좋아하셨어요. 강추!",
        author: "최** 님",
        date: "2026.05.08",
        product: "ELFLIQ 30ml 워터멜론",
        productThumb: "/images/elfbar-product-2.png",
    },
];
/* ============================================================
 * BestReviewsSection — 처음부터 새로 작성 (시안 11:948 / 11:949 규격 그대로)
 *
 * 시안 11:948 전체 (1440 x 684):
 *   ├─ 11:949 헤더 (1440 x 80)
 *   │   ├─ 좌: Best Item + 가장 인기있는 제품 (323 x 80)
 *   │   └─ 우: 슬라이드 버튼 2개 (108 x 48, 각 48 x 48)
 *   └─ 11:950 카드 그리드 (1440 x 572)
 *       └─ 4 카드 (각 342 x 572, gap 24)
 *           ├─ 사진 (342 x 342, border-radius 12, background url)
 *           └─ 텍스트 (342 x 214)
 * ============================================================ */
function BestReviewsSection() {
    return (
        <section id="best-reviews" className="scroll-mt-24">
            {/* 헤더 */}
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

            {/* 카드 그리드 4 균등 (모바일 2 col) */}
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {REVIEW_MOCKS.map((r, i) => (
                    <ReviewCard key={i} review={r} />
                ))}
            </ul>
        </section>
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

function ReviewCard({ review }: { review: typeof REVIEW_MOCKS[number] }) {
    // photo 가 "#RRGGBB" 헥스코드면 단색 배경(디버그용), 아니면 이미지로 렌더
    const isColor = review.photo.startsWith("#");
    return (
        // 카드 4 장 높이 통일 — grid stretch + flex column 으로 상품줄을 카드 하단에 고정
        <li className="flex h-full">
            <Link href="/reviews/best" className="flex flex-col w-full h-full">
                {/* 사진 박스 — 업계 표준 1:1 + object-fit cover (Shopify Dawn / Amazon / eBay 패턴).
                    운영 시 사용자 업로드 사진(다양한 비율)도 800×800 thumbnail 자동 생성 후 동일 처리. */}
                <div
                    style={{
                        aspectRatio: "1 / 1",
                        width: "100%",
                        overflow: "hidden",
                        borderRadius: 18,
                        backgroundColor: isColor ? review.photo : undefined,
                        flexShrink: 0,
                    }}
                >
                    {!isColor && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={review.photo}
                            alt={review.product}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center",
                                display: "block",
                            }}
                        />
                    )}
                </div>

                {/* 텍스트 영역 — flex column 으로 상품줄을 카드 하단에 mt-auto 로 푸시 */}
                <div className="mt-4 flex flex-col flex-1 space-y-2">
                    <div className="flex items-center gap-1 text-xs">
                        <RatingStars rating={review.rating} />
                        <span className="text-[var(--color-fg)] font-medium">{review.rating.toFixed(1)}</span>
                    </div>
                    {/* 후기 — 최대 5 줄 표시, 그 이상은 "..." 으로 잘림 (line-clamp-5).
                        하단 정렬은 mt-auto + grid stretch 로 처리. */}
                    <p className="text-xs text-[var(--color-fg)] leading-relaxed line-clamp-5">
                        {review.review}
                    </p>
                    <p className="text-[11px] text-[var(--color-fg-muted)] flex items-center gap-1.5">
                        <span>{review.author}</span>
                        <span>|</span>
                        <span>{review.date}</span>
                    </p>
                    {/* 상품줄 — mt-auto 로 카드 맨 아래 고정, 4 장 정렬됨 */}
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

/* 별점 표시 — rating (0~5) 에 따라 노란별 채움. 0.5 단위 반쪽별 지원.
 * 예: 4.5 -> ★★★★⯨☆, 4.0 -> ★★★★☆, 5.0 -> ★★★★★ */
function RatingStars({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.25 && rating - full < 0.75;
    const empty = 5 - full - (half ? 1 : 0);
    return (
        <span className="inline-flex items-center" aria-label={`별점 ${rating} / 5`}>
            <span className="text-yellow-400 tracking-tight">{"★".repeat(full)}</span>
            {half && <span className="text-yellow-400 tracking-tight relative">
                <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>★</span>
                <span className="text-[var(--color-border-strong,#d4d4d4)]">★</span>
            </span>}
            <span className="text-[var(--color-border-strong,#d4d4d4)] tracking-tight">{"★".repeat(empty)}</span>
        </span>
    );
}

/**
 * BestReviews — (사용 안 함, 호환용)
 *  각 카드: 라이프스타일 thumbnail + ★ 평점 + 후기 요약 + 미니 상품 정보
 *  데이터: popular ProductSummary 4개 활용. 실제 리뷰 텍스트는 정적 sample.
 */
function BestReviews({ items }: { items: ProductSummary[] }) {
    const placeholders = ["/images/ig-1.png", "/images/ig-2.png", "/images/ig-3.png", "/images/ig-4.png"];
    const samples = [
        "스타일도 디자인도 너무 마음에 들어요! 친구들한테 자랑하고 다녔어요.",
        "한 번 충전으로 정말 오래가요. 출장 갈 때 부담 없이 챙기게 됩니다.",
        "그립감이 좋고 무게도 적당해요. 데일리로 쓰기 딱 좋은 사이즈.",
        "맛이 깔끔하고 후미가 시원합니다. 재구매 의사 100%.",
    ];
    const fallback = Array.from({ length: 4 }, (_, i) => ({
        id: -i - 1, name: "상품명", thumbnailUrl: placeholders[i], price: 25000,
    })) as unknown as ProductSummary[];
    const list = items.length >= 4 ? items.slice(0, 4) : fallback;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {list.map((p, i) => (
                <Link
                    key={p.id ?? i}
                    href="/reviews/best"
                    className="block rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-md transition"
                >
                    <div className="aspect-square bg-[var(--color-bg-subtle)] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={placeholders[i]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 md:p-4 space-y-1.5">
                        <div className="flex items-center gap-1 text-xs">
                            <span className="text-yellow-400">★★★★★</span>
                            <span className="text-[var(--color-fg-muted)]">5.0</span>
                        </div>
                        <p className="text-xs text-[var(--color-fg)] line-clamp-2 leading-relaxed">{samples[i]}</p>
                        <div className="pt-2 mt-1 border-t border-[var(--color-border)] flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-[var(--color-bg-subtle)] flex-shrink-0 overflow-hidden">
                                {p.thumbnailUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-[var(--color-fg)] line-clamp-1">{p.name}</p>
                                <p className="text-[11px] text-[var(--color-fg-muted)] tabular-nums">{formatPrice(p.price)}</p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

/* ============================================================
 * InstagramFeed — 8칸 정사각형 그리드
 * ============================================================ */
function InstagramFeed() {
    // 시안 11:956 — 그리드 폭 2218 (viewport 1920 보다 큼) → 가로 스크롤 캐러셀.
    // cell 268px 고정, viewport 보다 wide 한 flex row → 사용자가 좌우 스크롤/swipe 로 이동.
    return (
        <section className="mt-16">
            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] mb-4">
                <p className="text-xs text-[var(--color-fg-muted)]">@elfbar</p>
                <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">Instagram</h2>
            </div>
            {/* 가로 스크롤 캐러셀 — overflow-x: auto + cell flex-shrink-0 고정 width.
                스크롤바는 hide (scrollbar-none) + snap-x 로 부드러운 swipe. */}
            <ul
                className="flex gap-2 overflow-x-auto px-4 pb-2 snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                    <li
                        key={n}
                        className="relative flex-shrink-0 aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] group snap-start"
                        style={{ width: "min(268px, 35vw)" }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/images/ig-${n}.png`}
                            alt={`instagram ${n}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute right-2 top-2 w-5 h-5 flex items-center justify-center text-white" aria-hidden="true">
                            {/* Instagram 멀티사진 (carousel) 아이콘 */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.5))" }}>
                                <rect x="7" y="7" width="14" height="14" rx="2"/>
                                <path d="M3 17V5a2 2 0 0 1 2-2h12"/>
                            </svg>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/* ============================================================
 * ContactCTA — 1:1 문의 카드 (시안 41:10474 frame + 41:10454/41:10495 일러스트)
 *
 * 시안 정합:
 *  - cta-card-full.png : 카드 통이미지 (보라 그라데이션 + 별빛 + 선물박스 + input + 문의하기 버튼)
 *  - cta-illust-left.png  : 노란 바구니+선물박스 일러스트 (카드 위로 튀어나옴)
 *  - cta-illust-right.png : 보라 구슬 구름 일러스트 (카드 위로 튀어나옴)
 *
 * 좌표 (frame 1920x280 기준 →  % 매핑):
 *  - left illust : left=30.78%, top=-26.07%, w=5.42%, h=47.14% (frame y=8240, illust y=8167)
 *  - right illust: left=86.04%, top=-17.86%, w=7.08%, h=37.86%
 *
 * 카드 우측 input 영역 (대략 frame 폭 55~95% / 35~70% h) 클릭 → /faq 이동.
 * HTML form input 은 통이미지와 중복되므로 제거 (사용자가 input 위 그림자 지적 fix).
 * ============================================================ */
function ContactCTA() {
    return (
        <section className="mt-16 md:mt-40 relative mx-auto w-full max-w-[1920px]">
            {/* 푸터 위 1:1 문의 배너 — 1920 상한(히어로·시리즈와 동일). 넓은 화면에선 양옆 여백. 후기와 160. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/images/inquiry-banner-before-footer.png"
                alt="엘프바에게 문의해주세요 — 궁금하신 부분이 있으시면 언제든지 연락주세요"
                className="w-full block"
            />
            {/* 시안 402:10842: 인풋 제거, 문의하기 버튼만 — 우측(170 from right) · 세로 중앙(배너 280 기준) · 160×60 검정 */}
            <Link
                href="/contact"
                aria-label="1:1 문의하기"
                className="absolute right-[17%] top-[58%] -translate-y-1/2 inline-flex items-center justify-center w-[110px] h-10 md:w-[160px] md:h-[56px] rounded-[8px] bg-black text-white text-sm md:text-base font-medium shadow-sm hover:opacity-90 transition"
            >
                문의하기
            </Link>
        </section>
    );
}
