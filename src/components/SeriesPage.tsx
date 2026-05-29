import Link from "next/link";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import type { Page, ProductSummary } from "@/types/api";

/**
 * 시리즈 소개 페이지 공통 — duke / icekim-pro / iceking 등.
 *
 *  - Hero 배너 (시리즈 명 + 카피 + 브랜드 컬러)
 *  - 시리즈에 속한 상품 그리드 (일회용 카테고리 + name like 검색)
 *
 * 정확한 시리즈 매칭은 백엔드 product.name like '{series}%' 로 단순 처리.
 * 추후 product 에 series 컬럼 추가 시 그걸로 정밀 매칭.
 */
export type SeriesPageProps = {
    series: string;        // 표시명 (예: "ELFBAR DUKE")
    subtitle: string;
    description: string;
    nameKeyword: string;   // product.name 검색 키워드 (예: "DUKE")
    accentColor: string;   // hero 배경 그라데이션 시작 색
    accentColor2: string;
};

export async function SeriesPage(props: SeriesPageProps) {
    let products: ProductSummary[] = [];
    try {
        const res = await api<Page<ProductSummary>>(
            `/api/v1/public/products?keyword=${encodeURIComponent(props.nameKeyword)}&size=24`,
            { cache: "no-store" }
        );
        products = res.content ?? [];
    } catch { /* swallow */ }

    return (
        <div className="bg-[var(--color-bg)] min-h-screen">
            {/* Hero — 시리즈 명 + 카피 */}
            <section
                className="relative w-full overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${props.accentColor} 0%, ${props.accentColor2} 100%)`,
                    minHeight: "320px",
                }}
            >
                <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-12 md:py-20 text-white">
                    <Link
                        href="/c/disposable"
                        className="text-xs md:text-sm text-white/80 hover:text-white"
                    >
                        ← 일회용 카테고리
                    </Link>
                    <p className="mt-6 md:mt-8 text-xs md:text-sm tracking-[0.2em] uppercase opacity-90">
                        Signature Series
                    </p>
                    <h1 className="mt-2 text-3xl md:text-5xl font-bold leading-tight">
                        {props.series}
                    </h1>
                    <p className="mt-3 md:mt-4 text-base md:text-lg opacity-90">
                        {props.subtitle}
                    </p>
                    <p className="mt-3 md:mt-4 text-sm md:text-base opacity-75 max-w-2xl leading-relaxed">
                        {props.description}
                    </p>
                </div>
            </section>

            {/* 상품 그리드 */}
            <section className="mx-auto max-w-screen-2xl px-4 md:px-8 py-10 md:py-16">
                <header className="mb-6 md:mb-8 flex items-end justify-between">
                    <div>
                        <p className="text-xs text-[var(--color-fg-muted)]">Products</p>
                        <h2 className="mt-1 text-lg md:text-2xl font-bold text-[var(--color-fg)]">
                            {props.series} 라인업
                        </h2>
                    </div>
                    <Link
                        href={`/c/disposable`}
                        className="text-xs md:text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                    >
                        전체 보기 →
                    </Link>
                </header>

                {products.length === 0 ? (
                    <p className="py-16 text-center text-sm text-[var(--color-fg-subtle)]">
                        곧 새로운 라인업으로 찾아뵙겠습니다.
                    </p>
                ) : (
                    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map(p => (
                            <li key={p.id}>
                                <ProductCard product={p} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* 하단 CTA */}
            <section className="mx-auto max-w-screen-2xl px-4 md:px-8 pb-12 md:pb-20">
                <div className="rounded-[18px] bg-[var(--color-bg-subtle)] px-6 md:px-12 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-sm md:text-base font-semibold text-[var(--color-fg)]">
                            아직 결정하지 못하셨나요?
                        </p>
                        <p className="mt-1 text-xs md:text-sm text-[var(--color-fg-muted)]">
                            전체 일회용 라인업을 한눈에 비교해보세요.
                        </p>
                    </div>
                    <Link
                        href="/c/disposable"
                        className="inline-flex items-center justify-center rounded-[18px] bg-[var(--color-fg)] text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition whitespace-nowrap"
                    >
                        일회용 전체 보기
                    </Link>
                </div>
            </section>
        </div>
    );
}
