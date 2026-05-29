"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";
import { formatPrice } from "@/lib/format";
import type { Page, ProductSummary } from "@/types/api";

/**
 * 위시리스트 페이지 — 시안 37:12671 매칭
 *  - 좌측: MyPageSideNav
 *  - 우측: 위시리스트 list view (체크박스 + 썸네일 + 이름·코드 + 가격 + 수량 + 장바구니/구매하기/X)
 *  - 하단: 페이지네이션 + "전체상품 주문" 검정 버튼
 */
export default function WishlistPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<ProductSummary[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);

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

    // 로그인 redirect / 초기 로드 — 기존 mypage 페이지들과 동일 패턴.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!authLoading && !user) router.replace("/login?redirect=/mypage/wishlist");
        else if (user) load();
    }, [user, authLoading, load, router]);
    /* eslint-enable react-hooks/set-state-in-effect */

    function toggleAll() {
        if (selected.size === items.length) setSelected(new Set());
        else setSelected(new Set(items.map(i => i.id)));
    }
    function toggleOne(id: number) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    async function removeOne(id: number) {
        setWorking(true);
        try {
            await api(`/api/v1/wishlist/${id}`, { method: "DELETE", auth: true });
            setItems(prev => prev.filter(i => i.id !== id));
            setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        } finally { setWorking(false); }
    }
    async function removeSelected() {
        if (selected.size === 0) return;
        if (!confirm(`선택한 ${selected.size}개 상품을 위시리스트에서 제거합니다.`)) return;
        setWorking(true);
        try {
            await Promise.all(Array.from(selected).map(id =>
                api(`/api/v1/wishlist/${id}`, { method: "DELETE", auth: true }).catch(() => null)
            ));
            await load();
            setSelected(new Set());
        } finally { setWorking(false); }
    }
    async function addToCart(productId: number) {
        try {
            await api("/api/v1/cart/items", {
                method: "POST", auth: true,
                body: JSON.stringify({ productId, quantity: 1 }),
            });
            alert("장바구니에 담았습니다.");
        } catch {
            alert("장바구니 담기에 실패했습니다.");
        }
    }
    function buyNow(productId: number) {
        // 단순 구매하기: 상품상세로 보내고 거기서 결제 흐름 진입
        router.push(`/p/${productId}`);
    }

    if (authLoading || !user) {
        return <div className="mx-auto max-w-screen-2xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    const allChecked = items.length > 0 && selected.size === items.length;

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 md:py-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 md:gap-12">
            <MyPageSideNav />

            <section>
                <h2 className="text-xl md:text-2xl font-bold mb-6 text-[var(--color-fg)]">위시리스트</h2>

                {loading ? (
                    <p className="text-[var(--color-fg-subtle)] text-sm">불러오는 중...</p>
                ) : items.length === 0 ? (
                    <div className="rounded-[var(--radius-lg)] px-4 py-16 text-center">
                        <p className="text-sm text-[var(--color-fg-subtle)] mb-4">찜한 상품이 없습니다.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-5 py-3 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                        >
                            쇼핑하러 가기
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* 상단 컨트롤 — 전체선택 / 선택제품 삭제 */}
                        <div className="flex items-center justify-between border-y border-[var(--color-border)] py-3 px-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer text-[var(--color-fg)]">
                                <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={toggleAll}
                                    className="w-4 h-4 accent-[var(--color-brand)]"
                                />
                                <span>전체선택</span>
                            </label>
                            <button
                                type="button"
                                onClick={removeSelected}
                                disabled={working || selected.size === 0}
                                className="text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] disabled:opacity-40"
                            >
                                선택제품삭제
                            </button>
                        </div>

                        {/* 리스트 */}
                        <ul className="divide-y divide-[var(--color-border)]">
                            {items.map(p => (
                                <li key={p.id} className="flex items-center gap-3 md:gap-4 py-4 px-2">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(p.id)}
                                        onChange={() => toggleOne(p.id)}
                                        className="w-4 h-4 accent-[var(--color-brand)] flex-shrink-0"
                                        aria-label={`${p.name} 선택`}
                                    />
                                    <Link href={`/p/${p.id}`} className="w-16 h-16 md:w-20 md:h-20 rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] overflow-hidden flex-shrink-0">
                                        {p.thumbnailUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                                        )}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/p/${p.id}`} className="text-sm font-medium text-[var(--color-fg)] hover:underline line-clamp-1">
                                            {p.name}
                                        </Link>
                                        <div className="text-xs text-[var(--color-fg-subtle)] mt-0.5">#{p.id.toString().padStart(10, "0")}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-[var(--color-fg)] w-24 md:w-32 text-right hidden sm:block">
                                        {formatPrice(p.price)}
                                    </div>
                                    <div className="text-xs text-[var(--color-fg-muted)] w-10 text-center hidden sm:block">1개</div>
                                    <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => addToCart(p.id)}
                                            disabled={working}
                                            className="text-xs px-2.5 md:px-3 py-1.5 border border-[var(--color-border-strong)] rounded-[var(--radius-sm)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-40"
                                        >
                                            장바구니
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => buyNow(p.id)}
                                            disabled={working}
                                            className="text-xs px-2.5 md:px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-40"
                                        >
                                            구매하기
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeOne(p.id)}
                                        disabled={working}
                                        aria-label="제거"
                                        className="ml-1 md:ml-2 text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] text-lg leading-none disabled:opacity-40"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* 페이지네이션 (MVP: 단일 페이지) */}
                        <div className="mt-6 flex items-center justify-center gap-1 text-xs text-[var(--color-fg-muted)]">
                            <span className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white font-medium">1</span>
                        </div>

                        {/* 전체 주문 */}
                        <div className="mt-8 flex justify-center">
                            <button
                                type="button"
                                onClick={() => alert("전체 상품 주문은 다음 단계에서 구현됩니다.")}
                                disabled={items.length === 0}
                                className="px-10 py-3 rounded-[var(--radius-sm)] bg-[var(--color-fg)] text-[var(--color-bg)] text-sm font-medium hover:opacity-90 disabled:opacity-40"
                            >
                                전체상품 주문
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
