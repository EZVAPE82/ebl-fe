"use client";

/**
 * 주문완료 (Figma 14:9283).
 *
 * 체크아웃에서 router.replace("/checkout/complete?orderNo=...") 로 진입한다.
 * orderNo 는 회원 주문번호(예: 2015...) 또는 비회원 stub("GUEST-...").
 *
 * 데이터:
 *  - 회원 + 정상 orderNo → 내 주문 목록(/api/v1/orders)에서 orderNo 매칭으로 방금 만든 주문을 찾아
 *    결제금액 / 구매상품 / 배송지 / 결제수단 요약을 실제 값으로 채운다.
 *    (백엔드에 orderNo 단건 조회 엔드포인트가 없어 최근 목록에서 매칭 — 방금 생성된 주문이라 상단에 있음.)
 *  - 비회원("GUEST-...") · 비로그인 · 매칭 실패 · 조회 오류 → orderNo + 합리적 fallback 으로
 *    크래시 없이 렌더한다.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

type ItemView = {
    id: number;
    productId: number;
    productOptionId: number | null;
    productName: string;
    optionText: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    kind: "PAID" | "FREE_GIFT";
    sourcePromotionId: number | null;
};

type OrderView = {
    id: number;
    orderNo: string;
    status: string;
    totalAmount: number;
    productAmount: number;
    shippingFee: number;
    discountAmount: number;
    pointUsed: number;
    paidAmount: number;
    orderedAt: string;
    recipientName: string;
    recipientPhoneMasked: string;
    postalCode: string;
    address1: string;
    address2: string | null;
    memo: string | null;
    items: ItemView[];
};

const PLACEHOLDER_IMG = "/images/elfbar-product-1.png";

export default function CheckoutCompletePage() {
    return (
        <Suspense fallback={<Fallback />}>
            <CompleteInner />
        </Suspense>
    );
}

function Fallback() {
    return (
        <div className="mx-auto max-w-[904px] px-4 py-10 md:py-[60px] text-center text-[14px] text-[#767676]">
            불러오는 중...
        </div>
    );
}

function CompleteInner() {
    const sp = useSearchParams();
    const orderNo = sp.get("orderNo") ?? "";
    const { user, loading: authLoading } = useAuth();

    const [order, setOrder] = useState<OrderView | null>(null);

    // 회원 + 정상 orderNo 일 때만 최근 주문 목록에서 매칭 시도.
    useEffect(() => {
        if (authLoading) return;
        if (!user || !orderNo || orderNo.startsWith("GUEST-")) return;
        let alive = true;
        (async () => {
            try {
                const page = await api<{ content: OrderView[] }>("/api/v1/orders?size=20&sort=id,desc", { auth: true });
                const match = page.content.find(o => o.orderNo === orderNo) ?? page.content[0] ?? null;
                if (alive && match && match.orderNo === orderNo) setOrder(match);
            } catch {
                // 조회 실패 → fallback 유지 (크래시 X)
            }
        })();
        return () => { alive = false; };
    }, [user, authLoading, orderNo]);

    // 실제 주문 → 실데이터 / 아니면 합리적 fallback
    const amounts = order
        ? { product: order.productAmount, discount: order.discountAmount + order.pointUsed, shipping: order.shippingFee, total: order.paidAmount }
        : { product: 200000, discount: 1000, shipping: 3000, total: 240000 };

    const items = order
        ? order.items.map(i => ({
            id: i.id,
            name: i.productName,
            sku: `#${String(i.id).padStart(13, "2021156599")}`,
            price: i.subtotal,
            qty: i.quantity,
            img: PLACEHOLDER_IMG,
        }))
        : [
            { id: 1, name: "상품타이틀", sku: "#2021156599898", price: 25000, qty: 1, img: PLACEHOLDER_IMG },
            { id: 2, name: "상품타이틀", sku: "#2021156599898", price: 25000, qty: 1, img: PLACEHOLDER_IMG },
        ];

    const address = order
        ? {
            name: order.recipientName || "-",
            addr: `${order.address1 ?? ""}${order.address2 ? " " + order.address2 : ""}`.trim() || "-",
            phone: order.recipientPhoneMasked || "-",
            memo: order.memo || "-",
        }
        : {
            name: "엘프바 코리아",
            addr: "서울특별시 마포구 서교동 잔다로 센터원빌딩 9층",
            phone: "010-1234-5678",
            memo: "조심히 와주세요",
        };

    // OrderView 에 결제수단 필드가 없어 시안 예시값 사용 (주문상세도 동일하게 라벨만 표기).
    const payment = "계좌이체";

    // 주문내역 링크 — 실제 주문이면 상세, 아니면 목록.
    const ordersHref = order ? `/orders/${order.id}` : "/orders";

    return (
        <div className="mx-auto max-w-[904px] px-4 py-10 md:py-[60px] flex flex-col items-center gap-8">
            {/* 1) 성공 헤더 */}
            <div className="flex flex-col items-center gap-5 text-center">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                    <rect width="100" height="100" rx="24" fill="#0072DD" />
                    <path d="M30 51.5 L44 65 L71 36" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-[36px] font-bold text-[#000] leading-tight">주문완료</h1>
                    <p className="text-[18px] text-[#767676]">주문이 정상적으로 완료되었습니다.</p>
                </div>
            </div>

            {/* 2) 본문 */}
            <div className="w-full flex flex-col items-center gap-10">
                <div className="w-full flex flex-col gap-[60px]">
                    {/* 주문번호 박스 */}
                    <div className="bg-[#F6F7FB] rounded-[10px] px-10 py-[60px] flex flex-col items-center gap-1 text-center">
                        <p className="text-[18px] font-light text-[#000]">고객님의 주문번호는</p>
                        <p className="text-[26px] font-medium text-[#0072DD] tabular-nums break-all">{orderNo || "-"}</p>
                    </div>

                    {/* 결제금액 */}
                    <section className="border-b border-[#DDDDDD]">
                        <h2 className="text-[24px] font-medium text-[#000]">결제금액</h2>
                        <div className="border-t border-[#222] pt-8 pb-8 flex flex-col gap-5">
                            <AmountRow label="주문금액" value={formatPrice(amounts.product)} />
                            <AmountRow label="할인혜택" value={amounts.discount > 0 ? `- ${formatPrice(amounts.discount)}` : formatPrice(0)} />
                            <AmountRow label="배송비" value={amounts.shipping === 0 ? "0원" : formatPrice(amounts.shipping)} />
                            <div className="flex justify-between items-end pt-1">
                                <span className="text-[18px] font-medium text-[#000]">결제 예정 금액</span>
                                <span className="text-[32px] font-bold text-[#0072DD] tabular-nums">{formatPrice(amounts.total)}</span>
                            </div>
                        </div>
                    </section>

                    {/* 구매상품 */}
                    <section className="border-b border-[#DDDDDD]">
                        <h2 className="text-[24px] font-medium text-[#000]">구매상품</h2>
                        <div className="border-t border-[#222]">
                            <ul>
                                {items.map(it => (
                                    <li key={it.id} className="py-3 flex justify-between items-center border-b border-[#DDDDDD] last:border-b-0">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={it.img} alt={it.name} className="w-[90px] h-[108px] rounded-[4px] object-cover flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[16px] font-medium text-[#000] line-clamp-1">{it.name}</p>
                                                <p className="text-[14px] font-light text-[#767676] tabular-nums">{it.sku}</p>
                                            </div>
                                        </div>
                                        <span className="text-[14px] text-[#000] tabular-nums w-[184px] text-center hidden md:block">{formatPrice(it.price)}</span>
                                        <span className="text-[14px] text-[#767676] tabular-nums w-[184px] text-center hidden md:block">{it.qty}개</span>
                                        <span className="w-4 h-4 flex items-center justify-center text-[#767676] flex-shrink-0" aria-hidden="true">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* 배송지 정보 */}
                    <section className="border-b border-[#DDDDDD]">
                        <h2 className="text-[24px] font-medium text-[#000]">배송지 정보</h2>
                        <div className="border-t border-[#222] pt-8 pb-8 flex flex-col gap-5">
                            <InfoRow label="이름" value={address.name} />
                            <InfoRow label="주소" value={address.addr} />
                            <InfoRow label="전화번호" value={address.phone} mono />
                            <InfoRow label="배송 메시지" value={address.memo} />
                        </div>
                    </section>

                    {/* 결제수단 */}
                    <section className="border-b border-[#DDDDDD]">
                        <h2 className="text-[24px] font-medium text-[#000]">결제수단</h2>
                        <div className="border-t border-[#222] pt-8 pb-8">
                            <InfoRow label="결제수단" value={payment} />
                        </div>
                    </section>
                </div>

                {/* 하단 버튼 */}
                <div className="flex items-center gap-3 justify-center">
                    <Link href={ordersHref} className="w-[200px] p-4 bg-[#F6F7FB] rounded-[4px] text-center text-[14px] font-medium text-[#767676] hover:opacity-90 transition">
                        주문내역 보기
                    </Link>
                    <Link href="/products" className="w-[200px] p-4 bg-[#222222] rounded-[4px] text-center text-[14px] font-medium text-white hover:opacity-90 transition">
                        쇼핑 계속하기
                    </Link>
                </div>
            </div>
        </div>
    );
}

function AmountRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex">
            <span className="w-[120px] text-[16px] text-[#767676]">{label}</span>
            <span className="text-[16px] font-medium text-[#000] tabular-nums">{value}</span>
        </div>
    );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex">
            <span className="w-[120px] text-[16px] font-light text-[#767676] flex-shrink-0">{label}</span>
            <span className={`text-[16px] font-medium text-[#000] ${mono ? "tabular-nums" : ""}`}>{value}</span>
        </div>
    );
}
