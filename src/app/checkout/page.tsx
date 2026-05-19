"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

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

                // 가격 계산
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

                // 쿠폰함 + 적립금
                const cs = await api<{ content: CouponView[] }>("/api/v1/members/me/coupons?size=50", { auth: true });
                setCoupons(cs.content.filter(c => !c.usedAt && new Date(c.expiresAt) > new Date()));
                const bal = await api<{ balance: number }>("/api/v1/members/me/points/balance", { auth: true });
                setBalance(bal.balance);

                // 기본값 채우기
                setForm(s => ({ ...s, recipientName: user.name ?? "", recipientPhone: user.phone ?? "" }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "주문 정보를 불러오지 못했습니다.");
            }
        })();
    }, [user, authLoading, router]);

    // 쿠폰 할인 미리 계산
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
    const shippingFee = productAmount >= 30000 ? 0 : 3000; // 정책 캐시 — 백엔드 결과가 정답
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
        return <div className="mx-auto max-w-3xl px-4 py-10 text-zinc-500">불러오는 중...</div>;
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
            <h1 className="text-xl md:text-2xl font-bold">결제</h1>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* 배송지 */}
                <Section title="배송지">
                    <Field label="수령인 이름">
                        <input required value={form.recipientName} onChange={e => setForm(s => ({...s, recipientName: e.target.value}))} className={inputClass} />
                    </Field>
                    <Field label="연락처">
                        <input required value={form.recipientPhone} onChange={e => setForm(s => ({...s, recipientPhone: e.target.value}))} className={inputClass} />
                    </Field>
                    <Field label="우편번호">
                        <input required value={form.postalCode} onChange={e => setForm(s => ({...s, postalCode: e.target.value}))} className={inputClass} />
                    </Field>
                    <Field label="주소">
                        <input required value={form.address1} onChange={e => setForm(s => ({...s, address1: e.target.value}))} className={inputClass} />
                    </Field>
                    <Field label="상세 주소">
                        <input value={form.address2} onChange={e => setForm(s => ({...s, address2: e.target.value}))} className={inputClass} />
                    </Field>
                    <Field label="배송 메모">
                        <input value={form.memo} onChange={e => setForm(s => ({...s, memo: e.target.value}))} className={inputClass} />
                    </Field>
                </Section>

                {/* 쿠폰 / 적립금 */}
                <Section title="할인">
                    <Field label="쿠폰">
                        <select
                            value={form.memberCouponId ?? ""}
                            onChange={e => setForm(s => ({...s, memberCouponId: e.target.value ? Number(e.target.value) : null}))}
                            className={inputClass}
                        >
                            <option value="">쿠폰 사용 안 함</option>
                            {coupons.map(c => (
                                <option key={c.memberCouponId} value={c.memberCouponId}>
                                    {c.name} ({c.discountType === "AMOUNT" ? formatPrice(c.discountValue) : `${c.discountValue}%`})
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label={`적립금 사용 (보유 ${formatPrice(balance)})`}>
                        <input
                            type="number"
                            min={0}
                            max={Math.min(balance, productAmount)}
                            value={form.pointUsed}
                            onChange={e => setForm(s => ({...s, pointUsed: Math.max(0, Math.min(Number(e.target.value) || 0, balance, productAmount))}))}
                            className={inputClass}
                        />
                    </Field>
                </Section>

                {/* 결제수단 */}
                <Section title="결제수단">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map(m => (
                            <button
                                type="button"
                                key={m.key}
                                onClick={() => setForm(s => ({...s, paymentMethod: m.key}))}
                                className={`rounded border px-3 py-2 text-sm ${
                                    form.paymentMethod === m.key
                                        ? "bg-zinc-900 text-white border-zinc-900"
                                        : "bg-white border-zinc-300 hover:border-zinc-500"
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">
                        실 결제는 도급인 PG 키 수령 후 포트원 V2 SDK로 연동됩니다. 현재는 결제 스텁입니다.
                    </p>
                </Section>

                {/* 합계 */}
                <Section title="결제 금액">
                    <div className="text-sm space-y-1">
                        <Row label="상품 합계" value={formatPrice(productAmount)} />
                        <Row label="배송비 (예상)" value={shippingFee === 0 ? "무료" : formatPrice(shippingFee)} />
                        {couponDiscount > 0 && <Row label="쿠폰 할인" value={`- ${formatPrice(couponDiscount)}`} />}
                        {form.pointUsed > 0 && <Row label="적립금 사용" value={`- ${formatPrice(form.pointUsed)}`} />}
                        <div className="border-t border-zinc-200 pt-2 mt-2 flex justify-between text-base font-bold">
                            <span>최종 결제 금액</span><span>{formatPrice(paid)}</span>
                        </div>
                    </div>
                </Section>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-md bg-zinc-900 text-white py-3 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
                >
                    {submitting ? "결제 중..." : `${formatPrice(paid)} 결제하기`}
                </button>
            </form>

            <div className="text-center text-xs text-zinc-400">
                <Link href="/cart" className="underline">장바구니로 돌아가기</Link>
            </div>
        </div>
    );
}

const inputClass = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-md border border-zinc-200 p-4 space-y-3">
            <h2 className="font-semibold text-sm">{title}</h2>
            {children}
        </section>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block"><span className="text-xs text-zinc-600">{label}</span>{children}</label>;
}

function Row({ label, value }: { label: string; value: string }) {
    return <div className="flex justify-between"><span className="text-zinc-500">{label}</span><span>{value}</span></div>;
}
