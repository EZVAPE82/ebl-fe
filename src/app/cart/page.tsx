"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import type { Page, ProductDetail, ProductSummary } from "@/types/api";

/* 시안 14:9910 매칭 — 좌: 구매상품 라인 / 우: 결제정보 (회색 박스 + 큰 라운딩) */

type CartItem = {
    id: number;
    productId: number;
    productOptionId: number | null;
    quantity: number;
};
type Cart = { id: number; memberId: number; items: CartItem[] };

type CartLine = CartItem & {
    name: string;
    optionText: string | null;
    unitPrice: number;
    thumbnailUrl: string | null;
    soldOut: boolean;
    freeQuantity: number;
    promotionLabel: string | null;
};

type PromoBadge = { id: number; buyQuantity: number; getQuantity: number; label: string };

export default function CartPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
    const [lines, setLines] = useState<CartLine[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);
    const [recommend, setRecommend] = useState<ProductSummary[]>([]);

    const refresh = useCallback(async () => {
        try {
            const c = await api<Cart>("/api/v1/cart", { auth: true });
            setCart(c);
            const detailed = await Promise.all(
                c.items.map(async (it) => {
                    try {
                        const [p, promos] = await Promise.all([
                            api<ProductDetail>(`/api/v1/public/products/${it.productId}`),
                            api<PromoBadge[]>(`/api/v1/public/products/${it.productId}/promotions`).catch(() => []),
                        ]);
                        const opt = it.productOptionId
                            ? p.options.find(o => o.id === it.productOptionId)
                            : null;
                        const unitPrice = p.price + (opt?.priceDelta ?? 0);
                        const optionText = opt ? `${opt.optionGroup}: ${opt.optionValue}` : null;
                        const soldOut = opt ? opt.stock <= 0 : p.status === "SOLD_OUT";
                        const promo = promos[0];
                        const freeQuantity = promo ? Math.floor(it.quantity / promo.buyQuantity) * promo.getQuantity : 0;
                        return {
                            ...it, name: p.name, unitPrice, optionText, thumbnailUrl: p.thumbnailUrl, soldOut,
                            freeQuantity, promotionLabel: promo?.label ?? null,
                        } as CartLine;
                    } catch {
                        return {
                            ...it, name: `상품 #${it.productId}`, unitPrice: 0, optionText: null, thumbnailUrl: null, soldOut: true,
                            freeQuantity: 0, promotionLabel: null,
                        } as CartLine;
                    }
                })
            );
            setLines(detailed);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "장바구니를 불러오지 못했습니다.");
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/cart");
            return;
        }
        if (user) refresh();
    }, [user, authLoading, refresh, router]);

    // 추천 상품(실데이터) — "이 아이템도 같이 사면 좋아요" 섹션용
    useEffect(() => {
        api<Page<ProductSummary>>("/api/v1/public/products?size=4")
            .then((p) => setRecommend(p.content ?? []))
            .catch(() => setRecommend([]));
    }, []);

    async function changeQty(itemId: number, qty: number) {
        if (qty <= 0) return;
        setWorking(true);
        try {
            await api(`/api/v1/cart/items/${itemId}`, {
                method: "PUT", auth: true,
                body: JSON.stringify({ quantity: qty }),
            });
            await refresh();
        } finally { setWorking(false); }
    }

    async function removeItem(itemId: number) {
        setWorking(true);
        try {
            await api(`/api/v1/cart/items/${itemId}`, { method: "DELETE", auth: true });
            await refresh();
        } finally { setWorking(false); }
    }

    if (authLoading || !user) return <CartShell><p className="text-[var(--color-fg-subtle)]">로그인 확인 중...</p></CartShell>;
    if (error) return <CartShell><p className="text-[var(--color-danger)]">{error}</p></CartShell>;
    if (!cart) return <CartShell><p className="text-[var(--color-fg-subtle)]">불러오는 중...</p></CartShell>;

    if (lines.length === 0) {
        return (
            <CartShell>
                <div className="px-4 py-16 text-center">
                    <p className="text-sm text-[var(--color-fg-subtle)] mb-4">장바구니가 비어 있습니다.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-[8px] bg-[#3b82f6] text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition"
                    >
                        쇼핑하러 가기
                    </Link>
                </div>
            </CartShell>
        );
    }

    const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const shippingFee = 0; // 시안: "0,000원" placeholder
    const discount = 0;
    const paid = Math.max(0, total + shippingFee - discount);
    const hasSoldOut = lines.some(l => l.soldOut);

    return (
        <CartShell>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 md:gap-8">
                {/* ===== 좌: 구매상품 ===== */}
                <div>
                    <h2 className="text-base md:text-lg font-bold text-[var(--color-fg)] pb-3 border-b-2 border-[var(--color-fg)]">구매상품</h2>
                    <ul className="divide-y divide-[var(--color-border)]">
                        {lines.map(l => (
                            <li key={l.id} className="flex items-center gap-3 py-4">
                                {/* thumbnail — 사각형 (라운딩 없음) */}
                                <div className="w-16 h-16 bg-[var(--color-bg-subtle)] flex-shrink-0 overflow-hidden">
                                    {l.thumbnailUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={l.thumbnailUrl} alt={l.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                {/* 상품 정보 */}
                                <div className="flex-1 min-w-0">
                                    <Link href={`/p/${l.productId}`} className="text-sm font-medium text-[var(--color-fg)] hover:underline line-clamp-1">
                                        {l.name}
                                    </Link>
                                    <p className="text-xs text-[var(--color-fg-muted)] tabular-nums mt-0.5">#{String(l.productId).padStart(10, "2021156")}</p>
                                    {/* 모바일: 가격 인라인 노출 (데스크톱은 우측 컬럼) */}
                                    <p className="md:hidden mt-1 text-sm font-semibold text-[var(--color-fg)] tabular-nums">{formatPrice(l.unitPrice * l.quantity)}</p>
                                </div>
                                {/* 옵션변경 select — 시안: "옵션변경" 라벨 displayed (선택된 옵션은 dropdown에 표시) */}
                                {l.optionText && (
                                    <select
                                        defaultValue=""
                                        className="hidden md:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[8px] px-3 py-2 text-xs text-[var(--color-fg)] focus:outline-none cursor-pointer"
                                    >
                                        <option value="" hidden>옵션변경</option>
                                        <option value="current">{l.optionText}</option>
                                    </select>
                                )}
                                {/* 가격 */}
                                <div className="text-sm font-medium text-[var(--color-fg)] tabular-nums hidden md:block">
                                    {formatPrice(l.unitPrice * l.quantity)}
                                </div>
                                {/* 수량 (- 1 +) */}
                                <div className="flex items-center border border-[var(--color-border)] rounded-[8px]">
                                    <button
                                        onClick={() => changeQty(l.id, l.quantity - 1)}
                                        disabled={working || l.quantity <= 1}
                                        className="w-9 h-9 md:w-7 md:h-7 flex items-center justify-center text-[var(--color-fg)] disabled:opacity-40 hover:bg-[var(--color-bg-subtle)] transition"
                                    >–</button>
                                    <span className="text-sm w-8 text-center text-[var(--color-fg)] tabular-nums">{l.quantity}</span>
                                    <button
                                        onClick={() => changeQty(l.id, l.quantity + 1)}
                                        disabled={working}
                                        className="w-9 h-9 md:w-7 md:h-7 flex items-center justify-center text-[var(--color-fg)] disabled:opacity-40 hover:bg-[var(--color-bg-subtle)] transition"
                                    >+</button>
                                </div>
                                {/* X 삭제 */}
                                <button
                                    onClick={() => removeItem(l.id)}
                                    disabled={working}
                                    aria-label="삭제"
                                    className="w-7 h-7 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ===== 우: 결제정보 (sticky) — 회색 배경 + 큰 라운딩 ===== */}
                <aside className="lg:sticky lg:top-4 lg:self-start">
                    <div className="rounded-[18px] bg-[var(--color-bg-subtle)] p-5 md:p-6">
                        <h3 className="text-base md:text-lg font-bold text-[var(--color-fg)] mb-4 pb-3 border-b border-[var(--color-border)]">결제정보</h3>

                        <dl className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-[var(--color-fg-muted)]">주문금액</dt>
                                <dd className="text-[var(--color-fg)] tabular-nums">{formatPrice(total)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-[var(--color-fg-muted)]">할인 혜택</dt>
                                <dd className="text-[var(--color-fg)] tabular-nums">{discount > 0 ? `- ${formatPrice(discount)}` : "0원"}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-[var(--color-fg-muted)]">배송비</dt>
                                <dd className="text-[var(--color-fg)] tabular-nums">{shippingFee === 0 ? "0원" : formatPrice(shippingFee)}</dd>
                            </div>
                        </dl>

                        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-between items-center">
                            <span className="text-sm text-[var(--color-fg-muted)]">결제 예상 금액</span>
                            <span className="text-lg font-bold text-[var(--color-fg)] tabular-nums">{formatPrice(paid)}</span>
                        </div>

                        {/* 큰 파란색 결제하기 버튼 */}
                        <button
                            type="button"
                            onClick={() => router.push("/checkout")}
                            disabled={hasSoldOut || working}
                            className="mt-4 w-full inline-flex items-center justify-center rounded-[8px] bg-[#3b82f6] text-white py-3.5 text-sm font-bold disabled:opacity-50 hover:opacity-90 transition tabular-nums"
                        >
                            {formatPrice(paid)} 결제하기
                        </button>

                        {/* 약관 동의 (placeholder accordion) */}
                        <div className="mt-4 space-y-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4" />
                                <span className="text-[var(--color-fg)]">전체약관 동의</span>
                            </label>
                            <details className="border-t border-[var(--color-border)] pt-2">
                                <summary className="flex items-center justify-between cursor-pointer">
                                    <span className="text-[var(--color-fg-muted)]">이용약관 동의 <span className="text-[var(--color-danger)]">[필수]</span></span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                </summary>
                            </details>
                            <details className="border-t border-[var(--color-border)] pt-2">
                                <summary className="flex items-center justify-between cursor-pointer">
                                    <span className="text-[var(--color-fg-muted)]">비회원 개인정보 수집 이용동의</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                </summary>
                            </details>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ===== 이 아이템도 같이 사면 좋아요! (실제 상품) ===== */}
            {recommend.length > 0 && (
                <section className="mt-12 md:mt-16">
                    <h3 className="text-base md:text-lg font-bold text-[var(--color-fg)] mb-5">이 아이템도 같이 사면 좋아요!</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                        {recommend.map((p) => (
                            <ProductCard key={p.id} p={p} />
                        ))}
                    </div>
                </section>
            )}
        </CartShell>
    );
}

function CartShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8">
            {children}
        </div>
    );
}
