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
                    label="ELFBAR DUKE"
                    title="새로운 차원의 흡연 경험"
                    subtitle="묵직한 멘솔과 풍부한 향, DUKE 시리즈로 만나보세요."
                    image="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&q=80"
                    href="/c/disposable"
                />

                {/* ===== 5. 인기 액상 안내 (2개 패널) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PromoPanel
                        label="POPULAR LIQUID"
                        title="인기 액상 라인업"
                        body="ELFLIQ 30ml 시리즈, 한 병으로 풀 데이."
                        gradient="from-[#fce4ec] to-[#f8bbd0]"
                        image="https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?w=900&q=80"
                        href="/c/liquid"
                    />
                    <PromoPanel
                        label="NEW DROP"
                        title="신상 액상 입고"
                        body="블루베리·워터멜론 등 시즌 한정 플레이버."
                        gradient="from-[#311b92] to-[#7c4dff]"
                        image="https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=900&q=80"
                        textTone="light"
                        href="/c/liquid"
                    />
                </div>

                {/* ===== 6. 핫한 아이템 순위 ===== */}
                <Section title="핫한 아이템 순위" href="/c/best">
                    <Ranking items={popular.content.slice(0, 3)} />
                </Section>

                {/* ===== 7. 시리즈 풀폭 배너 (ICE COOL / SHIMMERING) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SeriesBanner
                        label="ICE COOL"
                        sub="A REFRESHING WAVE"
                        gradient="from-[#0288d1] to-[#26c6da]"
                        image="https://images.unsplash.com/photo-1620207418302-439b387441b0?w=900&q=80"
                        href="/c/disposable"
                    />
                    <SeriesBanner
                        label="SHIMMERING"
                        sub="WITH A WARM AURORA"
                        gradient="from-[#ef6c00] to-[#ff8a65]"
                        image="https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=900&q=80"
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

                {/* ===== 10. 베스트 셀러 리뷰 (시드 popular 재활용) ===== */}
                <Section title="베스트 셀러 보기" href="/c/best">
                    <ProductGrid items={popular.content.slice(0, 4)} />
                </Section>

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
                    src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&q=80"
                    alt=""
                    className="w-full h-full object-contain"
                />
            </div>
        </section>
    );
}

/* ============================================================
 * 카테고리 아이콘 (원형 컬러)
 * ============================================================ */
const CATEGORY_VISUAL: Record<string, { bg: string; emoji: string }> = {
    best:       { bg: "bg-[#ffe0e6]", emoji: "🔥" },
    new:        { bg: "bg-[#dbe9ff]", emoji: "✨" },
    disposable: { bg: "bg-[#e0f7e7]", emoji: "💨" },
    liquid:     { bg: "bg-[#fff3c4]", emoji: "💧" },
    devices:    { bg: "bg-[#ffe0c4]", emoji: "🔋" },
    accessory:  { bg: "bg-[#ffd6e7]", emoji: "🎀" },
};

const DEFAULT_CATEGORIES: Category[] = [
    { id: 1, parentId: null, name: "베스트",  slug: "best",       sortOrder: 1, visible: true },
    { id: 2, parentId: null, name: "신상품",  slug: "new",        sortOrder: 2, visible: true },
    { id: 3, parentId: null, name: "일회용",  slug: "disposable", sortOrder: 3, visible: true },
    { id: 4, parentId: null, name: "액상",    slug: "liquid",     sortOrder: 4, visible: true },
    { id: 5, parentId: null, name: "기기",    slug: "devices",    sortOrder: 5, visible: true },
    { id: 6, parentId: null, name: "악세서리", slug: "accessory",  sortOrder: 6, visible: true },
];

function CategoryIcons({ categories }: { categories: Category[] }) {
    // 시드에는 4개만 있지만 시안 6개를 채우기 위해 default 보강
    const merged = [...categories];
    for (const def of DEFAULT_CATEGORIES) {
        if (!merged.find(c => c.slug === def.slug)) merged.push(def);
    }
    const list = merged.slice(0, 6);

    return (
        <section className="mx-auto max-w-screen-xl px-4 py-8">
            <ul className="grid grid-cols-6 gap-2 md:gap-4">
                {list.map(c => {
                    const v = CATEGORY_VISUAL[c.slug] ?? { bg: "bg-[var(--color-bg-subtle)]", emoji: "🛒" };
                    return (
                        <li key={c.id}>
                            <Link href={`/c/${c.slug}`} className="flex flex-col items-center gap-2 group">
                                <span className={`${v.bg} w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl group-hover:scale-105 transition`}>
                                    {v.emoji}
                                </span>
                                <span className="text-xs md:text-sm text-[var(--color-fg)] font-medium">{c.name}</span>
                            </Link>
                        </li>
                    );
                })}
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
const RANK_GRADIENT = [
    "from-[#7c4dff] to-[#b388ff]",
    "from-[#ef6c00] to-[#ffb74d]",
    "from-[#2e7d32] to-[#81c784]",
];

function Ranking({ items }: { items: ProductSummary[] }) {
    if (items.length === 0) {
        return (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-4 py-12 text-center text-sm text-[var(--color-fg-subtle)]">
                인기 상품이 곧 추가됩니다.
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((p, i) => (
                <Link
                    key={p.id}
                    href={`/p/${p.id}`}
                    className={`rounded-[var(--radius-lg)] bg-gradient-to-br ${RANK_GRADIENT[i]} p-5 md:p-6 text-white relative overflow-hidden hover:opacity-95 transition h-[200px] md:h-[240px] flex flex-col justify-between`}
                >
                    <span className="text-5xl md:text-6xl font-bold opacity-70">{i + 1}</span>
                    <div>
                        <p className="text-sm md:text-base font-semibold line-clamp-2">{p.name}</p>
                        <p className="mt-1 text-sm md:text-lg font-bold">{formatPrice(p.price)}</p>
                    </div>
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
const REASONS = [
    { emoji: "✅", title: "정품 인증",       sub: "공식 유통 채널 100%" },
    { emoji: "🚚", title: "빠른 배송",       sub: "평일 1~3일 출고" },
    { emoji: "🔒", title: "안전 결제",       sub: "PG 보안 + httpOnly 쿠키" },
    { emoji: "💬", title: "1:1 CS",         sub: "평일 10:00~18:00" },
    { emoji: "🎁", title: "적립금 혜택",     sub: "리뷰·구매 적립" },
    { emoji: "🆔", title: "성인 인증",       sub: "만 19세 이상" },
    { emoji: "🔄", title: "교환·환불",       sub: "수령 후 7일 이내" },
    { emoji: "📦", title: "안전 포장",       sub: "파손 방지 박스" },
];

function WhyChooseUs() {
    return (
        <Section title="엘프바를 선택해야 하는 이유">
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {REASONS.map(r => (
                    <li key={r.title} className="rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-4 md:p-5 text-center">
                        <div className="text-3xl mb-2">{r.emoji}</div>
                        <p className="text-sm font-semibold text-[var(--color-fg)]">{r.title}</p>
                        <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{r.sub}</p>
                    </li>
                ))}
            </ul>
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
    // 인스타 피드 임시 이미지 (Unsplash). 디자이너·운영자 자산 도착 시 교체.
    const photos = [
        "photo-1517048676732-d65bc937f952",
        "photo-1556228720-195a672e8a03",
        "photo-1551798507-629020c81463",
        "photo-1567721913486-6585f069b332",
        "photo-1535914254981-b5012eebbd15",
        "photo-1551038247-3d9af20df552",
        "photo-1606107557195-0e29a4b5b4aa",
        "photo-1530981785497-a62037228fe9",
    ];
    return (
        <Section title="Instagram">
            <ul className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {photos.map((p, i) => (
                    <li key={i} className="aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://images.unsplash.com/${p}?w=200&q=70`}
                            alt={`instagram ${i + 1}`}
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
    return (
        <section className="bg-gradient-to-r from-[#7c4dff] via-[#9575cd] to-[#e1bee7] py-10 md:py-14 mt-16">
            <div className="mx-auto max-w-screen-xl px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold">엘프바에 문의해주세요</h3>
                    <p className="mt-1 text-sm opacity-90">평일 10:00~18:00 · 점심 13:00~14:00</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Link
                        href="/faq"
                        className="flex-1 md:flex-none inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-white text-[var(--color-fg)] px-5 py-3 text-sm font-medium hover:bg-white/90"
                    >
                        FAQ 보기
                    </Link>
                    <Link
                        href="/notices"
                        className="flex-1 md:flex-none inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-white/40 text-white px-5 py-3 text-sm font-medium hover:bg-white/10"
                    >
                        공지사항
                    </Link>
                </div>
            </div>
        </section>
    );
}
