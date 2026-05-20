"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { Button } from "@/components/ui";

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
        <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 text-[var(--color-fg-subtle)]">불러오는 중...</div>}>
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

    if (authLoading || !user) return <Shell><p className="text-[var(--color-fg-subtle)]">로그인 확인 중...</p></Shell>;
    if (error) return <Shell><p className="text-[var(--color-danger)]">{error}</p></Shell>;
    if (!order) return <Shell><p className="text-[var(--color-fg-subtle)]">불러오는 중...</p></Shell>;

    const canRefund = ["PAID", "PREPARING", "SHIPPING", "DELIVERED"].includes(order.status);

    return (
        <Shell>
            {justOrdered && (
                <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] px-4 py-3 text-sm">
                    주문이 정상 접수되었습니다.
                </div>
            )}

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xs text-[var(--color-fg-muted)]">주문번호</div>
                        <div className="font-mono text-[var(--color-fg)]">{order.orderNo}</div>
                    </div>
                    <span className="text-xs rounded-[var(--radius-sm)] bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)] px-2.5 py-1 font-medium">
                        {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                </div>
                <div className="text-xs text-[var(--color-fg-muted)]">{formatDate(order.orderedAt)} 주문</div>
            </div>

            <h2 className="font-medium text-base mb-3 text-[var(--color-fg)]">주문 상품</h2>
            <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] mb-4 overflow-hidden">
                {order.items.map(i => (
                    <li key={i.id} className="p-4 flex gap-3">
                        <div className="flex-1 min-w-0">
                            <Link href={`/p/${i.productId}`} className="text-sm font-medium hover:underline line-clamp-2 text-[var(--color-fg)]">
                                {i.productName}
                            </Link>
                            {i.optionText && <div className="text-xs text-[var(--color-fg-muted)] mt-1">{i.optionText}</div>}
                            <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">수량 {i.quantity}</div>
                            {order.status === "DELIVERED" && (
                                <Link
                                    href={`/reviews/write?orderItemId=${i.id}`}
                                    className="inline-block mt-2 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-fg)] px-2.5 py-1 hover:border-[var(--color-border-strong)]"
                                >리뷰 작성</Link>
                            )}
                        </div>
                        <div className="text-right text-sm text-[var(--color-fg)]">{formatPrice(i.subtotal)}</div>
                    </li>
                ))}
            </ul>

            <h2 className="font-medium text-base mb-3 text-[var(--color-fg)]">결제 정보</h2>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-4 text-sm space-y-1">
                <Row label="상품 합계" value={formatPrice(order.productAmount)} />
                <Row label="배송비" value={order.shippingFee === 0 ? "무료" : formatPrice(order.shippingFee)} />
                {order.discountAmount > 0 && <Row label="쿠폰 할인" value={`- ${formatPrice(order.discountAmount)}`} />}
                {order.pointUsed > 0 && <Row label="적립금 사용" value={`- ${formatPrice(order.pointUsed)}`} />}
                <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between font-bold text-[var(--color-fg)]">
                    <span>결제 금액</span><span>{formatPrice(order.paidAmount)}</span>
                </div>
            </div>

            <h2 className="font-medium text-base mb-3 text-[var(--color-fg)]">배송지</h2>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6 text-sm space-y-1">
                <Row label="수령인" value={order.recipientName} />
                <Row label="연락처" value={order.recipientPhoneMasked} />
                <Row label="주소" value={`(${order.postalCode}) ${order.address1} ${order.address2 ?? ""}`} />
                {order.memo && <Row label="메모" value={order.memo} />}
            </div>

            <div className="flex gap-2">
                <Link
                    href="/mypage"
                    className="flex-1 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] py-3.5 text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
                >
                    마이페이지
                </Link>
                {canRefund && (
                    <Button
                        onClick={() => setRefundOpen(true)}
                        variant="secondary"
                        size="lg"
                        fullWidth
                        className="flex-1 !border-[var(--color-danger)] !text-[var(--color-danger)] hover:!bg-[var(--color-danger-bg)]"
                    >
                        환불 신청
                    </Button>
                )}
            </div>

            {refundOpen && (
                <div className="fixed inset-0 bg-[var(--color-overlay)] z-40 flex items-end md:items-center justify-center p-4">
                    <div className="bg-[var(--color-surface)] w-full max-w-md rounded-[var(--radius-lg)] p-5 space-y-3">
                        <h3 className="font-medium text-base text-[var(--color-fg)]">환불 신청</h3>
                        <p className="text-xs text-[var(--color-fg-muted)]">반송 택배비가 환불 금액에서 차감될 수 있습니다.</p>
                        <textarea
                            value={refundReason}
                            onChange={e => setRefundReason(e.target.value)}
                            placeholder="환불 사유를 입력해주세요"
                            rows={4}
                            className="block w-full bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3 text-sm placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)] transition"
                        />
                        <div className="flex gap-2">
                            <Button onClick={() => setRefundOpen(false)} variant="secondary" fullWidth className="flex-1">
                                취소
                            </Button>
                            <Button
                                onClick={requestRefund}
                                fullWidth
                                className="flex-1 !bg-[var(--color-danger)] !text-white hover:!opacity-90"
                            >
                                신청
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return <div className="mx-auto max-w-2xl px-4 py-8"><h1 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--color-fg)]">주문 상세</h1>{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
    return <div className="flex justify-between"><span className="text-[var(--color-fg-muted)]">{label}</span><span className="text-[var(--color-fg)]">{value}</span></div>;
}
