"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Button, Input } from "@/components/ui";

type CartItem = { id: number; productId: number; productOptionId: number | null; quantity: number };
type Cart = { id: number; memberId: number; items: CartItem[] };

type CouponView = {
    memberCouponId: number;
    couponId: number;
    name: string;
    discountType: "AMOUNT" | "PERCENT";
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number;
    expiresAt: string;
    usedAt: string | null;
};

const PAYMENT_METHODS = [
    { key: "CARD", label: "신용/체크카드" },
    { key: "VBANK", label: "가상계좌" },
    { key: "KAKAOPAY", label: "카카오페이" },
    { key: "NAVERPAY", label: "네이버페이" },
    { key: "TOSSPAY", label: "토스페이" },
];

export default function CheckoutPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [cart, setCart] = useState<Cart | null>(null);
    const [productAmount, setProductAmount] = useState(0);
    const [coupons, setCoupons] = useState<CouponView[]>([]);
    const [balance, setBalance] = useState(0);

    const [form, setForm] = useState({
        recipientName: "",
        recipientPhone: "",
        postalCode: "",
        address1: "",
        address2: "",
        memo: "",
        memberCouponId: null as number | null,
        pointUsed: 0,
        paymentMethod: "CARD",
    });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/checkout");
            return;
        }
        if (!user) return;

        (async () => {
            try {
                const c = await api<Cart>("/api/v1/cart", { auth: true });
                setCart(c);
                if (c.items.length === 0) {
                    router.replace("/cart");
                    return;
                }

                let total = 0;
                for (const it of c.items) {
                    const p = await api<{ price: number; options: { id: number; priceDelta: number }[] }>(
                        `/api/v1/public/products/${it.productId}`
                    );
                    let unit = p.price;
                    if (it.productOptionId) {
                        const opt = p.options.find(o => o.id === it.productOptionId);
                        if (opt) unit += opt.priceDelta;
                    }
                    total += unit * it.quantity;
                }
                setProductAmount(total);

                const cs = await api<{ content: CouponView[] }>("/api/v1/members/me/coupons?size=50", { auth: true });
                setCoupons(cs.content.filter(c => !c.usedAt && new Date(c.expiresAt) > new Date()));
                const bal = await api<{ balance: number }>("/api/v1/members/me/points/balance", { auth: true });
                setBalance(bal.balance);

                setForm(s => ({ ...s, recipientName: user.name ?? "", recipientPhone: user.phone ?? "" }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "주문 정보를 불러오지 못했습니다.");
            }
        })();
    }, [user, authLoading, router]);

    const couponSel = coupons.find(c => c.memberCouponId === form.memberCouponId);
    const couponDiscount = (() => {
        if (!couponSel) return 0;
        if (productAmount < couponSel.minOrderAmount) return 0;
        let d = couponSel.discountType === "AMOUNT"
            ? couponSel.discountValue
            : Math.floor(productAmount * couponSel.discountValue / 100);
        if (couponSel.maxDiscount > 0) d = Math.min(d, couponSel.maxDiscount);
        return Math.min(d, productAmount);
    })();
    const shippingFee = productAmount >= 30000 ? 0 : 3000;
    const paid = Math.max(0, productAmount + shippingFee - couponDiscount - (form.pointUsed || 0));

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const order = await api<{ id: number; orderNo: string }>("/api/v1/orders/checkout", {
                method: "POST", auth: true,
                body: JSON.stringify({
                    memberCouponId: form.memberCouponId,
                    pointUsed: form.pointUsed,
                    recipientName: form.recipientName,
                    recipientPhone: form.recipientPhone,
                    postalCode: form.postalCode,
                    address1: form.address1,
                    address2: form.address2,
                    memo: form.memo,
                    paymentToken: "stub-token-" + Date.now(),
                    paymentMethod: form.paymentMethod,
                }),
            });
            router.replace(`/orders/${order.id}?just=1`);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "결제에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    if (authLoading || !user || !cart) {
        return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    // Input과 동일 톤의 select className
    const selectClass =
        "block w-full bg-[var(--color-surface)] text-[var(--color-fg)] " +
        "border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3.5 text-sm " +
        "focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)] transition";

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
            <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-fg)]">결제</h1>

            <form onSubmit={onSubmit} className="space-y-6">
                <Section title="배송지">
                    <Input label="수령인 이름" required
                        value={form.recipientName} onChange={e => setForm(s => ({ ...s, recipientName: e.target.value }))} />
                    <Input label="연락처" required
                        value={form.recipientPhone} onChange={e => setForm(s => ({ ...s, recipientPhone: e.target.value }))} />
                    <Input label="우편번호" required
                        value={form.postalCode} onChange={e => setForm(s => ({ ...s, postalCode: e.target.value }))} />
                    <Input label="주소" required
                        value={form.address1} onChange={e => setForm(s => ({ ...s, address1: e.target.value }))} />
                    <Input label="상세 주소"
                        value={form.address2} onChange={e => setForm(s => ({ ...s, address2: e.target.value }))} />
                    <Input label="배송 메모"
                        value={form.memo} onChange={e => setForm(s => ({ ...s, memo: e.target.value }))} />
                </Section>

                <Section title="할인">
                    <label className="block">
                        <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1">쿠폰</span>
                        <select
                            value={form.memberCouponId ?? ""}
                            onChange={e => setForm(s => ({ ...s, memberCouponId: e.target.value ? Number(e.target.value) : null }))}
                            className={selectClass}
                        >
                            <option value="">쿠폰 사용 안 함</option>
                            {coupons.map(c => (
                                <option key={c.memberCouponId} value={c.memberCouponId}>
                                    {c.name} ({c.discountType === "AMOUNT" ? formatPrice(c.discountValue) : `${c.discountValue}%`})
                                </option>
                            ))}
                        </select>
                    </label>
                    <Input
                        type="number"
                        label={`적립금 사용 (보유 ${formatPrice(balance)})`}
                        min={0}
                        max={Math.min(balance, productAmount)}
                        value={form.pointUsed}
                        onChange={e => setForm(s => ({ ...s, pointUsed: Math.max(0, Math.min(Number(e.target.value) || 0, balance, productAmount)) }))}
                    />
                </Section>

                <Section title="결제수단">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map(m => {
                            const active = form.paymentMethod === m.key;
                            return (
                                <button
                                    type="button"
                                    key={m.key}
                                    onClick={() => setForm(s => ({ ...s, paymentMethod: m.key }))}
                                    className={`rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm transition ${
                                        active
                                            ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)] border-[var(--color-brand)]"
                                            : "bg-[var(--color-surface)] text-[var(--color-fg)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                                    }`}
                                >
                                    {m.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">
                        실 결제는 도급인 PG 키 수령 후 포트원 V2 SDK로 연동됩니다. 현재는 결제 스텁입니다.
                    </p>
                </Section>

                <Section title="결제 금액">
                    <div className="text-sm space-y-1">
                        <Row label="상품 합계" value={formatPrice(productAmount)} />
                        <Row label="배송비 (예상)" value={shippingFee === 0 ? "무료" : formatPrice(shippingFee)} />
                        {couponDiscount > 0 && <Row label="쿠폰 할인" value={`- ${formatPrice(couponDiscount)}`} />}
                        {form.pointUsed > 0 && <Row label="적립금 사용" value={`- ${formatPrice(form.pointUsed)}`} />}
                        <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between text-base font-bold text-[var(--color-fg)]">
                            <span>최종 결제 금액</span><span>{formatPrice(paid)}</span>
                        </div>
                    </div>
                </Section>

                {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

                <Button type="submit" loading={submitting} size="lg" fullWidth>
                    {`${formatPrice(paid)} 결제하기`}
                </Button>
            </form>

            <div className="text-center text-xs text-[var(--color-fg-subtle)]">
                <Link href="/cart" className="underline hover:text-[var(--color-fg)]">장바구니로 돌아가기</Link>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <h2 className="font-medium text-base text-[var(--color-fg)]">{title}</h2>
            {children}
        </section>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return <div className="flex justify-between"><span className="text-[var(--color-fg-muted)]">{label}</span><span className="text-[var(--color-fg)]">{value}</span></div>;
}
