"use client";

import { useState, useRef, useEffect } from "react";
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

export type Sibling = { id: number; name: string; price: number };

type Props = {
    productId: number;
    productName: string;
    basePrice: number;
    siblings: Sibling[];
    options?: BuyOption[];
    /** 옵션 없는 상품의 품절 여부(상품 레벨 재고 0). */
    productSoldOut?: boolean;
};

type LineItem = { id: number; name: string; unitPrice: number; qty: number };

/**
 * 상품 상세 구매 영역 — 시안 14:3437 (멀티-맛 선택).
 * 동일제품/다른맛 드롭다운 → 맛 선택 시 선택상품 리스트에 추가(수량±/삭제) →
 * 상품금액 합계(할인적용) → 찜/장바구니/바로구매. 여러 맛을 한 번에 장바구니로.
 */
export function ProductBuyBox({ productId, productName, basePrice, siblings, productSoldOut = false }: Props) {
    const router = useRouter();
    const [items, setItems] = useState<LineItem[]>([
        { id: productId, name: productName, unitPrice: basePrice, qty: 1 },
    ]);
    const [busy, setBusy] = useState(false);
    const [wished, setWished] = useState(false);

    const total = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const soldOut = productSoldOut;

    function addItem(o: { id: number; name: string; unitPrice: number }) {
        setItems((prev) => {
            const ex = prev.find((p) => p.id === o.id);
            if (ex) return prev.map((p) => (p.id === o.id ? { ...p, qty: p.qty + 1 } : p));
            return [...prev, { ...o, qty: 1 }];
        });
    }
    function setQty(id: number, qty: number) {
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, Math.min(99, qty)) } : p)));
    }
    function removeItem(id: number) {
        setItems((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)));
    }

    async function add(buyNow: boolean) {
        if (soldOut || busy || items.length === 0) return;
        setBusy(true);
        try {
            for (const it of items) {
                await api("/api/v1/cart/items", {
                    method: "POST",
                    auth: true,
                    body: JSON.stringify({ productId: it.id, productOptionId: undefined, quantity: it.qty }),
                });
            }
            if (buyNow) router.push("/checkout");
            else if (confirm("장바구니에 담았습니다. 장바구니로 이동할까요?")) router.push("/cart");
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) router.push(`/login?redirect=/p/${productId}`);
            else alert("장바구니 담기에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setBusy(false);
        }
    }

    async function toggleWish() {
        try {
            await api(`/api/v1/wishlist/${productId}`, { method: wished ? "DELETE" : "POST", auth: true });
            setWished((w) => !w);
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) router.push(`/login?redirect=/p/${productId}`);
            else alert("잠시 후 다시 시도해주세요.");
        }
    }

    return (
        <>
            {/* 옵션 선택 — 시안: 동일제품 / 다른맛 (gap 8, 라벨 + 560 드롭다운) */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                    <span className="shrink-0 text-[14px] text-[#767676]">동일제품</span>
                    <FlavorSelect
                        className="w-full max-w-[560px]"
                        options={[{ id: productId, name: productName, unitPrice: basePrice }]}
                        onPick={addItem}
                    />
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="shrink-0 text-[14px] text-[#767676]">다른맛</span>
                    <FlavorSelect
                        className="w-full max-w-[560px]"
                        options={siblings.map((s) => ({ id: s.id, name: s.name, unitPrice: s.price }))}
                        onPick={addItem}
                    />
                </div>
            </div>

            {/* 선택상품 리스트 — 각 #F6F7FB r10 px24 py16 */}
            <div className="flex flex-col gap-3">
                {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-4 rounded-[10px] bg-[#F6F7FB] px-6 py-4">
                        <div className="flex min-w-0 flex-col gap-1">
                            <span className="truncate text-[16px] text-[#505050]">{it.name}</span>
                            <span className="text-[16px] font-medium text-[#000] tabular-nums">{formatPrice(it.unitPrice)}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                            <div className="inline-flex items-center rounded-[4px] border border-[#E5E5EC] bg-white">
                                <button type="button" aria-label="수량 감소" disabled={it.qty <= 1} onClick={() => setQty(it.id, it.qty - 1)}
                                    className="flex h-9 w-9 items-center justify-center text-[16px] text-[#767676] disabled:opacity-30">−</button>
                                <span className="w-8 text-center text-[14px] font-medium tabular-nums text-[#222]">{it.qty}</span>
                                <button type="button" aria-label="수량 증가" onClick={() => setQty(it.id, it.qty + 1)}
                                    className="flex h-9 w-9 items-center justify-center text-[16px] text-[#767676]">+</button>
                            </div>
                            <button type="button" aria-label="삭제" onClick={() => removeItem(it.id)} disabled={items.length <= 1}
                                className="text-[#999] transition hover:text-[#222] disabled:opacity-30">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 합계 — 상품금액 합계(할인적용) 14/#767676 + 24/500/#222 */}
            <div className="flex items-end justify-between">
                <span className="text-[14px] text-[#767676]">상품금액 합계(할인적용)</span>
                <span className="text-[24px] font-medium text-[#222222] tabular-nums">{formatPrice(total)}</span>
            </div>

            {/* PC 버튼 — 찜 56 + 장바구니 + 바로구매 (h56 r4) */}
            <div className="hidden items-center gap-2 md:flex">
                <button type="button" aria-label="찜하기" onClick={toggleWish}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] border transition ${wished ? "border-[#222] bg-[#222] text-white" : "border-[#222] bg-white text-[#222] hover:bg-[#F6F7FB]"}`}>
                    <HeartIcon filled={wished} />
                </button>
                <button type="button" disabled={soldOut || busy} onClick={() => add(false)}
                    className="flex-1 rounded-[4px] border border-[#222] bg-white py-4 text-[16px] font-medium text-[#000] transition hover:bg-[#F6F7FB] disabled:opacity-50">
                    {soldOut ? "품절" : "장바구니"}
                </button>
                <button type="button" disabled={soldOut || busy} onClick={() => add(true)}
                    className="flex-1 rounded-[4px] bg-[#222] py-4 text-[16px] font-medium text-white transition hover:opacity-90 disabled:opacity-50">
                    바로구매
                </button>
            </div>

            {/* 모바일 하단 고정 바 */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-white/95 backdrop-blur md:hidden">
                <div className="flex items-stretch gap-2 px-4 py-3">
                    <button type="button" aria-label="찜하기" onClick={toggleWish}
                        className={`inline-flex w-12 shrink-0 items-center justify-center rounded-[4px] border ${wished ? "border-[#222] bg-[#222] text-white" : "border-[#222] text-[#222]"}`}>
                        <HeartIcon filled={wished} />
                    </button>
                    <button type="button" disabled={soldOut || busy} onClick={() => add(false)}
                        className="flex-1 rounded-[4px] border border-[#222] py-3 text-sm font-medium text-[#222] disabled:opacity-50">
                        {soldOut ? "품절" : "장바구니"}
                    </button>
                    <button type="button" disabled={soldOut || busy} onClick={() => add(true)}
                        className="flex-1 rounded-[4px] bg-[#222] py-3 text-sm font-medium text-white disabled:opacity-50">
                        바로구매
                    </button>
                </div>
            </div>
        </>
    );
}

/** 맛 선택 커스텀 드롭다운 — 시안 팝업(흰 박스 + 리스트 + 스크롤). */
function FlavorSelect({ className = "", options, onPick }: {
    className?: string;
    options: { id: number; name: string; unitPrice: number }[];
    onPick: (o: { id: number; name: string; unitPrice: number }) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
    }, [open]);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button type="button" onClick={() => setOpen((o) => !o)} disabled={options.length === 0}
                className="flex w-full items-center justify-between rounded-[4px] border border-[#E5E5EC] px-4 py-3 text-left transition hover:border-[#222] disabled:opacity-50">
                <span className="text-[14px] text-[#505050]">옵션을 선택해 주세요</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {open && options.length > 0 && (
                <ul role="listbox" className="absolute right-0 top-full z-30 mt-2 max-h-[240px] w-full overflow-y-auto rounded-[4px] border border-[#E5E5EC] bg-white p-2 shadow-[4px_4px_4px_rgba(34,51,34,0.12)]">
                    {options.map((o) => (
                        <li key={o.id}>
                            <button type="button" onClick={() => { onPick(o); setOpen(false); }}
                                className="block w-full rounded-[4px] px-3 py-3 text-left text-[14px] font-medium text-[#767676] transition hover:bg-[#F6F7FB] hover:text-[#222]">
                                {o.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );
}
