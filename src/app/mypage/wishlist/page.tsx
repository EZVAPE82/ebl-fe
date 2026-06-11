"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";
import { formatPrice, productHref } from "@/lib/format";
import type { Page, ProductSummary } from "@/types/api";

/**
 * 위시리스트 — Figma 위시리스트 spec 매칭.
 *  - 좌측: MyPageSideNav (위시리스트 active by pathname)
 *  - 우측(main flex-1 lg:w-[1000px]): 타이틀 + 컨트롤(전체선택/선택제품삭제) + 리스트
 *    (체크박스 + 썸네일 90×108 + 이름·#id + 가격 + 수량 스테퍼 + 장바구니/구매하기 + 삭제X)
 *    + "전체상품 주문" 버튼.
 *
 * 데이터/인증 보존: useAuth 가드 + /login 리다이렉트, 위시리스트 페치(GET /api/v1/wishlist),
 * 상품 상세 페치(GET /api/v1/public/products/{id}), 위시 삭제(DELETE /api/v1/wishlist/{id}),
 * 장바구니 담기(POST /api/v1/cart/items {productId, quantity}). 레이아웃/스타일만 시안에 맞춰 재구성.
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

    /** 단일 상품 장바구니 담기 (현재 수량 반영). */
    async function addToCart(productId: number) {
        setWorking(true);
        try {
            await api("/api/v1/cart/items", {
                method: "POST",
                auth: true,
                body: JSON.stringify({ productId, quantity: getQty(productId) }),
            });
            alert("장바구니에 담았습니다.");
        } catch {
            alert("장바구니 담기에 실패했습니다.");
        } finally {
            setWorking(false);
        }
    }

    /** 주어진 상품들을 장바구니에 담는다(수량 반영). 실패 시 false. */
    async function addManyToCart(products: ProductSummary[]): Promise<boolean> {
        try {
            for (const p of products) {
                await api("/api/v1/cart/items", {
                    method: "POST",
                    auth: true,
                    body: JSON.stringify({ productId: p.id, quantity: getQty(p.id) }),
                });
            }
            return true;
        } catch {
            return false;
        }
    }

    /** 단일 구매: 장바구니 담은 뒤 결제 페이지로. */
    async function buyNow(p: ProductSummary) {
        setWorking(true);
        try {
            const ok = await addManyToCart([p]);
            if (ok) router.push("/checkout");
            else alert("주문을 시작하지 못했습니다.");
        } finally {
            setWorking(false);
        }
    }

    /** 전체상품 주문: 위시리스트 전 상품을 담은 뒤 결제 페이지로. */
    async function orderAll() {
        if (items.length === 0) return;
        setWorking(true);
        try {
            const ok = await addManyToCart(items);
            if (ok) router.push("/checkout");
            else alert("주문을 시작하지 못했습니다.");
        } finally {
            setWorking(false);
        }
    }

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 text-[14px] text-[#767676]">
                불러오는 중...
            </div>
        );
    }

    const allChecked = items.length > 0 && selected.size === items.length;

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row gap-20">
            <MyPageSideNav />

            <main className="flex-1 lg:w-[1000px] flex flex-col items-center gap-[60px]">
                <section className="w-full flex flex-col gap-10 border-b border-[#E5E5EC]">
                    {/* 타이틀 */}
                    <div className="h-11 flex items-end">
                        <h2 className="text-[32px] font-bold text-[#000]">위시리스트</h2>
                    </div>

                    {/* 컨트롤 + 리스트 */}
                    <div className="w-full flex flex-col gap-3">
                        {/* 컨트롤 바 */}
                        <div className="flex justify-between items-end">
                            <button
                                type="button"
                                onClick={toggleAll}
                                disabled={items.length === 0}
                                className="flex items-center gap-2 disabled:opacity-40"
                            >
                                <CheckBox checked={allChecked} />
                                <span className="text-[14px] font-medium text-[#000]">전체선택</span>
                            </button>
                            <button
                                type="button"
                                onClick={removeSelected}
                                disabled={working || selected.size === 0}
                                className="text-[14px] font-light text-[#767676] disabled:opacity-40"
                            >
                                선택제품삭제
                            </button>
                        </div>

                        {/* 리스트 */}
                        {loading ? (
                            <p className="border-t border-[#222222] py-16 text-center text-[14px] text-[#767676]">
                                불러오는 중...
                            </p>
                        ) : items.length === 0 ? (
                            <div className="border-t border-[#222222] py-20 flex flex-col items-center gap-4">
                                <p className="text-[14px] text-[#767676]">위시리스트가 비어 있습니다.</p>
                                <Link
                                    href="/products"
                                    className="px-5 py-2.5 rounded-[4px] bg-[#0072DD] text-white text-[14px] font-medium"
                                >
                                    상품 보러가기
                                </Link>
                            </div>
                        ) : (
                            <ul className="border-t border-[#222222] flex flex-col">
                                {items.map(p => (
                                    <li
                                        key={p.id}
                                        className="py-3 border-b border-[#DDDDDD] flex flex-wrap justify-between items-center gap-3"
                                    >
                                        {/* 좌측: 체크 + 썸네일 + 이름·코드 */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleOne(p.id)}
                                                aria-label={`${p.name} 선택`}
                                            >
                                                <CheckBox checked={selected.has(p.id)} />
                                            </button>
                                            <Link
                                                href={productHref(p)}
                                                className="w-[90px] h-[108px] rounded-[4px] overflow-hidden bg-[#F6F7FB] shrink-0"
                                            >
                                                {p.thumbnailUrl && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={p.thumbnailUrl}
                                                        alt={p.name}
                                                        className="w-[90px] h-[108px] rounded-[4px] object-cover bg-[#F6F7FB]"
                                                    />
                                                )}
                                            </Link>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <Link
                                                    href={productHref(p)}
                                                    className="text-[16px] font-medium text-[#000] line-clamp-1 hover:underline"
                                                >
                                                    {p.name}
                                                </Link>
                                                <span className="text-[14px] font-light text-[#767676]">
                                                    #{p.id}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 가격 */}
                                        <div className="w-[184px] text-center text-[14px] font-medium text-[#000] tabular-nums">
                                            {formatPrice(p.price)}
                                        </div>

                                        {/* 수량 스테퍼 */}
                                        <div className="w-[184px] flex items-center justify-center gap-3 text-[14px] text-[#000]">
                                            <button
                                                type="button"
                                                onClick={() => changeQty(p.id, -1)}
                                                disabled={working || getQty(p.id) <= 1}
                                                aria-label="수량 감소"
                                                className="w-7 h-7 flex items-center justify-center rounded-[4px] border border-[#E5E5EC] hover:bg-[#F6F7FB] disabled:opacity-40"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 text-center tabular-nums">{getQty(p.id)}</span>
                                            <button
                                                type="button"
                                                onClick={() => changeQty(p.id, +1)}
                                                disabled={working}
                                                aria-label="수량 증가"
                                                className="w-7 h-7 flex items-center justify-center rounded-[4px] border border-[#E5E5EC] hover:bg-[#F6F7FB] disabled:opacity-40"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* 액션: 장바구니 / 구매하기 / 삭제 */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => addToCart(p.id)}
                                                disabled={working}
                                                className="w-[108px] p-3 rounded-[4px] border border-[#222222] text-center text-[14px] font-medium text-[#222] hover:bg-[#F6F7FB] disabled:opacity-40"
                                            >
                                                장바구니
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => buyNow(p)}
                                                disabled={working}
                                                className="w-[108px] p-3 rounded-[4px] bg-[#0072DD] text-center text-white text-[14px] font-medium hover:bg-[#005fb8] disabled:opacity-40"
                                            >
                                                구매하기
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeOne(p.id)}
                                                disabled={working}
                                                aria-label="위시리스트에서 제거"
                                                className="ml-1 disabled:opacity-40"
                                            >
                                                <DeleteXIcon />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* 전체상품 주문 */}
                {items.length > 0 && (
                    <button
                        type="button"
                        onClick={orderAll}
                        disabled={working}
                        className="w-[200px] p-4 bg-[#222222] rounded-[4px] text-center text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-40"
                    >
                        전체상품 주문
                    </button>
                )}
            </main>
        </div>
    );
}

/** 22px 체크박스 — 미선택: 흰 배경 + 회색 보더 / 선택: #0072DD + 흰 체크 */
function CheckBox({ checked }: { checked: boolean }) {
    return (
        <span
            className={`w-[22px] h-[22px] rounded-[4px] border flex items-center justify-center ${
                checked ? "bg-[#0072DD] border-[#0072DD]" : "bg-white border-[#E5E5EC]"
            }`}
        >
            {checked && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 7.2l2.6 2.6L11 4.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </span>
    );
}

/** 16px 삭제 X 아이콘 (stroke #222) */
function DeleteXIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="#222222" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
