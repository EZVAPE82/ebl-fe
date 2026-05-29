import Link from "next/link";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "전체상품" };

/* 시안 238:8777 / 257:21753 / 257:22856 / 257:23625 / 257:24021 / 257:24445 매칭
 * 전체상품 페이지 — 시리즈 탭 + 4 cols 그리드 + 페이지네이션. */

type Series = "duke" | "iceking" | "icekingpro" | "edition" | "crosamba" | "frozen";

type Product = {
    id: number;
    series: Series;
    name: string;
    subtitle: string;
    originalPrice: number;
    discountRate: number;
    finalPrice: number;
    rating: number;
    reviewCount: number;
    thumbnailUrl: string;
    badge?: string;     // "Best 2" 같은 좌상단 뱃지
};

const SERIES_META: Record<Series, { korean: string; total: number }> = {
    duke:       { korean: "듀크",        total: 20 },
    iceking:    { korean: "아이스킹",    total: 6 },
    icekingpro: { korean: "아이스킹프로", total: 6 },
    edition:    { korean: "에디션",      total: 20 },
    crosamba:   { korean: "크로심바",    total: 5 },
    frozen:     { korean: "프로즌",      total: 2 },
};

const SERIES_ORDER: Series[] = ["duke", "iceking", "icekingpro", "edition", "crosamba", "frozen"];

// 시리즈별 mock products — 시안 매칭 (이름 / 상세타이틀 / 가격 / 평점 / 후기 placeholder)
const MOCK_PRODUCTS: Product[] = [
    // === 듀크 (DUKE) — 20개 ===
    ...Array.from({ length: 20 }, (_, i): Product => ({
        id: 1000 + i,
        series: "duke",
        name: ["블랙 DUKE", "그린 DUKE", "핑크 DUKE", "민트 DUKE", "오렌지 DUKE", "퍼플 DUKE", "골드 DUKE", "실버 DUKE"][i % 8] + ` ${(i + 1).toString().padStart(2, "0")}`,
        subtitle: ["청사과 + 멘솔", "그레이프 + 멘솔", "블루베리 + 망고", "워터멜론 + 라임", "복숭아 + 자몽", "딸기 + 바나나"][i % 6],
        originalPrice: 50000,
        discountRate: 40,
        finalPrice: 30000,
        rating: 4.9,
        reviewCount: 20 + i,
        thumbnailUrl: ["/images/elfbar-product-1.png", "/images/elfbar-product-2.png"][i % 2],
        badge: i < 4 ? "Best 2" : undefined,
    })),
    // === 아이스킹 (ICE KING) — 6개 ===
    ...Array.from({ length: 6 }, (_, i): Product => ({
        id: 2000 + i,
        series: "iceking",
        name: ["Peach Ice", "아이스킹 망고", "아이스킹 블루라즈", "아이스킹 자두", "아이스킹 멜론", "콜라_3종"][i],
        subtitle: ["피치 아이스 시원함", "망고 + 멘솔 + 아이스", "블루베리 + 라즈베리", "자두 + 청사과", "멜론 + 민트", "콜라 시원함"][i],
        originalPrice: 50000,
        discountRate: 40,
        finalPrice: 30000,
        rating: 4.9,
        reviewCount: 20 + i,
        thumbnailUrl: ["/images/elfbar-product-2.png", "/images/elfbar-product-1.png"][i % 2],
        badge: i < 4 ? "Best 2" : undefined,
    })),
    // === 아이스킹 프로 (ICE KING PRO) — 6개 ===
    ...Array.from({ length: 6 }, (_, i): Product => ({
        id: 3000 + i,
        series: "icekingpro",
        name: ["아이스킹 PRO 사과", "아이스킹 PRO 피치", "아이스킹 PRO 망고", "아이스킹 PRO 블루", "아이스킹 PRO 콜라", "아이스킹 PRO 멜론"][i],
        subtitle: ["청사과 + 아이스", "피치 + 아이스 + 시원", "망고 + 라즈베리", "블루베리 + 라즈베리", "콜라 + 망고", "멜론 + 멘솔"][i],
        originalPrice: 50000,
        discountRate: 40,
        finalPrice: 30000,
        rating: 4.9,
        reviewCount: 20 + i,
        thumbnailUrl: ["/images/elfbar-product-1.png", "/images/elfbar-product-2.png"][i % 2],
        badge: i < 4 ? "Best 2" : undefined,
    })),
    // === 에디션 (EDITION) — 8개 (시안엔 20개지만 8개로 단순화) ===
    ...Array.from({ length: 8 }, (_, i): Product => ({
        id: 4000 + i,
        series: "edition",
        name: `에디션 ${["5종", "10종", "프리미엄", "한정판", "골드", "실버", "블랙", "화이트"][i]}`,
        subtitle: "제품 상세타이틀 아이템 아이템",
        originalPrice: 50000,
        discountRate: 40,
        finalPrice: 30000,
        rating: 4.9,
        reviewCount: 20 + i,
        thumbnailUrl: ["/images/elfbar-product-2.png", "/images/elfbar-product-1.png"][i % 2],
        badge: i < 4 ? "Best 2" : undefined,
    })),
    // === 크로심바 (CROSAMBA) — 5개 ===
    ...Array.from({ length: 5 }, (_, i): Product => ({
        id: 5000 + i,
        series: "crosamba",
        name: ["딸기 + 복숭아", "민트 + 라임", "자두 + 크림 + 멘솔", "콜라 + 사이다", "포카리 + 사이다"][i],
        subtitle: ["딸기 + 복숭아 시원함", "민트 + 라임 + 아이스", "자두 + 크림 + 멘솔", "콜라 + 사이다 + 시원", "포카리 + 사이다 + 시원"][i],
        originalPrice: 50000,
        discountRate: 40,
        finalPrice: 30000,
        rating: 4.9,
        reviewCount: 20 + i,
        thumbnailUrl: ["/images/elfbar-product-1.png", "/images/elfbar-product-2.png"][i % 2],
        badge: i < 4 ? "Best 2" : undefined,
    })),
    // === 프로즌 (FROZEN) — 2개 ===
    ...Array.from({ length: 2 }, (_, i): Product => ({
        id: 6000 + i,
        series: "frozen",
        name: ["그레이프 + 베리", "포카리 + 사이다 + 가스 + 시원"][i],
        subtitle: ["그레이프 + 베리 시원함", "포카리 + 사이다 + 가스 + 시원"][i],
        originalPrice: 50000,
        discountRate: 40,
        finalPrice: 30000,
        rating: 4.9,
        reviewCount: 20 + i,
        thumbnailUrl: ["/images/elfbar-product-1.png", "/images/elfbar-product-2.png"][i % 2],
        badge: "Best 2",
    })),
];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ series?: Series }> }) {
    const sp = await searchParams;
    const active: Series = sp.series && SERIES_META[sp.series] ? sp.series : "duke";

    const filtered = MOCK_PRODUCTS.filter(p => p.series === active);
    const meta = SERIES_META[active];

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
            {/* 큰 시리즈 타이틀 (한글) */}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                {meta.korean}
            </h1>

            {/* 시리즈 탭 (사각형, 직사각형 매칭) */}
            <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                {SERIES_ORDER.map(s => (
                    <Link
                        key={s}
                        href={`/products?series=${s}`}
                        className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium transition ${
                            active === s
                                ? "bg-[var(--color-accent)] text-white"
                                : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                        }`}
                    >
                        {SERIES_META[s].korean}
                    </Link>
                ))}
            </div>

            {/* 카운트 + 우측 정렬 select */}
            <div className="flex items-center justify-between mb-4 md:mb-6 pb-3 border-b border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-fg-muted)]">
                    총 <span className="text-[var(--color-fg)] font-bold">{filtered.length}</span>개의 상품
                </p>
                <div className="relative">
                    <select className="appearance-none bg-[var(--color-surface)] border-0 pr-6 py-1 text-sm text-[var(--color-fg)] cursor-pointer focus:outline-none">
                        <option>최신순</option>
                        <option>인기순</option>
                        <option>가격 낮은순</option>
                        <option>가격 높은순</option>
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] pointer-events-none">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>

            {/* 4 cols 그리드 */}
            {filtered.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-16">상품이 없습니다.</p>
            ) : (
                <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filtered.map(p => (
                        <li key={p.id}>
                            <ProductCard product={p} />
                        </li>
                    ))}
                </ul>
            )}

            {/* 페이지네이션 (시각) */}
            {filtered.length > 0 && (
                <div className="mt-10 md:mt-14 flex justify-center items-center gap-1.5 text-sm">
                    <span className="min-w-9 h-9 inline-flex items-center justify-center bg-[var(--color-accent)] text-white font-medium">1</span>
                    {[2, 3, 4, 5].map(n => (
                        <span key={n} className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)]">{n}</span>
                    ))}
                    <span className="px-2 text-[var(--color-fg-subtle)]">…</span>
                    <span className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)]">30</span>
                    <span className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)]">›</span>
                </div>
            )}
        </div>
    );
}

function ProductCard({ product: p }: { product: Product }) {
    return (
        <Link href={`/p/${p.id}`} className="flex flex-col h-full group">
            {/* 사진 박스 1:1 + 좌상단 뱃지 */}
            <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[var(--color-bg-subtle)]">
                {p.badge && (
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center justify-center rounded-[8px] bg-[#6f70ff] text-white text-[11px] font-medium px-2 py-1">
                        {p.badge}
                    </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={p.thumbnailUrl}
                    alt={p.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
            </div>

            {/* 텍스트 */}
            <div className="mt-3 flex flex-col flex-1 space-y-1">
                <h3 className="text-sm md:text-base font-medium text-[var(--color-fg)] line-clamp-1">{p.name}</h3>
                <p className="text-xs text-[var(--color-fg-muted)] line-clamp-1">{p.subtitle}</p>
                <p className="text-xs text-[var(--color-fg-subtle)] line-through tabular-nums mt-1">
                    {formatPrice(p.originalPrice)}
                </p>
                <p className="text-sm md:text-base flex items-baseline gap-1 tabular-nums">
                    <span className="text-[var(--color-danger)] font-bold">{p.discountRate}%</span>
                    <span className="text-[var(--color-fg)] font-bold">{formatPrice(p.finalPrice)}</span>
                </p>
                <p className="text-xs text-[var(--color-fg-muted)] flex items-center gap-1 mt-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-[var(--color-fg)] font-medium">{p.rating.toFixed(1)}</span>
                    <span className="text-[var(--color-fg-subtle)]">|</span>
                    <span>{p.reviewCount}건</span>
                </p>
            </div>
        </Link>
    );
}
