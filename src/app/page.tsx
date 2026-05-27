import { api } from "@/lib/api";
import { HeroCarousel } from "@/components/HeroCarousel";
import { DukeCarousel } from "@/components/DukeCarousel";
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

            {/* ===== 2. 카테고리 아이콘 ===== */}
            <CategoryIcons categories={categories} />

            <div className="mx-auto max-w-screen-xl px-4 space-y-16 pb-16">
                {/* ===== 3. 엘프바의 추천 아이템 (시안 11:864 4 카드 통이미지) ===== */}
                <section>
                    <div className="mb-4">
                        <p className="text-xs text-[var(--color-fg-muted)]">Best Item</p>
                        <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">엘프바의 추천 아이템</h2>
                    </div>
                    <BestItemGrid />
                </section>

                {/* ===== 4. DUKE 시그니처 캐러셀 (좌 텍스트 통이미지 + 우 3카드 회전) ===== */}
                <DukeCarousel />

                {/* ===== 5. 우리의 이벤트 (2 banner card 그리드) ===== */}
                <Section title="우리의 이벤트" href="/events">
                    <EventCards />
                </Section>

                {/* ===== 6. 핫한 아이템 순위 (라이프스타일 photo + 진짜 product 9 → 3 그룹) ===== */}
                <Section title="핫한 아이템 순위" href="/c/best">
                    <Ranking items={popular.content.slice(0, 9)} />
                </Section>

                {/* ===== 7. 시리즈 풀폭 배너 (시안 14:10629, 14:10630 통이미지) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/c/disposable" className="block overflow-hidden rounded-[var(--radius-lg)] hover:opacity-95 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/series-ice.png" alt="ICE COOL AS YOU WANT" className="w-full block" />
                    </Link>
                    <Link href="/c/disposable" className="block overflow-hidden rounded-[var(--radius-lg)] hover:opacity-95 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/series-shimmer.png" alt="SHIMMERING IN YOUR HAND" className="w-full block" />
                    </Link>
                </div>

                {/* ===== 8. 엘프바를 선택해야 하는 이유 ===== */}
                <WhyChooseUs />

                {/* ===== 9. 공지사항 + FAQ 2컬럼 ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <NoticeBox notices={notices.content} />
                    <FaqBox />
                </div>

                {/* ===== 10. 베스트 제품 후기 (4 카드 컴포넌트 + 한국어 목데이터) ===== */}
                <BestReviewsSection />

                {/* ===== 11. 인스타그램 8 그리드 ===== */}
                <InstagramFeed />
            </div>

            {/* ===== 12. CTA 풀폭 배너 ===== */}
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
    { id: -1, placement: "MAIN_HERO", imageUrl: "/images/hero.png",   linkUrl: "/c/best",       altText: "엘프바 BC10000 — NEW ARRIVAL", sortOrder: 1 },
    { id: -2, placement: "MAIN_HERO", imageUrl: "/images/hero-2.png", linkUrl: "/c/disposable", altText: "엘프바 시그니처 라인업",          sortOrder: 2 },
    { id: -3, placement: "MAIN_HERO", imageUrl: "/images/hero-3.png", linkUrl: "/c/disposable", altText: "엘프바 프리미엄 컬렉션",          sortOrder: 3 },
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
        <section className="mx-auto max-w-screen-xl px-4 py-8 md:py-12">
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
    // popular 9개를 3 그룹으로
    const top = items.slice(0, 9);
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
                    className="flex flex-col rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-surface)] shadow-sm"
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
                        {group.map((p, i) => (
                            <li key={p.id}>
                                <Link href={`/p/${p.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-bg-subtle)]">
                                    <span className="flex-shrink-0 w-5 text-xs font-semibold text-[var(--color-accent)] tabular-nums">{i + 1}</span>
                                    <div className="w-9 h-9 rounded bg-[var(--color-bg-subtle)] flex-shrink-0 overflow-hidden">
                                        {p.thumbnailUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-[var(--color-fg)] line-clamp-1">{p.name}</p>
                                        <p className="text-[11px] text-[var(--color-fg-muted)] tabular-nums">{formatPrice(p.price)}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {/* 빈 슬롯 채우기 (3개 미만일 때) */}
                        {Array.from({ length: Math.max(0, 3 - group.length) }, (_, i) => (
                            <li key={`empty-${i}`} className="px-3 py-2.5 text-xs text-[var(--color-fg-subtle)]">—</li>
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
const REASONS: { title: string; body: string; icon: string; selected?: boolean }[] = [
    { title: "정품 100%",     body: "공식 인증 제품인 인해",                  icon: "/images/reason-genuine.png",    selected: true },
    { title: "빠른 배송",     body: "오후 2시 이전 주문 시 당일 출고",          icon: "/images/reason-fast.png" },
    { title: "안전한 결제",   body: "24개 보안 시스템으로 안전한 거래",         icon: "/images/reason-secure.png" },
    { title: "다양한 혜택",   body: "적립금 / 쿠폰 / 회원등급 다양한 혜택",     icon: "/images/reason-benefit.png" },
    { title: "전문 고객센터", body: "평일 10:00 ~ 18:00 (점심 13:00 ~ 14:00)", icon: "/images/reason-cs.png" },
    { title: "멤버십 혜택",   body: "구매할수록 더 커지는 혜택",                icon: "/images/reason-membership.png" },
];
function WhyChooseUs() {
    return (
        <section>
            <div className="mb-4">
                <p className="text-xs text-[var(--color-fg-muted)]">Benfit</p>
                <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">엘프바를 선택해야하는 이유</h2>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {REASONS.map(r => (
                    <li
                        key={r.title}
                        className={`rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-5 md:p-6 flex items-center justify-between gap-4 hover:shadow-md transition ${
                            r.selected ? "border-2 border-blue-500 bg-[var(--color-surface)]" : "border border-transparent"
                        }`}
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
            <div className="flex items-end mb-3">
                <h3 className="text-base md:text-lg font-bold text-[var(--color-fg)]">공지사항</h3>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
                <ul className="divide-y divide-[var(--color-border)]">
                    {display.length === 0 && (
                        <li className="px-4 py-6 text-center text-xs text-[var(--color-fg-subtle)]">등록된 공지가 없습니다.</li>
                    )}
                    {display.map(n => (
                        <li key={n.id}>
                            <Link href={`/notices/${n.id}`} className="flex items-center gap-2 px-4 py-3.5 hover:bg-[var(--color-bg-subtle)]">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--color-fg)] line-clamp-1">
                                        {n.pinned && <span className="text-[10px] mr-1 px-1.5 py-0.5 rounded bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-medium">필독</span>}
                                        {n.title}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-fg-subtle)]">
                                        <CalendarIconMini />
                                        <span>{formatDate(n.createdAt)}</span>
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
                <Link href="/notices" className="block py-3 text-center text-xs text-[var(--color-fg-muted)] bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]">
                    더 알아보기
                </Link>
            </div>
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
            <div className="flex items-end mb-3">
                <h3 className="text-base md:text-lg font-bold text-[var(--color-fg)]">FAQ</h3>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
                <ul className="divide-y divide-[var(--color-border)]">
                    {items.map(f => (
                        <li key={f.id}>
                            <Link href="/faq" className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--color-bg-subtle)]">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--color-fg)] line-clamp-1">FAQ 질문입니다</p>
                                    <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-fg-subtle)]">
                                        <CalendarIconMini />
                                        <span>{f.date}</span>
                                    </p>
                                </div>
                                {f.answered && (
                                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium flex-shrink-0">답변완료</span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
                <Link href="/faq" className="block py-3 text-center text-xs text-[var(--color-fg-muted)] bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]">
                    더 알아보기
                </Link>
            </div>
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
const REVIEW_MOCKS = [
    {
        photo: "/images/review-photo-1.png",
        review: "야외 캠핑 갈 때 챙겨갔는데 가벼워서 부담 없고, 한 번 충전으로 정말 오래 가요. 친구들이 다 어디서 샀냐고 물어볼 정도였습니다.",
        author: "김** 님",
        date: "2026.05.18",
        product: "ELFBAR BC5000 그린애플",
        productThumb: "/images/elfbar-product-1.png",
    },
    {
        photo: "/images/review-photo-2.png",
        review: "디자인이 너무 깔끔해서 데일리로 쓰기 좋아요. 그립감도 편하고 손에 쥐기 딱 좋은 사이즈예요. 재구매 의사 있음.",
        author: "이** 님",
        date: "2026.05.15",
        product: "ELFBAR BC10000 블루라즈",
        productThumb: "/images/elfbar-product-2.png",
    },
    {
        photo: "/images/review-photo-3.png",
        review: "출장 다닐 때 가방에 쏙 들어가서 너무 편해요. 맛도 깔끔하고 향이 진하면서도 텁텁하지 않아서 마음에 듭니다.",
        author: "박** 님",
        date: "2026.05.10",
        product: "ELFBAR DUKE 멘솔",
        productThumb: "/images/elfbar-product-1.png",
    },
    {
        photo: "/images/review-photo-4.png",
        review: "선물용으로 샀는데 포장도 깔끔하고 받으신 분이 너무 좋아하셨어요. 다음에도 또 살 것 같아요. 강추!",
        author: "최** 님",
        date: "2026.05.08",
        product: "ELFLIQ 30ml 워터멜론",
        productThumb: "/images/elfbar-product-2.png",
    },
];
function BestReviewsSection() {
    return (
        <section id="best-reviews" className="scroll-mt-24">
            <div className="mb-4">
                <p className="text-xs text-[var(--color-fg-muted)]">Best Review</p>
                <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">베스트 제품 후기</h2>
            </div>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {REVIEW_MOCKS.map((r, i) => (
                    <li key={i} className="rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-surface)] shadow-sm">
                        <Link href="/c/best" className="block">
                            <div className="aspect-[4/5] overflow-hidden bg-[var(--color-bg-subtle)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={r.photo} alt={r.product} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-3 md:p-4 space-y-2">
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="text-yellow-400">★★★★★</span>
                                    <span className="text-[var(--color-fg)] font-medium">5.0</span>
                                </div>
                                <p className="text-xs text-[var(--color-fg)] leading-relaxed line-clamp-3 min-h-[3.6em]">{r.review}</p>
                                <p className="text-[11px] text-[var(--color-fg-muted)] flex items-center gap-1.5">
                                    <span>{r.author}</span><span>|</span><span>{r.date}</span>
                                </p>
                                <div className="pt-2 mt-1 border-t border-[var(--color-border)] flex items-center gap-2">
                                    <div className="w-9 h-9 rounded bg-[var(--color-bg-subtle)] overflow-hidden flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={r.productThumb} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-[11px] text-[var(--color-fg)] line-clamp-2 flex-1 min-w-0">{r.product}</p>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="mt-6 flex justify-center">
                <Link
                    href="/c/best"
                    className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] px-6 py-2.5 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
                >
                    더 알아보기
                </Link>
            </div>
        </section>
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
    return (
        <section>
            <div className="mb-4">
                <p className="text-xs text-[var(--color-fg-muted)]">@elfbar</p>
                <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)]">Instagram</h2>
            </div>
            <ul className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                    <li key={n} className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] group">
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
