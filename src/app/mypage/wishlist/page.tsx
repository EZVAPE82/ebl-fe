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
            // 1) productId 목록 fetch
            const page = await api<Page<number>>("/api/v1/wishlist?size=50", { auth: true });
            // 2) 각 상품 summary
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

    if (authLoading || !user) return <div className="mx-auto max-w-3xl px-4 py-10 text-zinc-500">불러오는 중...</div>;

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-8">
            <div>
                <Link href="/mypage" className="text-xs text-zinc-500 hover:text-black">← 마이페이지</Link>
                <h1 className="text-xl md:text-2xl font-bold mt-1 mb-6">위시리스트</h1>
            </div>

            {loading ? (
                <p className="text-zinc-500 text-sm">불러오는 중...</p>
            ) : items.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-300 px-4 py-16 text-center">
                    <p className="text-sm text-zinc-500 mb-4">찜한 상품이 없습니다.</p>
                    <Link href="/" className="inline-block rounded-md bg-zinc-900 text-white px-4 py-2 text-sm">쇼핑하러 가기</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {items.map(p => <ProductCard key={p.id} p={p} />)}
                </div>
            )}
        </div>
    );
}
