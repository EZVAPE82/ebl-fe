"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";

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
    items: {
        id: number;
        productId: number;
        productName: string;
        optionText: string | null;
        unitPrice: number;
        quantity: number;
        subtotal: number;
    }[];
};

const STATUS_LABEL: Record<string, string> = {
    PENDING_PAYMENT: "결제 대기",
    PAID: "결제 완료",
    PREPARING: "상품 준비 중",
    SHIPPING: "배송 중",
    DELIVERED: "배송 완료",
    CANCELED: "취소",
    REFUNDED: "환불",
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 text-zinc-500">불러오는 중...</div>}>
            <OrderInner params={params} />
        </Suspense>
    );
}

function OrderInner({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const sp = useSearchParams();
    const justOrdered = sp.get("just") === "1";

    const [order, setOrder] = useState<OrderView | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refundOpen, setRefundOpen] = useState(false);
    const [refundReason, setRefundReason] = useState("");

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace(`/login?redirect=/orders/${id}`);
            return;
        }
        if (user) {
            api<OrderView>(`/api/v1/orders/${id}`, { auth: true })
                .then(setOrder)
                .catch(e => setError(e instanceof ApiError ? e.message : "주문을 불러오지 못했습니다."));
        }
    }, [user, authLoading, id, router]);

    async function requestRefund() {
        if (!order) return;
        try {
            await api(`/api/v1/orders/${order.id}/refund-requests`, {
                method: "POST", auth: true,
                body: JSON.stringify({ reason: refundReason || "unsatisfied" }),
            });
            setRefundOpen(false);
            alert("환불 신청이 접수되었습니다.");
            const fresh = await api<OrderView>(`/api/v1/orders/${order.id}`, { auth: true });
            setOrder(fresh);
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "환불 신청에 실패했습니다.");
        }
    }

    if (authLoading || !user) return <Shell><p className="text-zinc-500">로그인 확인 중...</p></Shell>;
    if (error) return <Shell><p className="text-rose-600">{error}</p></Shell>;
    if (!order) return <Shell><p className="text-zinc-500">불러오는 중...</p></Shell>;

    const canRefund = ["PAID", "PREPARING", "SHIPPING", "DELIVERED"].includes(order.status);

    return (
        <Shell>
            {justOrdered && (
                <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
                    주문이 정상 접수되었습니다.
                </div>
            )}

            <div className="rounded-md border border-zinc-200 p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xs text-zinc-500">주문번호</div>
                        <div className="font-mono">{order.orderNo}</div>
                    </div>
                    <span className="text-sm rounded-full bg-zinc-100 px-3 py-1">{STATUS_LABEL[order.status] ?? order.status}</span>
                </div>
                <div className="text-xs text-zinc-500">{formatDate(order.orderedAt)} 주문</div>
            </div>

            <h2 className="font-semibold text-sm mb-2">주문 상품</h2>
            <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 mb-4">
                {order.items.map(i => (
                    <li key={i.id} className="p-3 flex gap-3">
                        <div className="flex-1 min-w-0">
                            <Link href={`/p/${i.productId}`} className="text-sm font-medium hover:underline line-clamp-2">
                                {i.productName}
                            </Link>
                            {i.optionText && <div className="text-xs text-zinc-500 mt-1">{i.optionText}</div>}
                            <div className="text-xs text-zinc-500 mt-0.5">수량 {i.quantity}</div>
                        </div>
                        <div className="text-right text-sm">{formatPrice(i.subtotal)}</div>
                    </li>
                ))}
            </ul>

            <h2 className="font-semibold text-sm mb-2">결제 정보</h2>
            <div className="rounded-md border border-zinc-200 p-4 mb-4 text-sm space-y-1">
                <Row label="상품 합계" value={formatPrice(order.productAmount)} />
                <Row label="배송비" value={order.shippingFee === 0 ? "무료" : formatPrice(order.shippingFee)} />
                {order.discountAmount > 0 && <Row label="쿠폰 할인" value={`- ${formatPrice(order.discountAmount)}`} />}
                {order.pointUsed > 0 && <Row label="적립금 사용" value={`- ${formatPrice(order.pointUsed)}`} />}
                <div className="border-t border-zinc-200 pt-2 mt-2 flex justify-between font-bold">
                    <span>결제 금액</span><span>{formatPrice(order.paidAmount)}</span>
                </div>
            </div>

            <h2 className="font-semibold text-sm mb-2">배송지</h2>
            <div className="rounded-md border border-zinc-200 p-4 mb-6 text-sm space-y-1">
                <Row label="수령인" value={order.recipientName} />
                <Row label="연락처" value={order.recipientPhoneMasked} />
                <Row label="주소" value={`(${order.postalCode}) ${order.address1} ${order.address2 ?? ""}`} />
                {order.memo && <Row label="메모" value={order.memo} />}
            </div>

            <div className="flex gap-2">
                <Link href="/mypage" className="flex-1 rounded-md border border-zinc-300 py-3 text-sm font-medium text-center">
                    마이페이지
                </Link>
                {canRefund && (
                    <button
                        onClick={() => setRefundOpen(true)}
                        className="flex-1 rounded-md border border-rose-300 text-rose-600 py-3 text-sm font-medium hover:bg-rose-50"
                    >
                        환불 신청
                    </button>
                )}
            </div>

            {refundOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-md p-4 space-y-3">
                        <h3 className="font-semibold">환불 신청</h3>
                        <p className="text-xs text-zinc-500">반송 택배비가 환불 금액에서 차감될 수 있습니다.</p>
                        <textarea
                            value={refundReason}
                            onChange={e => setRefundReason(e.target.value)}
                            placeholder="환불 사유를 입력해주세요"
                            rows={4}
                            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setRefundOpen(false)} className="flex-1 rounded border border-zinc-300 py-2 text-sm">취소</button>
                            <button onClick={requestRefund} className="flex-1 rounded bg-rose-600 text-white py-2 text-sm">신청</button>
                        </div>
                    </div>
                </div>
            )}
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return <div className="mx-auto max-w-2xl px-4 py-8"><h1 className="text-xl md:text-2xl font-bold mb-6">주문 상세</h1>{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
    return <div className="flex justify-between"><span className="text-zinc-500">{label}</span><span>{value}</span></div>;
}
