"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import type { ProductDetail } from "@/types/api";
import { Button } from "@/components/ui";

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
};

export default function CartPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
    const [lines, setLines] = useState<CartLine[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const c = await api<Cart>("/api/v1/cart", { auth: true });
            setCart(c);
            const detailed = await Promise.all(
                c.items.map(async (it) => {
                    try {
                        const p = await api<ProductDetail>(`/api/v1/public/products/${it.productId}`);
                        const opt = it.productOptionId
                            ? p.options.find(o => o.id === it.productOptionId)
                            : null;
                        const unitPrice = p.price + (opt?.priceDelta ?? 0);
                        const optionText = opt ? `${opt.optionGroup}: ${opt.optionValue}` : null;
                        const soldOut = opt ? opt.stock <= 0 : p.status === "SOLD_OUT";
                        return { ...it, name: p.name, unitPrice, optionText, thumbnailUrl: p.thumbnailUrl, soldOut } as CartLine;
                    } catch {
                        return { ...it, name: `상품 #${it.productId}`, unitPrice: 0, optionText: null, thumbnailUrl: null, soldOut: true } as CartLine;
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
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-4 py-16 text-center">
                    <p className="text-sm text-[var(--color-fg-subtle)] mb-4">장바구니가 비어 있습니다.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-5 py-3 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                    >
                        쇼핑하러 가기
                    </Link>
                </div>
            </CartShell>
        );
    }

    const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const hasSoldOut = lines.some(l => l.soldOut);

    return (
        <CartShell>
            <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                {lines.map(l => (
                    <li key={l.id} className="flex gap-3 p-4 bg-[var(--color-surface)]">
                        <div className="w-20 h-20 bg-[var(--color-bg-subtle)] rounded-[var(--radius-sm)] flex-shrink-0 overflow-hidden">
                            {l.thumbnailUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={l.thumbnailUrl} alt={l.name} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <Link href={`/p/${l.productId}`} className="font-medium text-sm hover:underline line-clamp-2 text-[var(--color-fg)]">
                                {l.name}
                            </Link>
                            {l.optionText && <div className="text-xs text-[var(--color-fg-muted)] mt-1">{l.optionText}</div>}
                            <div className="mt-2 flex items-center gap-2">
                                <button
                                    onClick={() => changeQty(l.id, l.quantity - 1)}
                                    disabled={working || l.quantity <= 1}
                                    className="w-7 h-7 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-sm text-[var(--color-fg)] disabled:opacity-40 hover:border-[var(--color-border-strong)]"
                                >-</button>
                                <span className="text-sm w-8 text-center text-[var(--color-fg)]">{l.quantity}</span>
                                <button
                                    onClick={() => changeQty(l.id, l.quantity + 1)}
                                    disabled={working}
                                    className="w-7 h-7 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-sm text-[var(--color-fg)] disabled:opacity-40 hover:border-[var(--color-border-strong)]"
                                >+</button>
                                <button
                                    onClick={() => removeItem(l.id)}
                                    disabled={working}
                                    className="ml-auto text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]"
                                >삭제</button>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-[var(--color-fg)]">{formatPrice(l.unitPrice * l.quantity)}</div>
                            {l.soldOut && <div className="mt-1 text-[11px] text-[var(--color-danger)]">품절</div>}
                        </div>
                    </li>
                ))}
            </ul>

            <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--color-fg-muted)]">상품 합계</span><span className="text-[var(--color-fg)]">{formatPrice(total)}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-fg-muted)]">배송비</span><span className="text-[var(--color-fg-subtle)]">결제 단계에서 확정</span></div>
                <div className="border-t border-[var(--color-border)] pt-2 flex justify-between text-base font-bold text-[var(--color-fg)]">
                    <span>예상 결제 금액</span><span>{formatPrice(total)}</span>
                </div>
            </div>

            <div className="mt-6 flex gap-2">
                <Link
                    href="/"
                    className="flex-1 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] py-3.5 text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
                >
                    계속 쇼핑
                </Link>
                <Button
                    onClick={() => router.push("/checkout")}
                    disabled={hasSoldOut || working || lines.length === 0}
                    size="lg"
                    fullWidth
                    className="flex-1"
                >
                    결제하기
                </Button>
            </div>
            {hasSoldOut && (
                <p className="mt-2 text-xs text-[var(--color-danger)]">품절 상품이 있어 결제할 수 없습니다.</p>
            )}
        </CartShell>
    );
}

function CartShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--color-fg)]">장바구니</h1>
            {children}
        </div>
    );
}
