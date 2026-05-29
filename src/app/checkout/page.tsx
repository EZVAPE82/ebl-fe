"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

/* 시안 14:7971 (비회원) / 14:8776 (회원) 매칭 — 2-col 레이아웃, 좌:폼 / 우:결제정보 sticky */

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

type LineItem = { id: number; name: string; orderNo: string; price: number; qty: number; img: string };

export default function CheckoutPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isGuest = searchParams.get("guest") === "1" || !user;

    const [cart, setCart] = useState<Cart | null>(null);
    const [lines, setLines] = useState<LineItem[]>([]);
    const [productAmount, setProductAmount] = useState(0);
    const [coupons, setCoupons] = useState<CouponView[]>([]);
    const [balance, setBalance] = useState(0);
    const [addressMode, setAddressMode] = useState<"recent" | "direct">("recent");

    const [form, setForm] = useState({
        recipientName: "",
        recipientPhone1: "010",
        recipientPhone2: "",
        recipientPhone3: "",
        phoneHome1: "02",
        phoneHome2: "",
        phoneHome3: "",
        postalCode: "",
        address1: "",
        address2: "",
        emailLocal: "",
        emailDomain: "",
        memo: "",
        defaultAddress: "save" as "save" | "skip",
        guestPassword: "",
        guestPasswordConfirm: "",
        memberCouponId: null as number | null,
        pointUsed: 0,
        paymentMethod: "CARD" as "CARD" | "EASY" | "BANK",
        cardSelect: "",
        installment: "일시불",
    });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (user) {
            // 회원 — 카트 조회
            (async () => {
                try {
                    const c = await api<Cart>("/api/v1/cart", { auth: true });
                    setCart(c);
                    if (c.items.length === 0) {
                        router.replace("/cart");
                        return;
                    }
                    let total = 0;
                    const items: LineItem[] = [];
                    for (const it of c.items) {
                        try {
                            const p = await api<{ name: string; price: number; thumbnailUrl: string | null; options: { id: number; priceDelta: number }[] }>(
                                `/api/v1/public/products/${it.productId}`
                            );
                            let unit = p.price;
                            if (it.productOptionId) {
                                const opt = p.options.find(o => o.id === it.productOptionId);
                                if (opt) unit += opt.priceDelta;
                            }
                            total += unit * it.quantity;
                            items.push({
                                id: it.id, name: p.name || "상품타이틀",
                                orderNo: `#${String(it.id).padStart(13, "2021156599")}`,
                                price: unit, qty: it.quantity,
                                img: p.thumbnailUrl || "/images/elfbar-product-1.png",
                            });
                        } catch { /* skip */ }
                    }
                    setLines(items);
                    setProductAmount(total);

                    const cs = await api<{ content: CouponView[] }>("/api/v1/members/me/coupons?size=50", { auth: true });
                    setCoupons(cs.content.filter(c => !c.usedAt && new Date(c.expiresAt) > new Date()));
                    const bal = await api<{ balance: number }>("/api/v1/members/me/points/balance", { auth: true });
                    setBalance(bal.balance);

                    setForm(s => ({ ...s, recipientName: user.name ?? "" }));
                } catch (e) {
                    setError(e instanceof ApiError ? e.message : "주문 정보를 불러오지 못했습니다.");
                }
            })();
        } else {
            // 비회원 — mock 라인
            setLines([
                { id: 1, name: "상품타이틀", orderNo: "#2021156599898", price: 100000, qty: 1, img: "/images/elfbar-product-1.png" },
                { id: 2, name: "상품타이틀", orderNo: "#2021156599898", price: 100000, qty: 1, img: "/images/elfbar-product-1.png" },
            ]);
            setProductAmount(200000);
        }
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
            if (!user) {
                // 비회원 stub
                router.replace(`/checkout/complete?orderNo=GUEST-${Date.now()}`);
                return;
            }
            const order = await api<{ id: number; orderNo: string }>("/api/v1/orders/checkout", {
                method: "POST", auth: true,
                body: JSON.stringify({
                    memberCouponId: form.memberCouponId,
                    pointUsed: form.pointUsed,
                    recipientName: form.recipientName,
                    recipientPhone: `${form.recipientPhone1}-${form.recipientPhone2}-${form.recipientPhone3}`,
                    postalCode: form.postalCode,
                    address1: form.address1,
                    address2: form.address2,
                    memo: form.memo,
                    paymentToken: "stub-token-" + Date.now(),
                    paymentMethod: form.paymentMethod,
                }),
            });
            router.replace(`/checkout/complete?orderNo=${order.orderNo}`);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "결제에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    if (authLoading) {
        return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    const inputClass = "w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg-muted)] transition";
    const selectClass = inputClass + " appearance-none cursor-pointer";

    return (
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8">
            <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 md:gap-10">
                {/* ===== 좌: 폼 ===== */}
                <div className="space-y-10">
                    {/* 구매상품 */}
                    <section>
                        <h2 className="text-base md:text-lg font-bold text-[var(--color-fg)] pb-3 border-b-2 border-[var(--color-fg)]">구매상품</h2>
                        <ul className="divide-y divide-[var(--color-border)]">
                            {lines.map(l => (
                                <li key={l.id} className="flex items-center gap-3 py-4">
                                    <div className="w-14 h-14 bg-[var(--color-bg-subtle)] flex-shrink-0 overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={l.img} alt={l.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--color-fg)] line-clamp-1">{l.name}</p>
                                        <p className="text-xs text-[var(--color-fg-muted)] tabular-nums">{l.orderNo}</p>
                                    </div>
                                    <span className="text-sm text-[var(--color-fg)] tabular-nums">{formatPrice(l.price)}</span>
                                    <span className="text-sm text-[var(--color-fg-muted)] w-12 text-center">– {l.qty} +</span>
                                    <button type="button" aria-label="삭제" className="w-6 h-6 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* 배송지 */}
                    <section>
                        <h2 className="text-base md:text-lg font-bold text-[var(--color-fg)] pb-3 border-b-2 border-[var(--color-fg)] mb-5">배송지</h2>

                        {/* 회원만 — 최근배송지 / 직접입력 탭 */}
                        {user && (
                            <div className="flex gap-2 mb-5">
                                <button type="button" onClick={() => setAddressMode("recent")} className={`rounded-[8px] px-4 py-2 text-xs font-medium transition ${addressMode === "recent" ? "bg-[#3b82f6] text-white" : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)]"}`}>최근배송지 입력</button>
                                <button type="button" onClick={() => setAddressMode("direct")} className={`rounded-[8px] px-4 py-2 text-xs font-medium transition ${addressMode === "direct" ? "bg-[#3b82f6] text-white" : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)]"}`}>직접입력</button>
                            </div>
                        )}

                        {user && addressMode === "recent" ? (
                            <dl className="space-y-3 text-sm">
                                <Field label="이름"><span className="text-[var(--color-fg)]">시그널디코드</span></Field>
                                <Field label="주소"><span className="text-[var(--color-fg)]">서울특별시 마포구 서교동 잔다로 센터원빌딩 6층</span></Field>
                                <Field label="전화번호"><span className="text-[var(--color-fg) tabular-nums]">010-1234-5678</span></Field>
                                <Field label="배송요청사항">
                                    <select className={selectClass} value={form.memo} onChange={e => setForm(s => ({ ...s, memo: e.target.value }))}>
                                        <option value="">배송메시지를 선택해주세요(선택사항)</option>
                                        <option value="조심히 와주세요">조심히 와주세요</option>
                                        <option value="문 앞에 놔주세요">문 앞에 놔주세요</option>
                                    </select>
                                </Field>
                            </dl>
                        ) : (
                            <dl className="space-y-3 text-sm">
                                <Field label="받는 사람" required>
                                    <input type="text" placeholder="이름을 작성해주세요" className={inputClass} value={form.recipientName} onChange={e => setForm(s => ({ ...s, recipientName: e.target.value }))} />
                                </Field>
                                <Field label="주소" required>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="우편번호" className={`${inputClass} max-w-[200px]`} value={form.postalCode} onChange={e => setForm(s => ({ ...s, postalCode: e.target.value }))} />
                                            <button type="button" className="rounded-[6px] bg-[#3b82f6] text-white text-xs font-medium px-4 hover:opacity-90 transition">우편번호 찾기</button>
                                        </div>
                                        <input type="text" placeholder="기본주소" className={inputClass} value={form.address1} onChange={e => setForm(s => ({ ...s, address1: e.target.value }))} />
                                        <input type="text" placeholder="상세주소 (선택)" className={inputClass} value={form.address2} onChange={e => setForm(s => ({ ...s, address2: e.target.value }))} />
                                    </div>
                                </Field>
                                <Field label="일반전화">
                                    <div className="flex items-center gap-1.5">
                                        <select className={`${selectClass} max-w-[80px]`} value={form.phoneHome1} onChange={e => setForm(s => ({ ...s, phoneHome1: e.target.value }))}>
                                            <option>02</option><option>031</option><option>032</option><option>051</option>
                                        </select>
                                        <span className="text-[var(--color-fg-subtle)]">–</span>
                                        <input type="text" placeholder="123" className={`${inputClass} max-w-[100px]`} value={form.phoneHome2} onChange={e => setForm(s => ({ ...s, phoneHome2: e.target.value }))} />
                                        <span className="text-[var(--color-fg-subtle)]">–</span>
                                        <input type="text" placeholder="567" className={`${inputClass} max-w-[100px]`} value={form.phoneHome3} onChange={e => setForm(s => ({ ...s, phoneHome3: e.target.value }))} />
                                    </div>
                                </Field>
                                <Field label="휴대전화" required>
                                    <div className="flex items-center gap-1.5">
                                        <select className={`${selectClass} max-w-[80px]`} value={form.recipientPhone1} onChange={e => setForm(s => ({ ...s, recipientPhone1: e.target.value }))}>
                                            <option>010</option><option>011</option>
                                        </select>
                                        <span className="text-[var(--color-fg-subtle)]">–</span>
                                        <input type="text" placeholder="1234" className={`${inputClass} max-w-[100px]`} value={form.recipientPhone2} onChange={e => setForm(s => ({ ...s, recipientPhone2: e.target.value }))} />
                                        <span className="text-[var(--color-fg-subtle)]">–</span>
                                        <input type="text" placeholder="5678" className={`${inputClass} max-w-[100px]`} value={form.recipientPhone3} onChange={e => setForm(s => ({ ...s, recipientPhone3: e.target.value }))} />
                                    </div>
                                </Field>
                                <Field label="이메일">
                                    <div className="flex items-center gap-1.5">
                                        <input type="text" placeholder="signalsidecode02" className={inputClass} value={form.emailLocal} onChange={e => setForm(s => ({ ...s, emailLocal: e.target.value }))} />
                                        <span className="text-[var(--color-fg-subtle)]">@</span>
                                        <input type="text" placeholder="naver.com" className={inputClass} value={form.emailDomain} onChange={e => setForm(s => ({ ...s, emailDomain: e.target.value }))} />
                                        <select className={`${selectClass} max-w-[120px]`}>
                                            <option>직접입력</option><option>naver.com</option><option>gmail.com</option>
                                        </select>
                                    </div>
                                </Field>
                                <Field label="배송 요청사항">
                                    <select className={selectClass} value={form.memo} onChange={e => setForm(s => ({ ...s, memo: e.target.value }))}>
                                        <option value="">메시지 선택(선택사항)</option>
                                        <option value="조심히 와주세요">조심히 와주세요</option>
                                    </select>
                                </Field>
                                {isGuest && (
                                    <Field label="기본 배송지 저장">
                                        <div className="flex items-center gap-4 text-sm">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input type="radio" name="defaultAddress" checked={form.defaultAddress === "save"} onChange={() => setForm(s => ({ ...s, defaultAddress: "save" }))} className="text-[#3b82f6]"/>
                                                <span className="text-[var(--color-fg)]">저장함</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input type="radio" name="defaultAddress" checked={form.defaultAddress === "skip"} onChange={() => setForm(s => ({ ...s, defaultAddress: "skip" }))} className="text-[#3b82f6]"/>
                                                <span className="text-[var(--color-fg-muted)]">저장안함</span>
                                            </label>
                                        </div>
                                    </Field>
                                )}
                            </dl>
                        )}
                    </section>

                    {/* 비회원 비밀번호 */}
                    {isGuest && (
                        <section>
                            <h2 className="text-base md:text-lg font-bold text-[var(--color-fg)] pb-3 border-b-2 border-[var(--color-fg)] mb-5">비회원 주문조회 비밀번호</h2>
                            <dl className="space-y-3 text-sm">
                                <Field label="비밀번호" required>
                                    <input type="password" className={inputClass} value={form.guestPassword} onChange={e => setForm(s => ({ ...s, guestPassword: e.target.value }))} />
                                    <p className="mt-1 text-xs text-[var(--color-danger)]">영문 16자리(영문/숫자/특수문자 중 2가지 이상 조합, 4자리 ~ 16자리)</p>
                                </Field>
                                <Field label="비밀번호 확인">
                                    <input type="password" className={inputClass} value={form.guestPasswordConfirm} onChange={e => setForm(s => ({ ...s, guestPasswordConfirm: e.target.value }))} />
                                </Field>
                            </dl>
                        </section>
                    )}

                    {/* 회원 — 할인/부가결제 (쿠폰/적립금) */}
                    {user && (
                        <section>
                            <h2 className="text-base md:text-lg font-bold text-[var(--color-fg)] pb-3 border-b-2 border-[var(--color-fg)] mb-5">할인/부가결제</h2>
                            <dl className="space-y-3 text-sm">
                                <Field label="쿠폰적용" required>
                                    <select className={selectClass} value={form.memberCouponId ?? ""} onChange={e => setForm(s => ({ ...s, memberCouponId: e.target.value ? Number(e.target.value) : null }))}>
                                        <option value="">사용 가능한 쿠폰 없음</option>
                                        {coupons.map(c => (
                                            <option key={c.memberCouponId} value={c.memberCouponId}>
                                                {c.name} ({c.discountType === "AMOUNT" ? formatPrice(c.discountValue) : `${c.discountValue}%`})
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="적립금" required>
                                    <input type="number" min={0} max={Math.min(balance, productAmount)} className={inputClass} placeholder="최소 5,000원 이상 보유 시 사용 가능" value={form.pointUsed || ""} onChange={e => setForm(s => ({ ...s, pointUsed: Math.max(0, Math.min(Number(e.target.value) || 0, balance, productAmount)) }))} />
                                    <div className="mt-1 flex items-center justify-between text-xs">
                                        <span className="text-[var(--color-fg-muted)]">보유적립금 <span className="font-bold text-[var(--color-fg)] tabular-nums">{formatPrice(balance)}</span></span>
                                        <span className="text-[var(--color-fg-subtle)]">* 한 결제건 당 쿠폰 등 적립금 중복 사용이 제한됩니다.</span>
                                    </div>
                                </Field>
                            </dl>
                        </section>
                    )}

                    {/* 결제수단 */}
                    <section>
                        <h2 className="text-base md:text-lg font-bold text-[var(--color-fg)] pb-3 border-b-2 border-[var(--color-fg)] mb-5">결제수단 선택</h2>
                        <dl className="space-y-3 text-sm">
                            <Field label="결제수단" required>
                                <div className="flex items-center gap-4">
                                    {([
                                        { key: "CARD", label: "계좌 간편결제" },
                                        { key: "EASY", label: "카드간편결제" },
                                        { key: "BANK", label: "일반결제" },
                                    ] as const).map(m => (
                                        <label key={m.key} className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="radio" name="payment" checked={form.paymentMethod === m.key} onChange={() => setForm(s => ({ ...s, paymentMethod: m.key }))} className="text-[#3b82f6]" />
                                            <span className={form.paymentMethod === m.key ? "text-[var(--color-fg)] font-medium" : "text-[var(--color-fg-muted)]"}>{m.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </Field>
                            <Field label="카드선택" required>
                                <select className={selectClass} value={form.cardSelect} onChange={e => setForm(s => ({ ...s, cardSelect: e.target.value }))}>
                                    <option value="">카드를 선택해주세요.</option>
                                    <option>신한카드</option><option>현대카드</option><option>국민카드</option>
                                </select>
                            </Field>
                            <Field label="할부기간" required>
                                <select className={selectClass} value={form.installment} onChange={e => setForm(s => ({ ...s, installment: e.target.value }))}>
                                    <option>일시불</option><option>2개월</option><option>3개월</option>
                                </select>
                            </Field>
                            {user && (
                                <label className="flex items-center gap-2 cursor-pointer text-sm pt-2">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <span className="text-[var(--color-fg-muted)]">결제수단과 입력정보를 다음에도 사용</span>
                                </label>
                            )}
                        </dl>
                    </section>
                </div>

                {/* ===== 우: 결제정보 sticky ===== */}
                <aside className="lg:sticky lg:top-4 lg:self-start">
                    <div className="rounded-[18px] bg-[var(--color-bg-subtle)] p-5 md:p-6">
                        <h3 className="text-base md:text-lg font-bold text-[var(--color-fg)] mb-4 pb-3 border-b border-[var(--color-border)]">결제정보</h3>
                        <dl className="space-y-2.5 text-sm">
                            <div className="flex justify-between"><dt className="text-[var(--color-fg-muted)]">주문금액</dt><dd className="text-[var(--color-fg)] tabular-nums">{formatPrice(productAmount)}</dd></div>
                            {couponDiscount > 0 && <div className="flex justify-between"><dt className="text-[var(--color-fg-muted)]">할인 혜택</dt><dd className="text-[var(--color-fg)] tabular-nums">- {formatPrice(couponDiscount)}</dd></div>}
                            <div className="flex justify-between"><dt className="text-[var(--color-fg-muted)]">배송비</dt><dd className="text-[var(--color-fg)] tabular-nums">{shippingFee === 0 ? "0원" : formatPrice(shippingFee)}</dd></div>
                        </dl>
                        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                            <span className="text-sm text-[var(--color-fg-muted)]">결제 예정 금액</span>
                            <span className="text-lg font-bold text-[var(--color-fg)] tabular-nums">{formatPrice(paid)}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-4 w-full inline-flex items-center justify-center rounded-[8px] bg-[#3b82f6] text-white py-3.5 text-sm font-bold disabled:opacity-50 hover:opacity-90 transition tabular-nums"
                        >
                            {formatPrice(paid)} 결제하기
                        </button>
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
            </form>
            {error && <p className="text-sm text-[var(--color-danger)] mt-4">{error}</p>}
        </div>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[100px_1fr] md:grid-cols-[120px_1fr] gap-3 items-start">
            <dt className="text-[var(--color-fg-muted)] pt-2.5">
                {label}
                {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
            </dt>
            <dd>{children}</dd>
        </div>
    );
}
