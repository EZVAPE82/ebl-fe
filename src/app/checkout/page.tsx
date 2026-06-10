"use client";

import { useEffect, useRef, useState } from "react";
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
    // 멱등키 — 더블클릭/네트워크 재시도가 같은 키를 보내 이중주문/이중청구를 막는다.
    // 실패 후 사용자가 재시도하면 새 키를 발급(아래 catch)해 정상적인 새 결제 시도로 처리.
    const idemKeyRef = useRef<string>("");
    if (!idemKeyRef.current) {
        idemKeyRef.current = (typeof crypto !== "undefined" && crypto.randomUUID)
            ? crypto.randomUUID()
            : `ck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

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
                    idempotencyKey: idemKeyRef.current,
                }),
            });
            router.replace(`/checkout/complete?orderNo=${order.orderNo}`);
        } catch (e) {
            // 결제 실패 → 다음 시도는 새 멱등키로 (이전 시도의 취소된 주문과 분리)
            idemKeyRef.current = (typeof crypto !== "undefined" && crypto.randomUUID)
                ? crypto.randomUUID()
                : `ck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setError(e instanceof ApiError ? e.message : "결제에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    if (authLoading) {
        return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    const inputClass = "w-full bg-[var(--color-surface)] p-4 rounded-[4px] border border-[#E5E5EC] text-[14px] text-[#767676] placeholder:text-[#767676] focus:outline-none focus:border-[var(--color-fg-muted)] transition";
    const selectClass = inputClass + " appearance-none cursor-pointer";

    return (
        <div className="mx-auto max-w-[1580px] px-4 md:px-8 py-8">
            <form onSubmit={onSubmit} className="flex flex-col lg:flex-row lg:justify-between gap-6 lg:gap-10">
                {/* ===== 좌: 폼 ===== */}
                <div className="flex flex-col gap-[60px] w-full lg:w-[1036px]">
                    {/* 구매상품 */}
                    <section>
                        <h2 className="text-[24px] font-medium text-[#000]">구매상품</h2>
                        <div className="border-t border-[#222]">
                            <ul className="divide-y divide-[var(--color-border)]">
                                {lines.map(l => (
                                    <li key={l.id} className="py-3 flex justify-between items-center gap-3">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={l.img} alt={l.name} className="w-[90px] h-[108px] rounded-[4px] object-cover flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[16px] font-medium text-[var(--color-fg)] line-clamp-1">{l.name}</p>
                                                <p className="text-[14px] font-light text-[#767676] tabular-nums">{l.orderNo}</p>
                                            </div>
                                        </div>
                                        <span className="text-[14px] text-[var(--color-fg)] tabular-nums whitespace-nowrap">{formatPrice(l.price)}</span>
                                        <span className="text-[14px] text-[var(--color-fg-muted)] inline-flex items-center gap-2 whitespace-nowrap">
                                            <span aria-hidden>−</span>
                                            <span className="tabular-nums min-w-[20px] text-center">{l.qty}</span>
                                            <span aria-hidden>+</span>
                                        </span>
                                        <button type="button" aria-label="삭제" className="w-6 h-6 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] flex-shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* 배송지 */}
                    <section>
                        <h2 className="text-[24px] font-medium text-[#000]">배송지</h2>
                        <div className="border-t border-[#222]">

                        {/* 회원만 — 최근배송지 / 직접입력 탭 */}
                        {user && (
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setAddressMode("recent")} className={`px-4 py-3 rounded-[4px] text-[14px] font-medium transition ${addressMode === "recent" ? "bg-[#0072DD] text-white" : "border border-[#DDDDDD] text-[#000]"}`}>최근배송지 입력</button>
                                <button type="button" onClick={() => setAddressMode("direct")} className={`px-4 py-3 rounded-[4px] text-[14px] font-medium transition ${addressMode === "direct" ? "bg-[#0072DD] text-white" : "border border-[#DDDDDD] text-[#000]"}`}>직접입력</button>
                            </div>
                        )}

                        {user && addressMode === "recent" ? (
                            <dl className="flex flex-col gap-5 pt-8 pb-8">
                                <div className="flex">
                                    <dt className="w-[120px] text-[16px] text-[#767676]">이름</dt>
                                    <dd className="text-[16px] font-medium text-[#000]">{form.recipientName || user.name || "시그널디코드"}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-[120px] text-[16px] text-[#767676]">주소</dt>
                                    <dd className="text-[16px] font-medium text-[#000]">{form.address1 ? `${form.address1}${form.address2 ? " " + form.address2 : ""}` : "서울특별시 마포구 서교동 잔다로 센터원빌딩 6층"}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-[120px] text-[16px] text-[#767676]">전화번호</dt>
                                    <dd className="text-[16px] font-medium text-[#000] tabular-nums">{user.phone || "010-1234-5678"}</dd>
                                </div>
                                <div className="flex items-start">
                                    <dt className="w-[120px] text-[16px] text-[#767676] pt-4">배송요청사항</dt>
                                    <dd>
                                        <div className="relative w-full md:w-[480px]">
                                            <select className={`${selectClass} w-full pr-10 flex justify-between text-[14px] text-[#505050]`} value={form.memo} onChange={e => setForm(s => ({ ...s, memo: e.target.value }))}>
                                                <option value="">배송메시지를 선택해주세요(선택입력)</option>
                                                <option value="조심히 와주세요">조심히 와주세요</option>
                                                <option value="문 앞에 놔주세요">문 앞에 놔주세요</option>
                                            </select>
                                            <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#505050]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                        </div>
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <dl className="flex flex-col gap-8 pt-10 pb-10 text-sm">
                                <Field label="받는 사람" required>
                                    <input type="text" placeholder="이름을 작성해주세요" className={`${inputClass} md:w-[480px]`} value={form.recipientName} onChange={e => setForm(s => ({ ...s, recipientName: e.target.value }))} />
                                </Field>
                                <Field label="주소" required>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="우편번호" className={`${inputClass} md:w-[260px]`} value={form.postalCode} onChange={e => setForm(s => ({ ...s, postalCode: e.target.value }))} />
                                            <button type="button" className="w-[140px] p-4 bg-[#0072DD] rounded-[4px] text-white text-[14px] font-medium hover:opacity-90 transition whitespace-nowrap">우편번호 찾기</button>
                                        </div>
                                        <input type="text" placeholder="기본주소" className={`${inputClass} md:w-[600px]`} value={form.address1} onChange={e => setForm(s => ({ ...s, address1: e.target.value }))} />
                                        <input type="text" placeholder="상세주소 (선택)" className={`${inputClass} md:w-[600px]`} value={form.address2} onChange={e => setForm(s => ({ ...s, address2: e.target.value }))} />
                                    </div>
                                </Field>
                                <Field label="일반전화" required>
                                    <div className="flex items-center gap-2">
                                        <select className={`${selectClass} md:w-[150px]`} value={form.phoneHome1} onChange={e => setForm(s => ({ ...s, phoneHome1: e.target.value }))}>
                                            <option>02</option><option>031</option><option>032</option><option>051</option>
                                        </select>
                                        <span className="w-[7px] h-px bg-[#222] flex-shrink-0" aria-hidden />
                                        <input type="text" placeholder="123" className={`${inputClass} md:w-[150px]`} value={form.phoneHome2} onChange={e => setForm(s => ({ ...s, phoneHome2: e.target.value }))} />
                                        <span className="w-[7px] h-px bg-[#222] flex-shrink-0" aria-hidden />
                                        <input type="text" placeholder="567" className={`${inputClass} md:w-[150px]`} value={form.phoneHome3} onChange={e => setForm(s => ({ ...s, phoneHome3: e.target.value }))} />
                                    </div>
                                </Field>
                                <Field label="휴대전화" required>
                                    <div className="flex items-center gap-2">
                                        <select className={`${selectClass} md:w-[150px]`} value={form.recipientPhone1} onChange={e => setForm(s => ({ ...s, recipientPhone1: e.target.value }))}>
                                            <option>010</option><option>011</option>
                                        </select>
                                        <span className="w-[7px] h-px bg-[#222] flex-shrink-0" aria-hidden />
                                        <input type="text" placeholder="1234" className={`${inputClass} md:w-[150px]`} value={form.recipientPhone2} onChange={e => setForm(s => ({ ...s, recipientPhone2: e.target.value }))} />
                                        <span className="w-[7px] h-px bg-[#222] flex-shrink-0" aria-hidden />
                                        <input type="text" placeholder="5678" className={`${inputClass} md:w-[150px]`} value={form.recipientPhone3} onChange={e => setForm(s => ({ ...s, recipientPhone3: e.target.value }))} />
                                    </div>
                                </Field>
                                <Field label="이메일" required>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input type="text" placeholder="이메일" className={`${inputClass} md:w-[212px]`} value={form.emailLocal} onChange={e => setForm(s => ({ ...s, emailLocal: e.target.value }))} />
                                        <span className="text-[var(--color-fg-subtle)]">@</span>
                                        <input type="text" placeholder="naver.com" className={`${inputClass} md:w-[212px]`} value={form.emailDomain} onChange={e => setForm(s => ({ ...s, emailDomain: e.target.value }))} />
                                        <select className={`${selectClass} md:w-[140px]`} value="" onChange={e => { if (e.target.value) setForm(s => ({ ...s, emailDomain: e.target.value })); }}>
                                            <option value="">직접입력</option>
                                            <option value="naver.com">naver.com</option>
                                            <option value="gmail.com">gmail.com</option>
                                            <option value="daum.net">daum.net</option>
                                            <option value="hanmail.net">hanmail.net</option>
                                            <option value="kakao.com">kakao.com</option>
                                        </select>
                                    </div>
                                </Field>
                                <Field label="배송 요청사항" required>
                                    <div className="relative md:w-[480px]">
                                        <select className={`${selectClass} w-full pr-10`} value={form.memo} onChange={e => setForm(s => ({ ...s, memo: e.target.value }))}>
                                            <option value="">메시지 선택(선택사항)</option>
                                            <option value="조심히 와주세요">조심히 와주세요</option>
                                        </select>
                                        <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#767676]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                </Field>
                                {isGuest && (
                                    <Field label="기본 배송지 저장" required>
                                        <div className="flex items-center gap-6 text-sm">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${form.defaultAddress === "save" ? "border-[#0072DD]" : "border-[var(--color-border)]"}`}>
                                                    {form.defaultAddress === "save" && <span className="w-2 h-2 rounded-full bg-[#0072DD]" />}
                                                </span>
                                                <input type="radio" name="defaultAddress" checked={form.defaultAddress === "save"} onChange={() => setForm(s => ({ ...s, defaultAddress: "save" }))} className="sr-only"/>
                                                <span className="text-[var(--color-fg)]">저장함</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${form.defaultAddress === "skip" ? "border-[#0072DD]" : "border-[var(--color-border)]"}`}>
                                                    {form.defaultAddress === "skip" && <span className="w-2 h-2 rounded-full bg-[#0072DD]" />}
                                                </span>
                                                <input type="radio" name="defaultAddress" checked={form.defaultAddress === "skip"} onChange={() => setForm(s => ({ ...s, defaultAddress: "skip" }))} className="sr-only"/>
                                                <span className="text-[var(--color-fg-muted)]">저장안함</span>
                                            </label>
                                        </div>
                                    </Field>
                                )}
                            </dl>
                        )}
                        </div>
                    </section>

                    {/* 비회원 비밀번호 */}
                    {isGuest && (
                        <section>
                            <h2 className="text-[24px] font-medium text-[#000]">비회원 주문조회 비밀번호</h2>
                            <div className="border-t border-[#222]">
                                <dl className="flex flex-col gap-8 pt-10 pb-10 text-sm">
                                    <Field label="비밀번호" required>
                                        <input type="password" className={`${inputClass} md:w-[480px]`} value={form.guestPassword} onChange={e => setForm(s => ({ ...s, guestPassword: e.target.value }))} />
                                        <p className="mt-2 text-[14px] font-light text-[#DC0000]">(영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10자 ~ 16자)</p>
                                    </Field>
                                    <Field label="비밀번호 확인">
                                        <input type="password" className={`${inputClass} md:w-[480px]`} value={form.guestPasswordConfirm} onChange={e => setForm(s => ({ ...s, guestPasswordConfirm: e.target.value }))} />
                                    </Field>
                                </dl>
                            </div>
                        </section>
                    )}

                    {/* 회원 — 할인/부가결제 (쿠폰/적립금) */}
                    {user && (
                        <section>
                            <h2 className="text-[24px] font-medium text-[#000]">할인/부가결제</h2>
                            <div className="border-t border-[#222]">
                                <dl className="flex flex-col gap-8 pt-10 pb-10">
                                    {/* 쿠폰적용 */}
                                    <div className="flex flex-col md:flex-row md:items-start gap-1.5 md:gap-3">
                                        <dt className="w-[120px] text-[16px] font-medium text-[#222] md:pt-4 flex-shrink-0">쿠폰적용<span className="text-[#0072DD] ml-0.5">*</span></dt>
                                        <dd>
                                            <select className={`${selectClass} md:w-[480px]`} value={form.memberCouponId ?? ""} onChange={e => setForm(s => ({ ...s, memberCouponId: e.target.value ? Number(e.target.value) : null }))}>
                                                <option value="">사용 가능한 쿠폰 없음</option>
                                                {coupons.map(c => (
                                                    <option key={c.memberCouponId} value={c.memberCouponId}>
                                                        {c.name} ({c.discountType === "AMOUNT" ? formatPrice(c.discountValue) : `${c.discountValue}%`})
                                                    </option>
                                                ))}
                                            </select>
                                        </dd>
                                    </div>
                                    {/* 적립금 */}
                                    <div className="flex flex-col md:flex-row md:items-start gap-1.5 md:gap-3">
                                        <dt className="w-[120px] text-[16px] font-medium text-[#222] md:pt-4 flex-shrink-0">적립금<span className="text-[#0072DD] ml-0.5">*</span></dt>
                                        <dd>
                                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                {balance < 5000 ? (
                                                    <input type="text" disabled className="w-full md:w-[480px] p-4 rounded-[4px] border border-[#BEBEBE] bg-[#F6F7FB] text-[14px] text-[#505050] placeholder:text-[#505050]" placeholder="최소 5,000원 이상 보유 시 사용 가능" />
                                                ) : (
                                                    <input type="number" min={0} max={Math.min(balance, productAmount)} className={`${inputClass} md:w-[480px]`} placeholder="사용할 적립금을 입력해주세요" value={form.pointUsed || ""} onChange={e => setForm(s => ({ ...s, pointUsed: Math.max(0, Math.min(Number(e.target.value) || 0, balance, productAmount)) }))} />
                                                )}
                                                <span className="text-[14px] text-[#767676]">*본 혜택은 쿠폰 및 적립금 중복 적용이 제한됩니다.</span>
                                            </div>
                                            <p className="mt-2 text-[14px] text-[#767676]">보유적립금 <span className="font-medium text-[#0072DD] tabular-nums">{formatPrice(balance)}</span></p>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </section>
                    )}

                    {/* 결제수단 */}
                    <section>
                        <h2 className="text-[24px] font-medium text-[#000]">결제수단 선택</h2>
                        <div className="border-t border-[#222]">
                            <div className="pt-6 pb-10">
                                {/* 결제수단 라디오 row */}
                                <div className="flex items-center gap-6 text-sm border-b border-[#E5E5EC] pb-6">
                                    {([
                                        { key: "CARD", label: "계좌 간편결제" },
                                        { key: "EASY", label: "카드간편결제" },
                                        { key: "BANK", label: "일반결제" },
                                    ] as const).map(m => (
                                        <label key={m.key} className="flex items-center gap-1.5 cursor-pointer">
                                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${form.paymentMethod === m.key ? "border-[#0072DD]" : "border-[var(--color-border)]"}`}>
                                                {form.paymentMethod === m.key && <span className="w-2 h-2 rounded-full bg-[#0072DD]" />}
                                            </span>
                                            <input type="radio" name="payment" checked={form.paymentMethod === m.key} onChange={() => setForm(s => ({ ...s, paymentMethod: m.key }))} className="sr-only" />
                                            <span className={form.paymentMethod === m.key ? "text-[var(--color-fg)] font-medium" : "text-[var(--color-fg-muted)]"}>{m.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* 카드결제 block */}
                                <div className="flex flex-col gap-8 w-full md:w-[600px] pt-8">
                                    <div className="relative md:w-[480px]">
                                        <select className={`${selectClass} w-full pr-10`} value={form.cardSelect} onChange={e => setForm(s => ({ ...s, cardSelect: e.target.value }))}>
                                            <option value="">카드를 선택해주세요.</option>
                                            <option>신한카드</option><option>현대카드</option><option>국민카드</option>
                                        </select>
                                        <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#767676]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                    <div className="relative md:w-[480px]">
                                        <select className={`${selectClass} w-full pr-10`} value={form.installment} onChange={e => setForm(s => ({ ...s, installment: e.target.value }))}>
                                            <option>일시불</option><option>2개월</option><option>3개월</option>
                                        </select>
                                        <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#767676]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                    {user && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="w-[22px] h-[22px]" />
                                            <span className="text-[14px] text-[#767676]">결제수단과 입력정보를 다음에도 사용</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ===== 우: 결제정보 sticky ===== */}
                <aside className="lg:sticky lg:top-4 lg:self-start w-full lg:w-[464px] flex-shrink-0">
                    <div className="rounded-[10px] bg-[#F6F7FB] p-6 md:p-9 flex flex-col gap-8">
                        <div>
                            <h3 className="text-[24px] font-medium text-[var(--color-fg)] border-b border-[#222] pb-4">결제정보</h3>
                            <dl className="flex flex-col gap-2.5 pt-4">
                                <div className="flex justify-between"><dt className="text-[18px] font-light text-[#767676]">주문금액</dt><dd className="text-[18px] font-medium text-[#000] tabular-nums">{formatPrice(productAmount)}</dd></div>
                                {(couponDiscount + (form.pointUsed || 0)) > 0 && <div className="flex justify-between"><dt className="text-[18px] font-light text-[#767676]">할인 혜택</dt><dd className="text-[18px] font-medium text-[#000] tabular-nums">- {formatPrice(couponDiscount + (form.pointUsed || 0))}</dd></div>}
                                <div className="flex justify-between"><dt className="text-[18px] font-light text-[#767676]">배송비</dt><dd className="text-[18px] font-medium text-[#000] tabular-nums">{shippingFee === 0 ? "0원" : formatPrice(shippingFee)}</dd></div>
                            </dl>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[16px] text-[#767676]">결제 예정 금액</span>
                            <span className="text-[26px] font-medium text-[#222] tabular-nums">{formatPrice(paid)}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full inline-flex items-center justify-center h-[60px] rounded-[4px] bg-[#0072DD] text-white text-[16px] font-medium disabled:opacity-50 hover:opacity-90 transition tabular-nums"
                        >
                            {formatPrice(paid)} 결제하기
                        </button>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-2 cursor-pointer border-b border-[#DDD] pb-3">
                                <input type="checkbox" className="w-7 h-7" />
                                <span className="text-[18px] font-medium text-[var(--color-fg)]">전체약관 동의</span>
                            </label>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-[22px] h-[22px]" />
                                    <span className="text-[14px] font-medium text-[#767676]">이용약관 동의 <span className="text-[#0072DD]">[필수]</span></span>
                                </label>
                                <svg className="text-[#767676]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18"/></svg>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-[22px] h-[22px]" />
                                    <span className="text-[14px] font-medium text-[#767676]">{isGuest ? "비회원 " : ""}개인정보 수집 이용동의</span>
                                </label>
                                <svg className="text-[#767676]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18"/></svg>
                            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-1.5 md:gap-3 md:items-start">
            <dt className="text-[14px] font-medium text-[#000] md:pt-4">
                {label}
                {required && <span className="text-[#0072DD] ml-0.5">*</span>}
            </dt>
            <dd>{children}</dd>
        </div>
    );
}
