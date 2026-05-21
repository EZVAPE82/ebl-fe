"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge, Button } from "@/components/ui";

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

const STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
    PENDING_PAYMENT: "warning",
    PAID: "info",
    PREPARING: "info",
    SHIPPING: "info",
    DELIVERED: "success",
    CANCELED: "neutral",
    REFUNDED: "danger",
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8 text-[var(--color-fg-subtle)]">불러오는 중...</div>}>
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
        <Shell hideTitle={justOrdered}>
            {justOrdered && (
                <div className="mb-8 text-center">
                    {/* 체크 마크 */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-3xl mb-4">
                        ✓
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)]">주문완료</h1>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">주문이 정상적으로 완료되었습니다.</p>
                    {/* 주문번호 강조 카드 */}
                    <div className="mt-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] py-5 px-4">
                        <p className="text-xs text-[var(--color-fg-muted)] mb-1">고객님의 주문번호는</p>
                        <p className="font-mono text-lg md:text-xl font-bold text-[var(--color-accent)]">{order.orderNo}</p>
                    </div>
                </div>
            )}

            {/* 1. 주문정보 */}
            <DlSection title="주문정보">
                <DlRow label="주문번호" value={<span className="font-mono">{order.orderNo}</span>} />
                <DlRow label="주문일자" value={formatDate(order.orderedAt)} />
                <DlRow label="주문자"   value={user.name} />
                <DlRow label="주문처리상태" value={<Badge size="sm" tone={STATUS_TONE[order.status] ?? "neutral"}>● {STATUS_LABEL[order.status] ?? order.status}</Badge>} />
            </DlSection>

            {/* 2. 결제정보 */}
            <DlSection title="결제정보">
                <DlRow label="총 주문금액"  value={formatPrice(order.productAmount)} />
                <DlRow label="배송비"       value={order.shippingFee === 0 ? "무료" : formatPrice(order.shippingFee)} />
                <DlRow label="총 할인금액"  value={order.discountAmount > 0 ? `- ${formatPrice(order.discountAmount)}` : "0원"} />
                <DlRow label="적립금 사용"  value={order.pointUsed > 0 ? `- ${formatPrice(order.pointUsed)}` : "0원"} />
                <DlRow label="총 결제금액"  value={<span className="font-bold text-[var(--color-fg)]">{formatPrice(order.paidAmount)}</span>} emphasized />
                <DlRow label="결제수단"     value="카드결제" />
            </DlSection>

            {/* 3. 주문상품정보 */}
            <section className="mb-8">
                <SectionTitle>주문상품정보</SectionTitle>
                <ul className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden">
                    {order.items.map(i => (
                        <li key={i.id} className="grid grid-cols-[56px_1fr_auto] md:grid-cols-[80px_1fr_120px_80px_140px_100px] items-center gap-3 px-4 py-4">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--color-bg-subtle)] rounded-[var(--radius-sm)] flex-shrink-0" />
                            <div className="min-w-0">
                                <Link href={`/p/${i.productId}`} className="text-sm font-medium hover:underline line-clamp-1 text-[var(--color-fg)]">
                                    {i.productName}
                                </Link>
                                {i.optionText && <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">{i.optionText}</p>}
                                <p className="text-xs text-[var(--color-fg-muted)] mt-0.5 font-mono md:hidden">#{order.orderNo}</p>
                                {/* 모바일 한정: 가격·수량·날짜 인라인 */}
                                <p className="md:hidden text-xs text-[var(--color-fg-muted)] mt-1">
                                    <span className="text-[var(--color-fg)] font-semibold">{formatPrice(i.subtotal)}</span>
                                    <span className="mx-1.5">·</span>{i.quantity}개
                                    <span className="mx-1.5">·</span>{formatDate(order.orderedAt)}
                                </p>
                            </div>
                            {/* PC 전용 컬럼 */}
                            <div className="hidden md:block text-sm font-semibold text-[var(--color-fg)]">{formatPrice(i.subtotal)}</div>
                            <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">{i.quantity}개</div>
                            <div className="hidden md:block text-xs text-[var(--color-fg-muted)]">{formatDate(order.orderedAt)}</div>
                            <div className="text-right">
                                <Badge size="sm" tone={STATUS_TONE[order.status] ?? "neutral"}>● {STATUS_LABEL[order.status] ?? order.status}</Badge>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {/* 4. 추가정보 (배송지 등) */}
            <DlSection title="추가정보">
                <DlRow label="받으시는 분" value={order.recipientName} />
                <DlRow label="우편번호"   value={order.postalCode} />
                <DlRow label="주소"       value={`${order.address1} ${order.address2 ?? ""}`} />
                <DlRow label="휴대전화"   value={order.recipientPhoneMasked} />
                {order.memo && <DlRow label="배송 메모" value={order.memo} />}
                <DlRow label="추가정보" value={
                    <div className="flex gap-2">
                        <button className="text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-fg)] px-3 py-1.5 hover:border-[var(--color-border-strong)]">
                            현금영수증 신청
                        </button>
                        <button className="text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-fg)] px-3 py-1.5 hover:border-[var(--color-border-strong)]">
                            거래명세서 인쇄
                        </button>
                    </div>
                } />
            </DlSection>

            {/* 액션 버튼 */}
            <div className="mt-10 flex gap-2">
                <Link href="/mypage" className="flex-1">
                    <Button variant="secondary" size="lg" fullWidth>마이페이지</Button>
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
                            <Button onClick={() => setRefundOpen(false)} variant="secondary" fullWidth className="flex-1">취소</Button>
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

function Shell({ children, hideTitle }: { children: React.ReactNode; hideTitle?: boolean }) {
    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            {!hideTitle && <h1 className="text-2xl md:text-3xl font-bold mb-8 text-[var(--color-fg)]">주문 상세</h1>}
            {children}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-base md:text-lg font-semibold mb-3 pb-3 border-b border-[var(--color-fg)] text-[var(--color-fg)]">{children}</h2>;
}

function DlSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8">
            <SectionTitle>{title}</SectionTitle>
            <dl className="divide-y divide-[var(--color-border)]">
                {children}
            </dl>
        </section>
    );
}

function DlRow({ label, value, emphasized }: { label: string; value: React.ReactNode; emphasized?: boolean }) {
    return (
        <div className={`grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] gap-3 py-3 text-sm ${emphasized ? "" : ""}`}>
            <dt className="text-[var(--color-fg-muted)]">{label}</dt>
            <dd className={`text-[var(--color-fg)] ${emphasized ? "text-base" : ""}`}>{value}</dd>
        </div>
    );
}
