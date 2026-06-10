"use client";

/**
 * 주문 배송내역 디테일 (Figma 주문배송 내역 디테일 spec).
 *
 * 레이아웃 (Figma: sidebar 260 + main 1000, gap 80)
 *  - Outer: mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20
 *           flex flex-col lg:flex-row justify-center gap-20
 *  - 좌측: MyPageSideNav (pathname 으로 "나의 주문 내역" active — /orders/[id] 에서도 그대로 노출)
 *  - 우측 (flex-1 lg:w-[1000px], flex flex-col gap-[60px]): 4개 섹션
 *      1) 주문정보   — 주문번호 / 주문일자 / 주문자 / 주문처리상태
 *      2) 결제정보   — 총 주문금액 / 총 할인금액 / 추가할인금액 / 총 결제금액 / 결제수단
 *      3) 주문상품정보 — 상품 행(썸네일 + 이름 + 주문번호 + 가격 + 수량 + 날짜 + 상태 pill)
 *      4) 추가정보   — 받으시는분 / 우편번호 / 주소 / 일반전화 / 휴대전화 / 추가정보(보조 버튼)
 *
 *  각 섹션은 검정 두꺼운 상단 라인 + 회색 하단 라인으로 구분된다.
 *
 * 데이터 보존: 주문 fetch(/api/v1/orders/{id}), 환불 신청(refund-requests),
 *   auth(useAuth + /login redirect) 그대로 유지. 레이아웃/스타일만 시안에 맞춰 재구성.
 */

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui";
import { MyPageSideNav } from "@/components/mypage/SideNav";

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
    EXCHANGED: "교환완료",
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<Shell><p className="text-[14px] text-[#767676]">불러오는 중...</p></Shell>}>
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

    if (authLoading || !user) return <Shell><p className="text-[14px] text-[#767676]">로그인 확인 중...</p></Shell>;
    if (error) return <Shell><p className="text-[14px] text-[#D62F2F]">{error}</p></Shell>;
    if (!order) return <Shell><p className="text-[14px] text-[#767676]">불러오는 중...</p></Shell>;

    const canRefund = ["PAID", "PREPARING", "SHIPPING", "DELIVERED"].includes(order.status);
    const fullAddress = `${order.address1 ?? ""}${order.address2 ? " " + order.address2 : ""}`.trim();

    return (
        <Shell>
            {justOrdered && (
                <div className="w-full rounded-[10px] bg-[#F6F7FB] py-6 px-5 flex flex-col items-center text-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-[#0072DD] text-white flex items-center justify-center text-2xl mb-1">
                        ✓
                    </div>
                    <p className="text-[18px] font-medium text-[#000000]">주문이 정상적으로 완료되었습니다.</p>
                    <p className="text-[14px] text-[#767676]">
                        주문번호 <span className="font-medium text-[#0072DD]">{order.orderNo}</span>
                    </p>
                </div>
            )}

            {/* 1. 주문정보 */}
            <Section title="주문정보">
                <Rows>
                    <Row label="주문번호" value={order.orderNo} />
                    <Row label="주문일자" value={formatFullDate(order.orderedAt)} />
                    <Row label="주문자" value={dash(user.name)} />
                    <Row
                        label="주문처리상태"
                        value={STATUS_LABEL[order.status] ?? order.status ?? "배송전"}
                    />
                </Rows>
            </Section>

            {/* 2. 결제정보 */}
            <Section title="결제정보">
                <Rows>
                    <Row label="총 주문금액" value={won(order.productAmount)} />
                    <Row label="총 할인금액" value={won(order.discountAmount)} />
                    <Row label="추가할인금액" value={won(order.pointUsed)} />
                    <Row label="총 결제금액" value={won(order.paidAmount)} />
                    <Row label="결제수단" value="카드결제" />
                </Rows>
            </Section>

            {/* 3. 주문상품정보 */}
            <Section title="주문상품정보">
                <div className="border-t border-[#222222]">
                    {order.items.map(i => {
                        const isGift = i.kind === "FREE_GIFT";
                        return (
                            <div
                                key={i.id}
                                className="py-3 border-b border-[#DDDDDD] flex flex-wrap justify-between items-center gap-3"
                            >
                                {/* LEFT: 썸네일 + 상품명/주문번호 */}
                                <div className="w-[282px] flex items-center gap-3">
                                    <div className="w-[90px] h-[108px] rounded-[4px] object-cover bg-[#F6F7FB] shrink-0 flex items-center justify-center">
                                        <div className="w-9 h-11 rounded-sm bg-[#DDDDDD]" />
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <p className="text-[16px] font-medium text-[#222222] line-clamp-2">
                                            {isGift && <span className="text-[#0072DD]">[증정] </span>}
                                            {dash(i.productName)}
                                        </p>
                                        <p className="text-[14px] text-[#767676]">#{order.orderNo}</p>
                                    </div>
                                </div>

                                {/* 가격 */}
                                <div className="w-[184px] text-center text-[14px] font-medium text-[#000000]">
                                    {isGift ? "무료" : won(i.subtotal)}
                                </div>

                                {/* 수량 */}
                                <div className="w-[184px] text-center text-[14px] text-[#767676]">
                                    {i.quantity}개
                                </div>

                                {/* 날짜 */}
                                <div className="w-[184px] text-center text-[14px] text-[#767676]">
                                    {formatShortDate(order.orderedAt)}
                                </div>

                                {/* 상태 pill */}
                                <StatusPill status={order.status} />
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* 4. 추가정보 */}
            <Section title="추가정보">
                <Rows>
                    <Row label="받으시는분" value={dash(order.recipientName)} />
                    <Row label="우편번호" value={dash(order.postalCode)} />
                    <Row label="주소" value={fullAddress || "—"} />
                    <Row label="일반전화" value="—" />
                    <Row label="휴대전화" value={dash(order.recipientPhoneMasked)} />
                    {order.memo && <Row label="배송 메모" value={order.memo} />}
                    <Row
                        label="추가정보"
                        value={
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => alert("현금영수증 신청은 고객센터로 문의해주세요.")}
                                    className="px-3 py-2 rounded-[4px] border border-[#DDDDDD] text-[14px] font-medium text-[#767676] hover:bg-[#F6F7FB] transition"
                                >
                                    현금영수증 신청
                                </button>
                                <button
                                    type="button"
                                    onClick={() => alert("거래명세서를 인쇄합니다.")}
                                    className="px-3 py-2 rounded-[4px] border border-[#DDDDDD] text-[14px] font-medium text-[#767676] hover:bg-[#F6F7FB] transition"
                                >
                                    거래명세서 인쇄
                                </button>
                            </div>
                        }
                    />
                </Rows>
            </Section>

            {/* 액션 — 주문 내역으로 / 환불 신청 (데이터/액션 보존) */}
            <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="lg" onClick={() => router.push("/mypage/orders")}>
                    주문 내역으로
                </Button>
                {canRefund && (
                    <Button
                        onClick={() => setRefundOpen(true)}
                        variant="secondary"
                        size="lg"
                        className="!border-[#D62F2F] !text-[#D62F2F] hover:!bg-[#FDECEC]"
                    >
                        환불 신청
                    </Button>
                )}
            </div>

            {refundOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[10px] p-5 space-y-3">
                        <h3 className="font-medium text-[16px] text-[#000000]">환불 신청</h3>
                        <p className="text-[13px] text-[#767676]">반송 택배비가 환불 금액에서 차감될 수 있습니다.</p>
                        <textarea
                            value={refundReason}
                            onChange={e => setRefundReason(e.target.value)}
                            placeholder="환불 사유를 입력해주세요"
                            rows={4}
                            className="block w-full bg-white text-[#000000] border border-[#DDDDDD] rounded-[4px] px-4 py-3 text-[14px] placeholder:text-[#767676] focus:outline-none focus:border-[#0072DD] transition"
                        />
                        <div className="flex gap-2">
                            <Button onClick={() => setRefundOpen(false)} variant="secondary" fullWidth className="flex-1">취소</Button>
                            <Button
                                onClick={requestRefund}
                                fullWidth
                                className="flex-1 !bg-[#D62F2F] !text-white hover:!opacity-90"
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
function Shell({ children }: { children: React.ReactNode }) {
    // Figma: sidebar 260 + main 1000, gap 80. Header/PromoStrip/Footer 는 layout 제공.
    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row justify-center gap-20">
            <MyPageSideNav />
            <main className="flex-1 lg:w-[1000px] flex flex-col gap-[60px]">{children}</main>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="w-full flex flex-col gap-5 border-b border-[#DDDDDD]">
            <div className="h-11 flex items-end">
                <h2 className="text-[24px] font-medium text-[#000000]">{title}</h2>
            </div>
            {children}
        </section>
    );
}

/** 라벨/값 행들을 감싸는 컨테이너 — 검정 상단 라인 + 패딩 */
function Rows({ children }: { children: React.ReactNode }) {
    return <div className="border-t border-[#222222] py-8 flex flex-col gap-5">{children}</div>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start">
            <span className="w-[120px] shrink-0 text-[16px] text-[#767676]">{label}</span>
            <span className="text-[16px] font-medium text-[#000000]">{value}</span>
        </div>
    );
}

/**
 * 상태 칩 — Figma 매핑:
 *  - 배송완료(DELIVERED): bg #E6F3FE / text #0072DD / dot #0742AC
 *  - 취소완료(CANCELED/REFUNDED/EXCHANGED): bg #222222 / text white / dot white
 *  - 그 외 진행상태: bg #F6F7FB / text #767676 / dot #767676
 */
function StatusPill({ status }: { status: string }) {
    const label = STATUS_LABEL[status] ?? status;

    let pillClass: string;
    let dotClass: string;
    if (status === "DELIVERED") {
        pillClass = "bg-[#E6F3FE] text-[#0072DD]";
        dotClass = "bg-[#0742AC]";
    } else if (["CANCELED", "REFUNDED", "EXCHANGED"].includes(status)) {
        pillClass = "bg-[#222222] text-white";
        dotClass = "bg-white";
    } else {
        pillClass = "bg-[#F6F7FB] text-[#767676]";
        dotClass = "bg-[#767676]";
    }

    return (
        <span className={`px-[18px] py-2.5 rounded-full text-[14px] font-medium flex items-center gap-1 ${pillClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {label}
        </span>
    );
}

/* ============================================================
 * 유틸
 * ============================================================ */
/** 숫자를 "12,000원" 형태로. null/undefined 는 "—". */
function won(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return "—";
    return formatPrice(n);
}

/** 빈 값 → "—" 폴백 */
function dash(v: string | null | undefined): string {
    return v != null && String(v).trim() !== "" ? String(v) : "—";
}

function formatFullDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso || "—";
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
    if (Number.isNaN(d.getTime())) return iso || "—";
    const y = String(d.getFullYear()).slice(2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
}
