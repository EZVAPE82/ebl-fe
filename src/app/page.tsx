import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { safeImageUrl, safeLinkUrl } from "@/lib/url";
import type { Banner, Page, ProductSummary } from "@/types/api";
import Link from "next/link";

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try {
        return await api<T>(path, { cache: "no-store" });
    } catch {
        return fallback;
    }
}

export default async function Home() {
    const [bannersHero, popular, newest] = await Promise.all([
        safeFetch<Banner[]>("/api/v1/public/banners?placement=MAIN_HERO", []),
        safeFetch<Page<ProductSummary>>("/api/v1/public/products?sort=popular&size=8", {
            content: [], totalElements: 0, totalPages: 0, number: 0, size: 8,
            first: true, last: true, empty: true,
        }),
        safeFetch<Page<ProductSummary>>("/api/v1/public/products?sort=newest&size=8", {
            content: [], totalElements: 0, totalPages: 0, number: 0, size: 8,
            first: true, last: true, empty: true,
        }),
    ]);

    const hero = bannersHero[0];

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-12">
            {/* Hero */}
            {hero ? (
                <Link href={safeLinkUrl(hero.linkUrl)} className="block overflow-hidden rounded-[var(--radius-lg)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={safeImageUrl(hero.imageUrl)}
                        alt={hero.altText ?? ""}
                        className="w-full h-48 md:h-72 object-cover"
                    />
                </Link>
            ) : (
                <div className="rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-fg)] to-[var(--color-fg-muted)] px-6 py-10 md:py-16 text-[var(--color-fg-inverse)]">
                    <p className="text-xs uppercase tracking-wider opacity-70 mb-2">elfbarlounge.co.kr</p>
                    <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                        정품 전자담배 기기·액상 전문몰
                    </h1>
                    <p className="mt-3 text-sm md:text-base opacity-80">
                        만 19세 이상 성인 인증 후 이용 가능합니다.
                    </p>
                </div>
            )}

            {/* BEST */}
            <section>
                <SectionTitle title="BEST" href="/c/best" />
                <ProductGrid items={popular.content} emptyText="아직 상품이 없습니다." />
            </section>

            {/* NEW */}
            <section>
                <SectionTitle title="신상품" href="/c/new" />
                <ProductGrid items={newest.content} emptyText="아직 상품이 없습니다." />
            </section>
        </div>
    );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
    return (
        <div className="flex items-end justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
            <Link href={href} className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">더보기 →</Link>
        </div>
    );
}

function ProductGrid({ items, emptyText }: { items: ProductSummary[]; emptyText: string }) {
    if (items.length === 0) {
        return (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-4 py-12 text-center text-sm text-[var(--color-fg-subtle)]">
                {emptyText}
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {items.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
    );
}
