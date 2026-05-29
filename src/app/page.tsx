import { api } from "@/lib/api";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TrustBadges } from "@/components/TrustBadges";
import { BestReviewsCarousel } from "@/components/BestReviewsCarousel";
import { ProductCard } from "@/components/ProductCard";
import { EventPopup } from "@/components/EventPopup";
import { formatDate, formatPrice } from "@/lib/format";
import type { Banner, Category, Page, ProductSummary } from "@/types/api";
import Link from "next/link";

type Notice = { id: number; title: string; createdAt: string; pinned: boolean };

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try {
        return await api<T>(path, { cache: "no-store" });
    } catch {
        return fallback;
    }
}

export default async function Home() {
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8, first: true, last: true, empty: true };

    const [bannersHero, _newest, popular, categoriesRaw, notices] = await Promise.all([
        safeFetch<Banner[]>("/api/v1/public/banners?placement=MAIN_HERO", []),
        safeFetch<Page<ProductSummary>>("/api/v1/public/products?sort=newest&size=8", emptyPage as Page<ProductSummary>),
        safeFetch<Page<ProductSummary>>("/api/v1/public/products?sort=popular&size=8", emptyPage as Page<ProductSummary>),
        safeFetch<Category[]>("/api/v1/public/categories", []),
        safeFetch<Page<Notice>>("/api/v1/public/notices?size=4", { ...emptyPage, content: [] } as unknown as Page<Notice>),
    ]);
    void _newest;

    const categories = categoriesRaw.length > 0 ? categoriesRaw : DEFAULT_CATEGORIES;
    const heroSlides = bannersHero.length > 0 ? bannersHero : DESIGN_FALLBACK_MAIN_HERO;

    return (
        <div>
            {/* ===== 1. Hero 캐러셀 (MAIN_HERO 다중 슬라이드) =====
                헤더가 홈에서 fixed 투명 오버레이라 Hero 위 spacer 불필요 — Hero 가 헤더 위로 침범. */}
            <HeroCarousel banners={heroSlides} fallbackImage="/images/hero.png" />

            {/* ===== 2. 트러스트 배지 5 카드 (시안 214:17932) — Hero 아래 풀폭 다크 그라데이션 ===== */}
            <TrustBadges />

            {/* ===== 3. 카테고리 아이콘 ===== */}
            <CategoryIcons categories={categories} />

            <div className="mx-auto max-w-screen-2xl px-4 space-y-16 pb-16">
                {/* ===== 3. 엘프바의 추천 아이템 (시안 11:864 4 카드 통이미지) ===== */}
                <section>
                    <div className="mb-4">
                        <p className="text-xs text-[var(--color-fg-muted)]">Best Item</p>
                        <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">엘프바의 추천 아이템</h2>
                    </div>
                    <BestItemGrid />
                </section>

                {/* ===== 5. 우리의 이벤트 (2 banner card 그리드) ===== */}
                <Section title="우리의 이벤트" href="/events">
                    <EventCards />
                </Section>

                {/* ===== 6. 핫한 아이템 순위 (라이프스타일 photo + 진짜 product 9 → 3 그룹) ===== */}
                <Section title="핫한 아이템 순위" href="/c/best">
                    <Ranking items={popular.content.slice(0, 9)} />
                </Section>

                {/* ===== 7. 시리즈 배너 (시안 — 테두리 X, 간격 X, 꽉 채움) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <Link href="/c/disposable" className="block overflow-hidden hover:opacity-95 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/series-ice.png" alt="ICE COOL AS YOU WANT" className="w-full block" />
                    </Link>
                    <Link href="/c/disposable" className="block overflow-hidden hover:opacity-95 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/series-shimmer.png" alt="SHIMMERING IN YOUR HAND" className="w-full block" />
                    </Link>
                </div>

                {/* ===== 공지사항 + FAQ 2컬럼 ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <NoticeBox notices={notices.content} />
                    <FaqBox />
                </div>

                {/* ===== 베스트 제품 후기 — Lightbox 연결 client component ===== */}
                <BestReviewsCarousel reviews={REVIEW_MOCKS} />
            </div>

            {/* ===== CTA 풀폭 배너 ===== */}
            <ContactCTA />

            {/* ===== 이벤트 팝업 (홈 진입 시 1회) ===== */}
            <EventPopup />
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
    { id: 4, parentId: null, name: "액상",    slug: "liquid",     sortOrder: 4, visible: true },
    { id: 5, parentId: null, name: "기기",    slug: "devices",    sortOrder: 5, visible: true },
    { id: 6, parentId: null, name: "악세서리", slug: "accessory",  sortOrder: 6, visible: true },
];

/**
 * 시안 fallback — Figma 2026-05-26 업데이트 반영, 메인 히어로 3장 캐러셀.
 * 각 자산은 1920x800 (2.4:1) hero 비율, Figma 노드 41:8762/41:8761/41:8763.
 */
const DESIGN_FALLBACK_MAIN_HERO: Banner[] = [
    { id: -1, placement: "MAIN_HERO", imageUrl: "/images/hero-bg.png", linkUrl: "/c/best",       altText: "엘프바 BC10000 — NEW ARRIVAL", sortOrder: 1 },
    { id: -2, placement: "MAIN_HERO", imageUrl: "/images/hero-2.png",  linkUrl: "/c/disposable", altText: "엘프바 시그니처 라인업",          sortOrder: 2 },
    { id: -3, placement: "MAIN_HERO", imageUrl: "/images/hero-3.png",  linkUrl: "/c/disposable", altText: "엘프바 프리미엄 컬렉션",          sortOrder: 3 },
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
        { label: "액상",     href: "/c/liquid",     src: "/images/cat-liquid.png" },
        { label: "공지사항", href: "/notices",      src: "/images/cat-notice.png" },
        { label: "구매후기", href: "/reviews/best", src: "/images/cat-review.png" },
    ];
    return (
        <section className="mx-auto max-w-screen-2xl px-4 py-8 md:py-12">
            <ul className="grid grid-cols-4 md:grid-cols-7 gap-3 md:gap-4">
                {items.map(it => (
                    <li key={it.label}>
                        <Link
                            href={it.href}
                            aria-label={it.label}
                            className="group flex flex-col items-center gap-2 hover:opacity-90 transition"
                        >
                            <span className="w-20 h-20 md:w-24 md:h-24 group-hover:scale-105 transition-transform">
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
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-4 py-12 text-center text-sm text-[var(--color-fg-subtle)]">
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
 * BestItemGrid — 시안 11:864 4 product 카드 (상단: 컬러 제품 통이미지, 하단: HTML 정보)
 * ============================================================ */
function BestItemGrid() {
    const cards = [
        { id: 1, src: "/images/prod-apple-ice.png",    name: "Apple Ice",     sub: "5000모금 일회용 · 청사과 + 멘솔" },
        { id: 2, src: "/images/prod-blue-razz.png",    name: "Blue Razz Ice", sub: "5000모금 일회용 · 블루라즈 + 멘솔" },
        { id: 3, src: "/images/prod-cola-ice.png",     name: "Cola Ice",      sub: "5000모금 일회용 · 콜라 + 멘솔" },
        { id: 4, src: "/images/prod-grape-cherry.png", name: "Grape Cherry",  sub: "5000모금 일회용 · 포도 + 체리" },
    ];
    return (
        <>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {cards.map(c => (
                    <li key={c.id}>
                        <Link href={`/p/${c.id}`} className="block group">
                            <div className="rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-bg-subtle)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.src} alt={c.name} className="w-full block group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="mt-3 space-y-1">
                                <p className="text-sm md:text-base font-medium text-[var(--color-fg)] line-clamp-1">{c.name}</p>
                                <p className="text-xs text-[var(--color-fg-muted)] line-clamp-1">{c.sub}</p>
                                <p className="text-xs text-[var(--color-fg-subtle)] line-through tabular-nums">25,000원</p>
                                <p className="text-sm font-semibold tabular-nums">
                                    <span className="text-[var(--color-danger)] mr-1">40%</span>
                                    <span className="text-[var(--color-fg)]">25,000원</span>
                                </p>
                                <p className="text-xs text-[var(--color-fg-muted)] flex items-center gap-1">
                                    <span className="text-yellow-400">★</span>
                                    <span className="font-medium text-[var(--color-fg)]">4.9</span>
                                    <span>|</span>
                                    <span>20건</span>
                                </p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="mt-6 flex justify-center">
                <Link
                    href="/c/new"
                    className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] px-6 py-2.5 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
                >
                    더 알아보기
                </Link>
            </div>
        </>
    );
}

/* ============================================================
 * EventCards — "우리의 이벤트" 2개 banner card (시안 매칭)
 *  카드 1: 핑크·바이올렛 그라데이션 + 할인 카피 + 더보기 버튼
 *  카드 2: 블루·네이비 그라데이션 + 카드 결제 카피 + 더보기 버튼
 * ============================================================ */
function EventCards() {
    // Figma 13:1522 — 두 카드 (39:6907, 39:6865) 통이미지 그대로 사용
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/events" className="block rounded-[var(--radius-lg)] overflow-hidden hover:opacity-95 transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/event-card-1.png" alt="최대 20% 할인" className="w-full block" />
            </Link>
            <Link href="/events" className="block rounded-[var(--radius-lg)] overflow-hidden hover:opacity-95 transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/event-card-2.png" alt="포토 리뷰 쓰고 적립금 받자" className="w-full block" />
            </Link>
        </div>
    );
}

/* ============================================================
 * Ranking — 핫 아이템 순위 (3개)
 * ============================================================ */
function Ranking({ items }: { items: ProductSummary[] }) {
    // 시안 11:1819~33:5307 — 3 카드 = 라이프스타일 photo + 진짜 product mini list
    // popular 상위 9개를 3 그룹으로 split. photo 는 통이미지 그대로 + 진짜 product 클릭 가능.
    const PHOTOS = ["/images/rank-1-photo.png", "/images/rank-2-photo.png", "/images/rank-3-photo.png"];
    const LABELS = ["변치 않는 기본", "단순한 풍미 그 이상", "직관적 강한 힘"];
    const BRANDS = ["ELFBAR 8000", "ELFLIQ", "ELFBAR BC10000"];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map((group, gi) => (
                <div
                    key={gi}
                    className="flex flex-col rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-surface)]"
                >
                    <Link href="/c/best" aria-label={LABELS[gi]} className="relative block group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={PHOTOS[gi]} alt={LABELS[gi]} className="w-full block aspect-[464/348] object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        <div className="absolute left-3 md:left-4 bottom-3 md:bottom-4 text-white">
                            <p className="text-[10px] uppercase tracking-widest opacity-80">{BRANDS[gi]}</p>
                            <p className="text-sm md:text-base font-bold mt-0.5">{LABELS[gi]}</p>
                        </div>
                    </Link>
                    <ul className="divide-y divide-[var(--color-border)]">
                        {group.map((p) => (
                            <li key={p.id}>
                                <Link href={`/p/${p.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-[var(--color-bg-subtle)]">
                                    {/* 썸네일 - 사진 다 보이게 object-contain + 박스 크게 */}
                                    <div className="w-14 h-14 rounded bg-[var(--color-bg-subtle)] flex-shrink-0 overflow-hidden flex items-center justify-center p-1">
                                        {p.thumbnailUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.thumbnailUrl} alt={p.name} className="max-w-full max-h-full object-contain" />
                                        )}
                                    </div>
                                    {/* 텍스트 (이름 + 가격 세로) */}
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="text-xs md:text-sm text-[var(--color-fg)] line-clamp-1 font-medium">{p.name}</p>
                                        <p className="text-xs text-[var(--color-fg-muted)] tabular-nums">{formatPrice(p.price)}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
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
    // 시안 매칭: 4건 + 달력 + 하단 "더 알아보기". 실제 DB 공지만 노출 (placeholder 제거).
    const display = notices.slice(0, 4);
    return (
        <div>
            {/* 시안 매칭: 외곽 박스 없음. 헤더 + 굵은 하단 보더 + row list + 회색 button. */}
            <h3 className="text-xl md:text-2xl font-bold text-[var(--color-fg)] pb-4 border-b-2 border-[var(--color-fg)]">
                공지사항
            </h3>
            <ul className="divide-y divide-[var(--color-border)]">
                {display.length === 0 && (
                    <li className="px-1 py-6 text-center text-xs text-[var(--color-fg-subtle)]">등록된 공지가 없습니다.</li>
                )}
                {display.map(n => (
                    <li key={n.id}>
                        <Link href={`/notices/${n.id}`} className="flex items-center gap-2 px-1 py-4 hover:opacity-70 transition">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm md:text-base text-[var(--color-fg)] line-clamp-1 font-medium">
                                    {n.pinned && <span className="text-[10px] mr-1 px-1.5 py-0.5 rounded bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-medium">필독</span>}
                                    {n.title}
                                </p>
                                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--color-fg-subtle)]">
                                    <CalendarIconMini />
                                    <span>{formatDate(n.createdAt)}</span>
                                </p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
            <Link href="/notices" className="mt-4 block py-3.5 text-center text-sm text-[var(--color-fg-muted)] bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)] transition">
                더 알아보기
            </Link>
        </div>
    );
}

/**
 * FaqBox — 시안 매칭. FAQ 4건 + 답변완료 배지 + "더 알아보기" 푸터.
 */
function FaqBox() {
    const items = [
        { id: 1, q: "결제 수단은 어떤 것이 있나요?",        date: "2025.07.15", answered: true },
        { id: 2, q: "주문 후 취소는 언제까지 가능한가요?", date: "2025.07.10", answered: true },
        { id: 3, q: "배송은 얼마나 걸리나요?",              date: "2025.07.05", answered: true },
        { id: 4, q: "도서·산간 지역도 배송 가능한가요?",     date: "2025.07.01", answered: true },
    ];
    return (
        <div>
            {/* 시안 매칭: 외곽 박스 없음. 헤더 + 굵은 하단 보더 + row list + 회색 button. */}
            <h3 className="text-xl md:text-2xl font-bold text-[var(--color-fg)] pb-4 border-b-2 border-[var(--color-fg)]">
                FAQ
            </h3>
            <ul className="divide-y divide-[var(--color-border)]">
                {items.map(f => (
                    <li key={f.id}>
                        <Link href="/faq" className="flex items-center gap-3 px-1 py-4 hover:opacity-70 transition">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm md:text-base text-[var(--color-fg)] line-clamp-1 font-medium">FAQ 질문입니다</p>
                                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--color-fg-subtle)]">
                                    <CalendarIconMini />
                                    <span>{f.date}</span>
                                </p>
                            </div>
                            {f.answered && (
                                <span className="text-[11px] px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium flex-shrink-0">답변완료</span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
            <Link href="/faq" className="mt-4 block py-3.5 text-center text-sm text-[var(--color-fg-muted)] bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)] transition">
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
            <Link href="/c/best" className="flex flex-col w-full h-full">
                {/* 사진 박스 — 업계 표준 1:1 + object-fit cover (Shopify Dawn / Amazon / eBay 패턴).
                    운영 시 사용자 업로드 사진(다양한 비율)도 800×800 thumbnail 자동 생성 후 동일 처리. */}
                <div
                    style={{
                        aspectRatio: "1 / 1",
                        width: "100%",
                        overflow: "hidden",
                        borderRadius: 12,
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
                    href={p.id > 0 ? `/p/${p.id}` : "/c/best"}
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
            <div className="mx-auto max-w-screen-2xl px-4 mb-4">
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
        <section className="mt-24 relative w-full">
            {/* 카드 통이미지 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/cta-card-full.png" alt="엘프바에게 문의해주세요" className="w-full block" />

            {/* 좌측 일러스트 — 노란 바구니 + 선물박스 (카드 위로 솟음) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/images/cta-illust-left.png"
                alt=""
                aria-hidden="true"
                className="absolute pointer-events-none select-none"
                style={{ left: "30.78%", top: "-26.07%", width: "5.42%", height: "47.14%" }}
                draggable={false}
            />

            {/* 우측 일러스트 — 보라 구슬 구름 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/images/cta-illust-right.png"
                alt=""
                aria-hidden="true"
                className="absolute pointer-events-none select-none"
                style={{ left: "86.04%", top: "-17.86%", width: "7.08%", height: "37.86%" }}
                draggable={false}
            />

            {/* 우측 input/버튼 영역 invisible click → /faq */}
            <Link
                href="/faq"
                aria-label="1:1 문의하기"
                className="absolute z-10 focus:outline-none focus-visible:bg-white/5 transition"
                style={{ left: "55%", right: "5%", top: "25%", bottom: "25%" }}
            />
        </section>
    );
}
