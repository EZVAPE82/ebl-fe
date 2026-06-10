"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { RelatedCarousel } from "@/components/RelatedCarousel";
import type { Page, ProductDetail, ProductSummary } from "@/types/api";

/* Figma 장바구니 — 좌: 구매상품 라인 / 우: 결제정보(회색 박스) + 함께구매 캐러셀 */

type CartItem = {
    id: number;
    productId: number;
    productOptionId: number | null;
    quantity: number;
};
type Cart = { id: number; memberId: number; items: CartItem[] };

type PromoBadge = { id: number; name: string; buyQuantity: number; getQuantity: number; label: string };

type CartLine = CartItem & {
    name: string;
    optionText: string | null;
    unitPrice: number;
    thumbnailUrl: string | null;
    soldOut: boolean;
    freeQuantity: number;
    promotionLabel: string | null;
    promotions: PromoBadge[];
};

export default function CartPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
    const [lines, setLines] = useState<CartLine[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);
    const [recommend, setRecommend] = useState<ProductSummary[]>([]);

    // 옵션변경 팝업 — 로컬 UI 상태 (장바구니 로직과 분리). key=line.id
    const [openPromoFor, setOpenPromoFor] = useState<number | null>(null);
    const [selectedPromo, setSelectedPromo] = useState<Record<number, number>>({});
    // 약관 동의 — 시각 상태 (결제 게이팅은 기존 동작 유지: 품절만 차단)
    const [agreeAll, setAgreeAll] = useState(false);

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
                            freeQuantity, promotionLabel: promo?.label ?? null, promotions: promos,
                        } as CartLine;
                    } catch {
                        return {
                            ...it, name: `상품 #${it.productId}`, unitPrice: 0, optionText: null, thumbnailUrl: null, soldOut: true,
                            freeQuantity: 0, promotionLabel: null, promotions: [],
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

    // 함께구매 추천 상품(실데이터) — RelatedCarousel 로 렌더
    useEffect(() => {
        api<Page<ProductSummary>>("/api/v1/public/products?size=8")
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

    if (authLoading || !user) return <CartShell><p className="text-[#767676]">로그인 확인 중...</p></CartShell>;
    if (error) return <CartShell><p className="text-[var(--color-danger)]">{error}</p></CartShell>;
    if (!cart) return <CartShell><p className="text-[#767676]">불러오는 중...</p></CartShell>;

    if (lines.length === 0) {
        return (
            <CartShell>
                <div className="px-4 py-24 text-center">
                    <p className="text-[16px] text-[#767676] mb-5">장바구니가 비어 있습니다.</p>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center rounded-[4px] bg-[#0072DD] text-white px-7 py-3 text-[16px] font-medium hover:opacity-90 transition"
                    >
                        쇼핑하러 가기
                    </Link>
                </div>
            </CartShell>
        );
    }

    const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const shippingFee = 0;
    const discount = 0;
    const paid = Math.max(0, total + shippingFee - discount);
    const hasSoldOut = lines.some(l => l.soldOut);

    return (
        <CartShell>
            {/* ===== TOP ROW ===== */}
            <div className="flex flex-col gap-20 lg:flex-row lg:justify-between lg:gap-20">
                {/* ----- 좌: 구매상품 ----- */}
                <div className="lg:w-[1036px]">
                    <h2 className="text-[24px] font-medium text-[#000]">구매상품</h2>
                    <ul className="border-t border-[#222]">
                        {lines.map(l => {
                            const sel = selectedPromo[l.id] ?? l.promotions[0]?.id ?? null;
                            return (
                                <li key={l.id} className="py-3 flex justify-between items-center gap-3">
                                    {/* 썸네일 + 이름/주문번호 */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Link href={`/p/${l.productId}`} className="shrink-0">
                                            {l.thumbnailUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={l.thumbnailUrl} alt={l.name} className="w-[90px] h-[108px] rounded-[4px] object-cover shrink-0" />
                                            ) : (
                                                <div className="w-[90px] h-[108px] rounded-[4px] bg-[#F6F7FB] shrink-0" />
                                            )}
                                        </Link>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <Link href={`/p/${l.productId}`} className="text-[16px] font-medium text-[#000] line-clamp-1 hover:underline">
                                                {l.name}
                                            </Link>
                                            <p className="text-[14px] font-light text-[#767676]">
                                                {l.optionText ?? `주문번호 ${String(l.id).padStart(8, "0")}`}
                                            </p>
                                            {l.soldOut && <p className="text-[13px] text-[var(--color-danger)]">품절</p>}
                                        </div>
                                    </div>

                                    {/* 옵션변경 — 프로모션 있을 때만 */}
                                    {l.promotions.length > 0 && (
                                        <PromoPopover
                                            line={l}
                                            open={openPromoFor === l.id}
                                            selectedId={sel}
                                            onToggle={() => setOpenPromoFor(openPromoFor === l.id ? null : l.id)}
                                            onClose={() => setOpenPromoFor(null)}
                                            onSelect={(pid) => {
                                                setSelectedPromo(s => ({ ...s, [l.id]: pid }));
                                                setOpenPromoFor(null);
                                            }}
                                        />
                                    )}

                                    {/* 가격 */}
                                    <div className="hidden md:block w-[184px] text-center text-[14px] text-[#000] tabular-nums">
                                        {formatPrice(l.unitPrice * l.quantity)}
                                    </div>

                                    {/* 수량 스테퍼 */}
                                    <div className="w-[184px] flex justify-center">
                                        <div className="flex items-center border border-[#DDDDDD] rounded-[4px]">
                                            <button
                                                onClick={() => changeQty(l.id, l.quantity - 1)}
                                                disabled={working || l.quantity <= 1}
                                                aria-label="수량 감소"
                                                className="w-9 h-9 flex items-center justify-center text-[#000] disabled:opacity-40 hover:bg-[#F6F7FB] transition"
                                            >−</button>
                                            <span className="text-[14px] w-9 text-center text-[#000] tabular-nums">{l.quantity}</span>
                                            <button
                                                onClick={() => changeQty(l.id, l.quantity + 1)}
                                                disabled={working}
                                                aria-label="수량 증가"
                                                className="w-9 h-9 flex items-center justify-center text-[#000] disabled:opacity-40 hover:bg-[#F6F7FB] transition"
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* 삭제 X */}
                                    <button
                                        onClick={() => removeItem(l.id)}
                                        disabled={working}
                                        aria-label="삭제"
                                        className="shrink-0 w-8 h-8 flex items-center justify-center text-[#767676] hover:text-[#000] transition"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* ----- 우: 결제정보 ----- */}
                <aside className="lg:w-[464px] shrink-0">
                    <div className="bg-[#F6F7FB] rounded-[10px] p-9 flex flex-col gap-8">
                        <h3 className="text-[24px] font-medium text-[#000] border-b border-[#222] pb-4">결제정보</h3>

                        <dl className="flex flex-col gap-4">
                            <div className="flex justify-between">
                                <dt className="text-[18px] font-light text-[#767676]">주문금액</dt>
                                <dd className="text-[18px] font-medium text-[#000] tabular-nums">{formatPrice(total)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-[18px] font-light text-[#767676]">할인 혜택</dt>
                                <dd className="text-[18px] font-medium text-[#000] tabular-nums">{discount > 0 ? `- ${formatPrice(discount)}` : "0원"}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-[18px] font-light text-[#767676]">배송비</dt>
                                <dd className="text-[18px] font-medium text-[#000] tabular-nums">{shippingFee === 0 ? "0원" : formatPrice(shippingFee)}</dd>
                            </div>
                        </dl>

                        <div className="flex justify-between items-end">
                            <span className="text-[16px] text-[#767676]">결제 예정 금액</span>
                            <span className="text-[26px] font-medium text-[#222] tabular-nums">{formatPrice(paid)}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push("/checkout")}
                            disabled={hasSoldOut || working}
                            className="h-[60px] bg-[#0072DD] rounded-[4px] text-white text-[16px] font-medium disabled:opacity-50 hover:opacity-90 transition tabular-nums"
                        >
                            {formatPrice(paid)} 결제하기
                        </button>

                        {/* 약관 동의 */}
                        <div className="flex flex-col gap-4">
                            <label className="flex items-center gap-3 cursor-pointer border-b border-[#DDDDDD] pb-3">
                                <input
                                    type="checkbox"
                                    checked={agreeAll}
                                    onChange={(e) => setAgreeAll(e.target.checked)}
                                    className="w-7 h-7 accent-[#0072DD]"
                                />
                                <span className="text-[18px] font-medium text-[#000]">전체약관 동의</span>
                            </label>
                            <TermRow label="이용약관 동의" required checked={agreeAll} />
                            <TermRow label="개인정보 수집 이용동의" checked={agreeAll} />
                        </div>
                    </div>
                </aside>
            </div>

            {/* ===== 함께구매 ===== */}
            <RelatedCarousel items={recommend} />
        </CartShell>
    );
}

/* 옵션변경 버튼 + 팝업 */
function PromoPopover({
    line, open, selectedId, onToggle, onClose, onSelect,
}: {
    line: CartLine;
    open: boolean;
    selectedId: number | null;
    onToggle: () => void;
    onClose: () => void;
    onSelect: (promoId: number) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open, onClose]);

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                onClick={onToggle}
                className="px-4 py-2 rounded-[4px] border border-[#DDDDDD] text-[14px] text-[#000] hover:bg-[#F6F7FB] transition whitespace-nowrap"
            >
                옵션변경
            </button>
            {open && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[240px] p-3 bg-white shadow-[4px_4px_4px_rgba(34,51,34,0.12)] rounded-[8px]">
                    <p className="text-[14px] text-[#000] mb-2">옵션 변경</p>
                    <ul className="flex flex-col gap-1">
                        {line.promotions.map((promo) => {
                            const active = promo.id === selectedId;
                            return (
                                <li key={promo.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(promo.id)}
                                        className={
                                            active
                                                ? "w-full text-left bg-[#F6F7FB] rounded-[4px] p-3 text-[14px] font-medium text-[#000]"
                                                : "w-full text-left p-3 text-[14px] text-[#767676] hover:text-[#000]"
                                        }
                                    >
                                        {promo.label}{promo.name ? ` · ${promo.name}` : ""}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

/* 약관 row — 체크박스 + 라벨 + 우측 chevron (시각) */
function TermRow({ label, required, checked }: { label: string; required?: boolean; checked: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={checked} readOnly className="w-[22px] h-[22px] accent-[#0072DD]" />
                <span className="text-[14px] font-medium text-[#767676]">
                    {label} {required && <span className="text-[#0072DD]">[필수]</span>}
                </span>
            </label>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
    );
}

function CartShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto max-w-[1920px] px-4 py-10 xl:px-[170px]">
            {children}
        </div>
    );
}
