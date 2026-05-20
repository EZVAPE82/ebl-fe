"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import type { Page, ProductSummary } from "@/types/api";

export default function WishlistPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<ProductSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const page = await api<Page<number>>("/api/v1/wishlist?size=50", { auth: true });
            const products = await Promise.all(page.content.map(async id => {
                try {
                    return await api<ProductSummary>(`/api/v1/public/products/${id}`);
                } catch { return null; }
            }));
            setItems(products.filter((p): p is ProductSummary => p !== null));
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/login?redirect=/mypage/wishlist");
        else if (user) load();
    }, [user, authLoading, load, router]);

    if (authLoading || !user) return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-8">
            <div>
                <Link href="/mypage" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">← 마이페이지</Link>
                <h1 className="text-xl md:text-2xl font-semibold mt-1 mb-6 text-[var(--color-fg)]">위시리스트</h1>
            </div>

            {loading ? (
                <p className="text-[var(--color-fg-subtle)] text-sm">불러오는 중...</p>
            ) : items.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-4 py-16 text-center">
                    <p className="text-sm text-[var(--color-fg-subtle)] mb-4">찜한 상품이 없습니다.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-5 py-3 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                    >
                        쇼핑하러 가기
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {items.map(p => <ProductCard key={p.id} p={p} />)}
                </div>
            )}
        </div>
    );
}
