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
 * 위시리스트 — 마이페이지 일관 스타일 (rounded-md, 블루 #3b82f6 액센트, 회색 패널).
 *  - 좌측: MyPageSideNav
 *  - 우측: 헤더 + 컨트롤바(전체선택/선택삭제) + 리스트(체크박스+썸네일+이름·코드+가격+수량+버튼) + 페이지네이션 + 전체주문
 */
export default function WishlistPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<ProductSummary[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [qty, setQty] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);

    function getQty(id: number) {
        return qty[id] ?? 1;
    }
    function changeQty(id: number, delta: number) {
        setQty(prev => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));
    }

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const page = await api<Page<number>>("/api/v1/wishlist?size=50", { auth: true });
            const products = await Promise.all(
                page.content.map(async id => {
                    try {
                        return await api<ProductSummary>(`/api/v1/public/products/${id}`);
                    } catch {
                        return null;
                    }
                })
            );
            setItems(products.filter((p): p is ProductSummary => p !== null));
        } finally {
            setLoading(false);
        }
    }, []);

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
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function removeOne(id: number) {
        setWorking(true);
        try {
            await api(`/api/v1/wishlist/${id}`, { method: "DELETE", auth: true });
            setItems(prev => prev.filter(i => i.id !== id));
            setSelected(prev => {
                const n = new Set(prev);
                n.delete(id);
                return n;
            });
        } finally {
            setWorking(false);
        }
    }

    async function removeSelected() {
        if (selected.size === 0) return;
        if (!confirm(`선택한 ${selected.size}개 상품을 위시리스트에서 제거합니다.`)) return;
        setWorking(true);
        try {
            await Promise.all(
                Array.from(selected).map(id =>
                    api(`/api/v1/wishlist/${id}`, { method: "DELETE", auth: true }).catch(() => null)
                )
            );
            await load();
            setSelected(new Set());
        } finally {
            setWorking(false);
        }
    }

    async function addToCart(productId: number) {
        try {
            await api("/api/v1/cart/items", {
                method: "POST",
                auth: true,
                body: JSON.stringify({ productId, quantity: getQty(productId) }),
            });
            alert("장바구니에 담았습니다.");
        } catch {
            alert("장바구니 담기에 실패했습니다.");
        }
    }

    function buyNow(productId: number) {
        router.push(`/p/${productId}`);
    }

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-10 text-[var(--color-fg-subtle)]">
                불러오는 중...
            </div>
        );
    }

    const allChecked = items.length > 0 && selected.size === items.length;

    return (
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            <MyPageSideNav />

            <div>
                {/* 시안 37:12671 — 헤더 굵은 검정 보더 없음, 단순 타이틀 */}
                <header className="mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-fg)]">위시리스트</h2>
                </header>

                {loading ? (
                    <p className="text-sm text-[var(--color-fg-subtle)] py-10 text-center">불러오는 중...</p>
                ) : items.length === 0 ? (
                    <div className="rounded-xl bg-[var(--color-bg-subtle)] px-4 py-16 text-center">
                        <p className="text-sm text-[var(--color-fg-muted)] mb-4">찜한 상품이 없습니다.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-md bg-[#3b82f6] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#2563eb]"
                        >
                            쇼핑하러 가기
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* 컨트롤 바 */}
                        <div className="flex items-center justify-between border-y border-[var(--color-border)] py-3 px-1 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer text-[var(--color-fg)]">
                                <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={toggleAll}
                                    className="w-4 h-4 accent-[#3b82f6]"
                                />
                                <span>전체선택</span>
                            </label>
                            <button
                                type="button"
                                onClick={removeSelected}
                                disabled={working || selected.size === 0}
                                className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] disabled:opacity-40"
                            >
                                선택제품삭제
                            </button>
                        </div>

                        {/* 리스트 */}
                        <ul className="divide-y divide-[var(--color-border)]">
                            {items.map(p => (
                                <li key={p.id} className="flex items-center gap-3 md:gap-4 py-4 px-1">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(p.id)}
                                        onChange={() => toggleOne(p.id)}
                                        className="w-4 h-4 accent-[#3b82f6] flex-shrink-0"
                                        aria-label={`${p.name} 선택`}
                                    />
                                    <Link
                                        href={`/p/${p.id}`}
                                        className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-[var(--color-bg-subtle)] overflow-hidden flex-shrink-0"
                                    >
                                        {p.thumbnailUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                                        )}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/p/${p.id}`}
                                            className="text-sm font-medium text-[var(--color-fg)] hover:underline line-clamp-1"
                                        >
                                            {p.name}
                                        </Link>
                                        <div className="text-xs text-[var(--color-fg-subtle)] mt-0.5">
                                            #{p.id.toString().padStart(10, "0")}
                                        </div>
                                    </div>
                                    <div className="hidden sm:block text-sm font-semibold text-[var(--color-fg)] w-24 md:w-32 text-right tabular-nums">
                                        {formatPrice(p.price)}
                                    </div>
                                    {/* 시안: [- 1 +] 수량 카운터 */}
                                    <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-fg)]">
                                        <button
                                            type="button"
                                            onClick={() => changeQty(p.id, -1)}
                                            disabled={working || getQty(p.id) <= 1}
                                            aria-label="수량 감소"
                                            className="w-6 h-6 flex items-center justify-center border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-40"
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center tabular-nums">{getQty(p.id)}</span>
                                        <button
                                            type="button"
                                            onClick={() => changeQty(p.id, +1)}
                                            disabled={working}
                                            aria-label="수량 증가"
                                            className="w-6 h-6 flex items-center justify-center border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-40"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => addToCart(p.id)}
                                            disabled={working}
                                            className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-border-strong)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-40"
                                        >
                                            장바구니
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => buyNow(p.id)}
                                            disabled={working}
                                            className="text-xs px-3 py-1.5 rounded-md bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-40"
                                        >
                                            구매하기
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeOne(p.id)}
                                        disabled={working}
                                        aria-label="제거"
                                        className="ml-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] text-lg leading-none disabled:opacity-40"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* 페이지네이션 — 시안: 1 2 3 4 5 ... 30 > */}
                        <nav className="mt-6 flex items-center justify-center gap-1 text-sm text-[var(--color-fg-muted)]">
                            <button
                                className="w-8 h-8 rounded-md bg-[#3b82f6] text-white font-medium"
                                aria-current="page"
                            >
                                1
                            </button>
                            {[2, 3, 4, 5].map(n => (
                                <button key={n} className="w-8 h-8 rounded-md hover:bg-[var(--color-bg-subtle)]">
                                    {n}
                                </button>
                            ))}
                            <span className="px-1">...</span>
                            <button className="w-8 h-8 rounded-md hover:bg-[var(--color-bg-subtle)]">30</button>
                            <button className="w-8 h-8 rounded-md hover:bg-[var(--color-bg-subtle)]" aria-label="다음 페이지">
                                &gt;
                            </button>
                        </nav>

                        {/* 전체 주문 */}
                        <div className="mt-8 flex justify-center">
                            <button
                                type="button"
                                onClick={() => alert("전체 상품 주문은 다음 단계에서 구현됩니다.")}
                                disabled={items.length === 0}
                                className="px-10 py-3 rounded-md bg-[var(--color-fg)] text-[var(--color-bg)] text-sm font-medium hover:opacity-90 disabled:opacity-40 min-w-[160px]"
                            >
                                전체상품 주문
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
