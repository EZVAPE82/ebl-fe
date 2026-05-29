"use client";

/**
 * 주문 배송내역 디테일 (Figma node 37:12585).
 *
 * 본 페이지는 standalone — 좌측 마이페이지 사이드바를 사용하지 않는다.
 * Figma 시안의 4개 섹션을 그대로 따른다:
 *   1) 주문정보  — 주문번호 / 주문일자 / 주문자 / 주문처리상태
 *   2) 결제정보  — 총 주문금액 / 총 할인금액 / 추가할인금액 / 총 결제금액 / 결제수단
 *   3) 주문상품정보 — 상품 카드 (썸네일 + 이름 + 주문번호 + 가격 + 수량 + 날짜 + 상태 pill)
 *   4) 추가정보  — 받으시는분 / 우편번호 / 주소 / 일반전화 / 휴대전화 / 추가정보(보조 버튼들)
 *
 * 각 섹션 타이틀은 검정 두꺼운 라인으로 구분된다.
 */

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
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
        kind: "PAID" | "FREE_GIFT";
        sourcePromotionId: number | null;
    }[];
};

const STATUS_LABEL: Record<string, string> = {
    PENDING_PAYMENT: "결제대기",
    PAID: "결제완료",
    PREPARING: "배송준비중",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    REFUNDED: "환불완료",
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<Shell><p className="text-sm text-[var(--color-fg-subtle)]">불러오는 중...</p></Shell>}>
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

    if (authLoading || !user) return <Shell><p className="text-sm text-[var(--color-fg-subtle)]">로그인 확인 중...</p></Shell>;
    if (error) return <Shell><p className="text-sm text-[var(--color-danger)]">{error}</p></Shell>;
    if (!order) return <Shell><p className="text-sm text-[var(--color-fg-subtle)]">불러오는 중...</p></Shell>;

    const canRefund = ["PAID", "PREPARING", "SHIPPING", "DELIVERED"].includes(order.status);

    return (
        <Shell hideTitle={justOrdered}>
            {justOrdered && (
                <div className="mb-10 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-3xl mb-4">
                        ✓
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)]">주문완료</h1>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">주문이 정상적으로 완료되었습니다.</p>
                    <div className="mt-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] py-5 px-4">
                        <p className="text-xs text-[var(--color-fg-muted)] mb-1">고객님의 주문번호는</p>
                        <p className="font-mono text-lg md:text-xl font-bold text-[var(--color-accent)]">{order.orderNo}</p>
                    </div>
                </div>
            )}

            {/* 1. 주문정보 */}
            <Section title="주문정보">
                <Dl>
                    <Row label="주문번호"     value={<span className="font-mono">{order.orderNo}</span>} />
                    <Row label="주문일자"     value={formatFullDate(order.orderedAt)} />
                    <Row label="주문자"       value={user.name} />
                    <Row
                        label="주문처리상태"
                        value={
                            <span className="inline-flex items-center gap-1.5 text-[var(--color-fg)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                                {STATUS_LABEL[order.status] ?? order.status}
                            </span>
                        }
                    />
                </Dl>
            </Section>

            {/* 2. 결제정보 */}
            <Section title="결제정보">
                <Dl>
                    <Row label="총 주문금액"   value={formatPrice(order.productAmount)} />
                    <Row label="총 할인금액"   value={order.discountAmount > 0 ? formatPrice(order.discountAmount) : "0원"} />
                    <Row label="추가할인금액" value="0" />
                    <Row label="총 결제금액"   value={<span className="font-bold">{formatPrice(order.paidAmount)}</span>} />
                    <Row label="결제수단"      value="카드결제" />
                </Dl>
            </Section>

            {/* 3. 주문상품정보 */}
            <Section title="주문상품정보">
                <ul className="divide-y divide-[var(--color-border)]">
                    {order.items.map(i => {
                        const isGift = i.kind === "FREE_GIFT";
                        return (
                            <li
                                key={i.id}
                                className={`grid grid-cols-[64px_1fr_auto] md:grid-cols-[72px_1fr_110px_60px_100px_110px] items-center gap-4 py-4 ${isGift ? "bg-[var(--color-danger)]/5 px-2 rounded" : ""}`}
                            >
                                <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded bg-[var(--color-bg-subtle)] flex items-center justify-center">
                                    <div className="w-9 h-11 bg-[var(--color-fg-subtle)]/30 rounded-sm" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        {isGift && (
                                            <span className="inline-flex items-center rounded bg-[var(--color-danger)]/10 text-[var(--color-danger)] px-1.5 py-0.5 text-[10px] font-bold flex-shrink-0">
                                                증정
                                            </span>
                                        )}
                                        <Link href={`/p/${i.productId}`} className="text-sm font-medium hover:underline line-clamp-1 text-[var(--color-fg)]">
                                            {i.productName}
                                        </Link>
                                    </div>
                                    <p className="text-xs text-[var(--color-fg-muted)] mt-1 font-mono">#{order.orderNo}</p>
                                    {i.optionText && <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">{i.optionText}</p>}
                                    <p className="md:hidden text-xs text-[var(--color-fg-muted)] mt-1">
                                        <span className={`font-semibold ${isGift ? "text-[var(--color-danger)]" : "text-[var(--color-fg)]"}`}>
                                            {isGift ? "무료" : formatPrice(i.subtotal)}
                                        </span>
                                        <span className="mx-1.5">·</span>{i.quantity}개
                                        <span className="mx-1.5">·</span>{formatShortDate(order.orderedAt)}
                                    </p>
                                </div>
                                <div className={`hidden md:block text-sm font-medium text-center ${isGift ? "text-[var(--color-danger)]" : "text-[var(--color-fg)]"}`}>
                                    {isGift ? "무료" : formatPrice(i.subtotal)}
                                </div>
                                <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">{i.quantity}개</div>
                                <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">{formatShortDate(order.orderedAt)}</div>
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-medium px-3 py-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                                        {STATUS_LABEL[order.status] ?? order.status}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </Section>

            {/* 4. 추가정보 */}
            <Section title="추가정보">
                <Dl>
                    <Row label="받으시는분" value={order.recipientName} />
                    <Row label="우편번호"   value={order.postalCode} />
                    <Row label="주소"       value={`${order.address1}${order.address2 ? " " + order.address2 : ""}`} />
                    <Row label="일반전화"   value="-" />
                    <Row label="휴대전화"   value={order.recipientPhoneMasked} />
                    {order.memo && <Row label="배송 메모" value={order.memo} />}
                    <Row
                        label="추가정보"
                        value={
                            <div className="flex gap-2">
                                <button className="rounded border border-[var(--color-border)] text-xs text-[var(--color-fg)] px-3 py-1.5 hover:bg-[var(--color-bg-subtle)]">
                                    현금영수증 신청
                                </button>
                                <button className="rounded border border-[var(--color-border)] text-xs text-[var(--color-fg)] px-3 py-1.5 hover:bg-[var(--color-bg-subtle)]">
                                    거래명세서 인쇄
                                </button>
                            </div>
                        }
                    />
                </Dl>
            </Section>

            {/* 액션 */}
            <div className="mt-10 flex gap-2">
                <Link href="/mypage/orders" className="flex-1">
                    <Button variant="secondary" size="lg" fullWidth>주문 내역으로</Button>
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
                            className="block w-full bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] rounded px-4 py-3 text-sm placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)] transition"
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

/* ============================================================
 * 레이아웃 / 보조 컴포넌트
 * ============================================================ */
function Shell({ children, hideTitle }: { children: React.ReactNode; hideTitle?: boolean }) {
    return (
        <div className="mx-auto max-w-3xl px-4 md:px-8 py-10">
            {!hideTitle && (
                <h1 className="text-xl md:text-2xl font-bold mb-8 text-[var(--color-fg)]">주문 상세</h1>
            )}
            {children}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-10">
            <h2 className="text-base md:text-lg font-semibold pb-3 mb-1 border-b-2 border-[var(--color-fg)] text-[var(--color-fg)]">
                {title}
            </h2>
            {children}
        </section>
    );
}

function Dl({ children }: { children: React.ReactNode }) {
    return <dl className="divide-y divide-[var(--color-border)]">{children}</dl>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[110px_1fr] md:grid-cols-[140px_1fr] gap-3 py-3 text-sm">
            <dt className="text-[var(--color-fg-muted)]">{label}</dt>
            <dd className="text-[var(--color-fg)]">{value}</dd>
        </div>
    );
}

/* ============================================================
 * 유틸
 * ============================================================ */
function formatFullDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function formatShortDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = String(d.getFullYear()).slice(2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
}
