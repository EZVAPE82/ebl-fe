import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { safeImageUrl, safeLinkUrl } from "@/lib/url";
import { formatDate, formatPrice } from "@/lib/format";
import type { Banner, Category, Page, ProductSummary } from "@/types/api";
import Link from "next/link";

type Notice = { id: number; title: string; createdAt: string; pinned: boolean };
type Event  = { id: number; title: string; summary: string | null; endsAt: string | null; bannerUrl: string | null };

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try {
        return await api<T>(path, { cache: "no-store" });
    } catch {
        return fallback;
    }
}

export default async function Home() {
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8, first: true, last: true, empty: true };

    const [bannersHero, newest, popular, categoriesRaw, notices, eventsRaw] = await Promise.all([
        safeFetch<Banner[]>("/api/v1/public/banners?placement=MAIN_HERO", []),
        safeFetch<Page<ProductSummary>>("/api/v1/public/products?sort=newest&size=8", emptyPage as Page<ProductSummary>),
        safeFetch<Page<ProductSummary>>("/api/v1/public/products?sort=popular&size=8", emptyPage as Page<ProductSummary>),
        safeFetch<Category[]>("/api/v1/public/categories", []),
        safeFetch<Page<Notice>>("/api/v1/public/notices?size=3", { ...emptyPage, content: [] } as unknown as Page<Notice>),
        safeFetch<Page<Event>>("/api/v1/public/events?size=3", { ...emptyPage, content: [] } as unknown as Page<Event>),
    ]);

    const hero = bannersHero[0];
    const categories = categoriesRaw.length > 0 ? categoriesRaw : DEFAULT_CATEGORIES;

    return (
        <div>
            {/* ===== 1. Hero ===== */}
            <Hero hero={hero} />

            {/* ===== 2. 카테고리 아이콘 ===== */}
            <CategoryIcons categories={categories} />

            <div className="mx-auto max-w-screen-xl px-4 space-y-16 pb-16">
                {/* ===== 3. 신상품 ===== */}
                <Section title="엘프바의 최신 모델들" href="/c/new">
                    <ProductGrid items={newest.content} />
                </Section>

                {/* ===== 4. ELFBAR DUKE 풀폭 배너 ===== */}
                <FullWidthPromo
                    label="Signature"
                    title="ELFBAR DUKE"
                    subtitle="더 깊게 매혹적인 풍미와 자연스러운 디자인의 조화"
                    image="/images/duke-full-banner.png"
                    href="/c/disposable"
                />

                {/* ===== 5. 인기 액상 안내 (2개 패널) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PromoPanel
                        label="POPULAR LIQUID"
                        title="인기 액상 라인업"
                        body="ELFLIQ 30ml 시리즈, 한 병으로 풀 데이."
                        gradient="from-[#fce4ec] to-[#f8bbd0]"
                        image="/images/liquid-popular.png"
                        href="/c/liquid"
                    />
                    <PromoPanel
                        label="NEW DROP"
                        title="신상 액상 입고"
                        body="블루베리·워터멜론 등 시즌 한정 플레이버."
                        gradient="from-[#311b92] to-[#7c4dff]"
                        image="/images/event-promo.png"
                        textTone="light"
                        href="/c/liquid"
                    />
                </div>

                {/* ===== 5-b. 우리의 이벤트 (시안 events-promo 영역) ===== */}
                <Section title="우리의 이벤트" href="/events">
                    <Link href="/events" className="block rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] hover:opacity-95 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/events-promo.png" alt="진행 중 이벤트" className="w-full block" />
                    </Link>
                </Section>

                {/* ===== 6. 핫한 아이템 순위 ===== */}
                <Section title="핫한 아이템 순위" href="/c/best">
                    <Ranking items={popular.content.slice(0, 3)} />
                </Section>

                {/* ===== 7. 시리즈 풀폭 배너 (ICE COOL / SHIMMERING) ===== */}
                {/* 시안 색감: ICE COOL = 밝은 하늘색, SHIMMERING = 분홍·코랄 → 노랑 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SeriesBanner
                        label="ICE COOL"
                        sub="AS YOU WANT"
                        gradient="from-[#a9d6ff] via-[#7ec4ff] to-[#4fa7ff]"
                        image="/images/elfbar-product-1.png"
                        href="/c/disposable"
                    />
                    <SeriesBanner
                        label="SHIMMERING"
                        sub="IN YOUR HAND"
                        gradient="from-[#ffafc8] via-[#ffb78f] to-[#ffd96b]"
                        image="/images/elfbar-product-2.png"
                        href="/c/disposable"
                    />
                </div>

                {/* ===== 8. 엘프바를 선택해야 하는 이유 ===== */}
                <WhyChooseUs />

                {/* ===== 9. 공지 / 이벤트 탭 ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <NoticeBox notices={notices.content} />
                    <EventBox events={eventsRaw.content} />
                </div>

                {/* ===== 10. 베스트 셀러 보기 (Figma 시안 11:947 — 헤더 포함 통이미지) ===== */}
                <Link href="/c/best" className="block hover:opacity-95 transition">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/best-sellers-row.png" alt="베스트 셀러 보기" className="w-full block" />
                </Link>

                {/* ===== 11. 인스타그램 피드 ===== */}
                <InstagramFeed />
            </div>

            {/* ===== 12. CTA 풀폭 배너 ===== */}
            <ContactCTA />
        </div>
    );
}

/* ============================================================
 * Hero — 보라 그라데이션 + 메인 카피
 * ============================================================ */
function Hero({ hero }: { hero: Banner | undefined }) {
    if (hero) {
        return (
            <Link href={safeLinkUrl(hero.linkUrl)} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={safeImageUrl(hero.imageUrl)}
                    alt={hero.altText ?? ""}
                    className="w-full h-[280px] md:h-[420px] object-cover"
                />
            </Link>
        );
    }
    return (
        <section className="relative w-full h-[280px] md:h-[420px] bg-gradient-to-br from-[#1a0f3d] via-[#3a1c6e] to-[#6b46c1] overflow-hidden">
            <div className="mx-auto max-w-screen-xl h-full px-4 md:px-8 flex items-center">
                <div className="text-white max-w-xl">
                    <p className="text-xs md:text-sm uppercase tracking-widest opacity-70 mb-2">New Drop</p>
                    <h1 className="text-2xl md:text-5xl font-bold leading-tight">
                        새로워진 엘프바를<br />가장 먼저 만나세요
                    </h1>
                    <p className="mt-3 text-sm md:text-base opacity-80">
                        만 19세 이상 성인 인증 후 이용 가능합니다.
                    </p>
                </div>
            </div>
            {/* 우측 제품 이미지 placeholder */}
            <div className="hidden md:block absolute right-12 top-1/2 -translate-y-1/2 w-72 h-72 opacity-90">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/elfbar-product-1.png"
                    alt=""
                    className="w-full h-full object-contain"
                />
            </div>
        </section>
    );
}

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

function CategoryIcons({ categories: _categories }: { categories: Category[] }) {
    // Figma 시안의 카테고리 아이콘 영역 통이미지 + 7개 클릭 zone overlay
    // (시안 라벨: BEST/NEW/이벤트/일회용/액상/공지사항/구매후기)
    const links = [
        "/c/best", "/c/new", "/events", "/c/disposable", "/c/liquid", "/notices", "#",
    ];
    const labels = ["BEST", "NEW", "이벤트", "일회용", "액상", "공지사항", "구매후기"];
    return (
        <section className="mx-auto max-w-screen-xl px-4 py-8">
            <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/categories-bar.png" alt="카테고리" className="w-full block" />
                <div className="absolute inset-0 grid grid-cols-7">
                    {links.map((href, i) => (
                        <Link
                            key={i}
                            href={href}
                            aria-label={labels[i]}
                            className="block hover:bg-[var(--color-fg)]/5 transition rounded-[var(--radius-sm)]"
                        />
                    ))}
                </div>
            </div>
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
 * FullWidthPromo — DUKE 같은 풀폭 어두운 배너
 * ============================================================ */
function FullWidthPromo({ label, title, subtitle, image, href }: {
    label: string; title: string; subtitle: string; image: string; href: string;
}) {
    return (
        <Link href={href} className="block relative rounded-[var(--radius-lg)] overflow-hidden h-[200px] md:h-[280px] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-center px-6 md:px-12 text-white max-w-2xl">
                <p className="text-xs md:text-sm uppercase tracking-widest opacity-80 mb-2">{label}</p>
                <h3 className="text-xl md:text-3xl font-bold leading-tight">{title}</h3>
                <p className="mt-2 text-sm md:text-base opacity-80">{subtitle}</p>
            </div>
        </Link>
    );
}

/* ============================================================
 * PromoPanel — 2분할 그라데이션 패널
 * ============================================================ */
function PromoPanel({ label, title, body, gradient, image, textTone, href }: {
    label: string; title: string; body: string; gradient: string; image?: string; textTone?: "light"; href: string;
}) {
    const tone = textTone === "light" ? "text-white" : "text-[var(--color-fg)]";
    const subTone = textTone === "light" ? "text-white/80" : "text-[var(--color-fg-muted)]";
    return (
        <Link href={href} className={`relative block overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br ${gradient} p-6 md:p-8 h-[180px] md:h-[220px] flex flex-col justify-end hover:opacity-95 transition ${tone}`}>
            {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />
            )}
            <div className="relative">
                <p className={`text-[11px] uppercase tracking-widest mb-2 ${subTone}`}>{label}</p>
                <h3 className="text-lg md:text-2xl font-bold">{title}</h3>
                <p className={`mt-1 text-sm ${subTone}`}>{body}</p>
            </div>
        </Link>
    );
}

/* ============================================================
 * Ranking — 핫 아이템 순위 (3개)
 * ============================================================ */
function Ranking({ items: _items }: { items: ProductSummary[] }) {
    // Figma 시안: 핫 아이템 1·2·3 라이프스타일 카드 3개 (보라/오렌지/녹색 톤)
    const ranks = [
        { src: "/images/rank-1.png", label: "1위" },
        { src: "/images/rank-2.png", label: "2위" },
        { src: "/images/rank-3.png", label: "3위" },
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ranks.map((r, i) => (
                <Link
                    key={i}
                    href="/c/best"
                    aria-label={r.label}
                    className="block rounded-[var(--radius-lg)] overflow-hidden hover:opacity-95 transition"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.src} alt={r.label} className="w-full block aspect-[464/300] object-cover" />
                </Link>
            ))}
        </div>
    );
}

/* ============================================================
 * SeriesBanner — ICE COOL / SHIMMERING 풀폭
 * ============================================================ */
function SeriesBanner({ label, sub, gradient, image, href }: { label: string; sub: string; gradient: string; image?: string; href: string }) {
    return (
        <Link href={href} className={`block rounded-[var(--radius-lg)] bg-gradient-to-br ${gradient} h-[180px] md:h-[260px] p-6 md:p-10 text-white flex flex-col justify-end hover:opacity-95 transition relative overflow-hidden group`}>
            {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition" />
            )}
            <div className="relative">
                <h3 className="text-2xl md:text-4xl font-bold tracking-tight">{label}</h3>
                <p className="mt-2 text-sm md:text-lg opacity-90 uppercase tracking-widest">{sub}</p>
            </div>
        </Link>
    );
}

/* ============================================================
 * WhyChooseUs — 8개 이유 그리드
 * ============================================================ */
function WhyChooseUs() {
    // Figma 시안 41:15605 — 6 일러스트 카드 (정품·배송·결제·혜택·CS·멤버십)
    return (
        <Section title="엘프바를 선택해야 하는 이유">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/reasons-grid.png" alt="엘프바 선택 이유" className="w-full block" />
        </Section>
    );
}

/* ============================================================
 * NoticeBox / EventBox — 좌우 분할 위젯
 * ============================================================ */
function NoticeBox({ notices }: { notices: Notice[] }) {
    return (
        <div>
            <div className="flex items-end justify-between mb-3">
                <h3 className="text-base md:text-lg font-semibold text-[var(--color-fg)]">공지사항</h3>
                <Link href="/notices" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">더보기 →</Link>
            </div>
            <ul className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden">
                {notices.length === 0 ? (
                    <li className="p-4 text-sm text-[var(--color-fg-subtle)] text-center">공지가 없습니다.</li>
                ) : notices.map(n => (
                    <li key={n.id}>
                        <Link href={`/notices/${n.id}`} className="flex items-center gap-2 px-4 py-3 hover:bg-[var(--color-bg-subtle)]">
                            {n.pinned && <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-medium">필독</span>}
                            <span className="flex-1 text-sm line-clamp-1 text-[var(--color-fg)]">{n.title}</span>
                            <span className="text-xs text-[var(--color-fg-muted)] flex-shrink-0">{formatDate(n.createdAt)}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function EventBox({ events }: { events: Event[] }) {
    return (
        <div>
            <div className="flex items-end justify-between mb-3">
                <h3 className="text-base md:text-lg font-semibold text-[var(--color-fg)]">진행 중인 이벤트</h3>
                <Link href="/events" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">더보기 →</Link>
            </div>
            <ul className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden">
                {events.length === 0 ? (
                    <li className="p-4 text-sm text-[var(--color-fg-subtle)] text-center">진행 중인 이벤트가 없습니다.</li>
                ) : events.map(e => (
                    <li key={e.id} className="p-4 hover:bg-[var(--color-bg-subtle)]">
                        <p className="text-sm font-medium line-clamp-1 text-[var(--color-fg)]">{e.title}</p>
                        {e.summary && <p className="mt-0.5 text-xs text-[var(--color-fg-muted)] line-clamp-1">{e.summary}</p>}
                        {e.endsAt && <p className="mt-1 text-[11px] text-[var(--color-fg-subtle)]">~ {formatDate(e.endsAt)}</p>}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ============================================================
 * InstagramFeed — 8칸 정사각형 그리드
 * ============================================================ */
function InstagramFeed() {
    // Figma 시안 노드 11:959~11:980 에서 추출한 라이프스타일 8장
    return (
        <Section title="Instagram">
            <ul className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                    <li key={n} className="aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/images/ig-${n}.png`}
                            alt={`instagram ${n}`}
                            className="w-full h-full object-cover hover:scale-105 transition"
                        />
                    </li>
                ))}
            </ul>
        </Section>
    );
}

/* ============================================================
 * ContactCTA — 하단 풀폭 보라 배너
 * ============================================================ */
function ContactCTA() {
    // Figma 시안 41:10474 — "엘프바에게 문의해주세요" 보라 그라데이션 + 선물 일러스트 + 입력창
    return (
        <Link href="/faq" className="block mt-16 hover:opacity-95 transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/cta-bottom.png" alt="문의" className="w-full block" />
        </Link>
    );
}
