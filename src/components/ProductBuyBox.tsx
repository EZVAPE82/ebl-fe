"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export type BuyOption = {
    id: number;
    optionGroup: string;
    optionValue: string;
    priceDelta: number;
    stock: number;
};

type Props = {
    productId: number;
    basePrice: number;
    options: BuyOption[];
    /** 옵션 없는 상품의 품절 여부(상품 레벨 재고 0). */
    productSoldOut?: boolean;
};

/**
 * 상품 상세 구매 영역 — 옵션/수량/총액 인터랙티브 + 장바구니·바로구매·찜 실제 동작.
 * 서버 컴포넌트(page.tsx)에서 직렬화 가능한 데이터만 받아 클라이언트로 동작.
 * PC 인라인 버튼 + 모바일 하단 고정 바를 같은 상태로 함께 렌더.
 */
export function ProductBuyBox({ productId, basePrice, options, productSoldOut = false }: Props) {
    const router = useRouter();
    const groups = useMemo(() => Array.from(new Set(options.map((o) => o.optionGroup))), [options]);
    const hasOptions = options.length > 0;

    const [selected, setSelected] = useState<Record<string, number | "">>(
        () => Object.fromEntries(groups.map((g) => [g, ""]))
    );
    const [qty, setQty] = useState(1);
    const [busy, setBusy] = useState(false);
    const [wished, setWished] = useState(false);

    const chosen = groups
        .map((g) => options.find((o) => o.id === selected[g]))
        .filter((o): o is BuyOption => Boolean(o));
    const allSelected = !hasOptions || groups.every((g) => selected[g] !== "");
    // 장바구니 모델은 라인당 옵션 1개 — 선택된 첫 옵션 id 사용(대부분 단일 그룹).
    const cartOptionId = chosen.length > 0 ? chosen[0].id : undefined;

    const unitPrice = basePrice + chosen.reduce((s, o) => s + o.priceDelta, 0);
    const total = unitPrice * qty;
    const soldOut = productSoldOut || (hasOptions && options.every((o) => o.stock <= 0));
    const maxQty = chosen.length > 0 ? Math.max(1, Math.min(99, ...chosen.map((o) => o.stock || 99))) : 99;
    const clampQty = (n: number) => Math.max(1, Math.min(maxQty, n));

    async function add(buyNow: boolean) {
        if (soldOut || busy) return;
        if (hasOptions && !allSelected) {
            alert("옵션을 선택해주세요.");
            return;
        }
        setBusy(true);
        try {
            await api("/api/v1/cart/items", {
                method: "POST",
                auth: true,
                body: JSON.stringify({ productId, productOptionId: cartOptionId, quantity: qty }),
            });
            if (buyNow) {
                router.push("/checkout");
            } else if (confirm("장바구니에 담았습니다. 장바구니로 이동할까요?")) {
                router.push("/cart");
            }
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) {
                router.push(`/login?redirect=/p/${productId}`);
            } else {
                alert("장바구니 담기에 실패했습니다. 잠시 후 다시 시도해주세요.");
            }
        } finally {
            setBusy(false);
        }
    }

    async function toggleWish() {
        try {
            await api(`/api/v1/wishlist/${productId}`, { method: wished ? "DELETE" : "POST", auth: true });
            setWished((w) => !w);
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) {
                router.push(`/login?redirect=/p/${productId}`);
            } else {
                alert("잠시 후 다시 시도해주세요.");
            }
        }
    }

    return (
        <>
            {hasOptions && (
                <div className="space-y-2.5 pt-2">
                    {groups.map((group) => {
                        const opts = options.filter((o) => o.optionGroup === group);
                        return (
                            <div key={group} className="grid grid-cols-[64px_1fr] md:grid-cols-[80px_1fr] gap-3 items-center">
                                <label className="text-xs font-medium text-[var(--color-fg-muted)]">{group}</label>
                                <select
                                    value={selected[group]}
                                    onChange={(e) =>
                                        setSelected((s) => ({ ...s, [group]: e.target.value ? Number(e.target.value) : "" }))
                                    }
                                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[8px] px-3 py-2.5 text-sm text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-fg-muted)] cursor-pointer"
                                >
                                    <option value="">{group} 선택</option>
                                    {opts.map((o) => (
                                        <option key={o.id} value={o.id} disabled={o.stock <= 0}>
                                            {o.optionValue}
                                            {o.priceDelta !== 0 ? ` (+${formatPrice(o.priceDelta)})` : ""}
                                            {o.stock <= 0 ? " — 품절" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 수량 stepper (44px 탭타깃) */}
            <div className="grid grid-cols-[64px_1fr] md:grid-cols-[80px_1fr] gap-3 items-center pt-2.5">
                <label className="text-xs font-medium text-[var(--color-fg-muted)]">수량</label>
                <div className="inline-flex items-center rounded-[8px] border border-[var(--color-border)] w-fit">
                    <button type="button" aria-label="수량 감소" disabled={qty <= 1}
                        onClick={() => setQty((q) => clampQty(q - 1))}
                        className="w-11 h-11 flex items-center justify-center text-lg text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] disabled:opacity-30">−</button>
                    <span className="w-12 text-center text-sm font-semibold tabular-nums">{qty}</span>
                    <button type="button" aria-label="수량 증가" disabled={qty >= maxQty}
                        onClick={() => setQty((q) => clampQty(q + 1))}
                        className="w-11 h-11 flex items-center justify-center text-lg text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] disabled:opacity-30">+</button>
                </div>
            </div>

            {/* 총액 */}
            <div className="flex items-baseline justify-between pt-3 mt-3 border-t border-[var(--color-border)]">
                <span className="text-sm text-[var(--color-fg-muted)]">총 결제 금액</span>
                <span className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] tabular-nums">{formatPrice(total)}</span>
            </div>

            {/* PC 액션 */}
            <div className="hidden md:flex gap-3 pt-3">
                <button type="button" aria-label="찜하기" onClick={toggleWish}
                    className={`shrink-0 inline-flex items-center justify-center w-14 h-12 rounded-[8px] border transition ${wished ? "border-[var(--color-fg)] bg-[var(--color-fg)] text-white" : "border-[var(--color-border-strong)] bg-white text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"}`}>
                    <HeartIcon filled={wished} />
                </button>
                <button type="button" disabled={soldOut || busy} onClick={() => add(false)}
                    className="flex-1 inline-flex items-center justify-center rounded-[8px] border border-[var(--color-fg)] bg-white text-[var(--color-fg)] py-3.5 text-sm font-bold hover:bg-[var(--color-bg-subtle)] transition disabled:opacity-50">
                    {soldOut ? "품절" : "장바구니"}
                </button>
                <button type="button" disabled={soldOut || busy} onClick={() => add(true)}
                    className="flex-1 inline-flex items-center justify-center rounded-[8px] bg-[var(--color-fg)] text-[var(--color-bg)] py-3.5 text-sm font-bold hover:opacity-90 transition disabled:opacity-50">
                    바로구매
                </button>
            </div>

            {/* 모바일 하단 고정 바 */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
                <div className="flex items-stretch gap-2 px-4 py-3">
                    <button type="button" aria-label="찜하기" onClick={toggleWish}
                        className={`shrink-0 inline-flex items-center justify-center w-12 rounded-[8px] border ${wished ? "border-[var(--color-fg)] bg-[var(--color-fg)] text-white" : "border-[var(--color-border-strong)] text-[var(--color-fg)]"}`}>
                        <HeartIcon filled={wished} />
                    </button>
                    <button type="button" disabled={soldOut || busy} onClick={() => add(false)}
                        className="flex-1 inline-flex items-center justify-center rounded-[8px] border border-[var(--color-fg)] py-3 text-sm font-bold text-[var(--color-fg)] disabled:opacity-50">
                        {soldOut ? "품절" : "장바구니"}
                    </button>
                    <button type="button" disabled={soldOut || busy} onClick={() => add(true)}
                        className="flex-1 inline-flex items-center justify-center rounded-[8px] bg-[var(--color-fg)] py-3 text-sm font-bold text-[var(--color-bg)] disabled:opacity-50">
                        바로구매
                    </button>
                </div>
            </div>
        </>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );
}
