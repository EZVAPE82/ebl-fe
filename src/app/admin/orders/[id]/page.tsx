"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

type OrderView = {
    id: number; orderNo: string; status: string;
    productAmount: number; shippingFee: number; discountAmount: number; pointUsed: number; paidAmount: number;
    orderedAt: string;
    recipientName: string; recipientPhoneMasked: string; postalCode: string; address1: string; address2: string | null; memo: string | null;
    items: { id: number; productName: string; optionText: string | null; unitPrice: number; quantity: number; subtotal: number; productId: number }[];
};

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order, setOrder] = useState<OrderView | null>(null);
    const [courier, setCourier] = useState("CJ");
    const [trackingNo, setTrackingNo] = useState("");

    const load = useCallback(async () => {
        const o = await adminApi<OrderView>(`/api/v1/admin/orders?status=&page=0&size=100`)
            .then(p => (p as unknown as { content: OrderView[] }).content.find(x => x.id === Number(id)) ?? null);
        // 어드민 단건 조회 API가 없는 경우 — 임시로 목록에서 찾음. 충분한 size로 우회.
        setOrder(o);
    }, [id]);

    useEffect(() => { load(); }, [load]);

    async function ship() {
        try {
            await adminApi(`/api/v1/admin/orders/${id}/ship`, {
                method: "POST", body: JSON.stringify({ courier, trackingNo }),
            });
            alert("송장이 등록되었습니다."); load();
        } catch (e) { alert(e instanceof ApiError ? e.message : "실패"); }
    }
    async function deliver() {
        try {
            await adminApi(`/api/v1/admin/orders/${id}/deliver`, { method: "POST" });
            alert("배송완료 처리되었습니다."); load();
        } catch (e) { alert(e instanceof ApiError ? e.message : "실패"); }
    }
    async function changeStatus(next: string) {
        try {
            await adminApi(`/api/v1/admin/orders/${id}/status/${next}`, { method: "POST" });
            load();
        } catch (e) { alert(e instanceof ApiError ? e.message : "실패"); }
    }

    if (!order) return <p className="text-[var(--color-fg-muted)]">불러오는 중...</p>;

    return (
        <div className="space-y-5 max-w-3xl">
            <Link href="/admin/orders" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">← 주문 목록</Link>

            <div className="bg-white rounded-md border border-[var(--color-border)] p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xs text-[var(--color-fg-muted)]">주문번호</div>
                        <div className="font-mono">{order.orderNo}</div>
                    </div>
                    <span className="text-sm rounded-full bg-[var(--color-bg-subtle)] px-3 py-1">{order.status}</span>
                </div>
                <div className="text-xs text-[var(--color-fg-muted)]">{formatDate(order.orderedAt)} 주문</div>
            </div>

            <Card title="주문 상품">
                <table className="w-full text-sm">
                    <tbody>
                        {order.items.map(i => (
                            <tr key={i.id} className="border-t border-[var(--color-border)] first:border-t-0">
                                <td className="py-2">
                                    <div className="font-medium">{i.productName}</div>
                                    {i.optionText && <div className="text-xs text-[var(--color-fg-muted)]">{i.optionText}</div>}
                                </td>
                                <td className="py-2 text-right text-xs text-[var(--color-fg-muted)]">×{i.quantity}</td>
                                <td className="py-2 text-right">{formatPrice(i.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Card title="결제 정보">
                <Row label="상품" value={formatPrice(order.productAmount)} />
                <Row label="배송비" value={order.shippingFee === 0 ? "무료" : formatPrice(order.shippingFee)} />
                {order.discountAmount > 0 && <Row label="쿠폰" value={`- ${formatPrice(order.discountAmount)}`} />}
                {order.pointUsed > 0 && <Row label="적립금" value={`- ${formatPrice(order.pointUsed)}`} />}
                <div className="border-t border-[var(--color-border)] pt-1 mt-1 flex justify-between font-bold">
                    <span>결제 금액</span><span>{formatPrice(order.paidAmount)}</span>
                </div>
            </Card>

            <Card title="배송지">
                <Row label="수령인" value={order.recipientName} />
                <Row label="연락처" value={order.recipientPhoneMasked} />
                <Row label="주소" value={`(${order.postalCode}) ${order.address1} ${order.address2 ?? ""}`} />
                {order.memo && <Row label="메모" value={order.memo} />}
            </Card>

            <Card title="액션">
                <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                        <input value={courier} onChange={e => setCourier(e.target.value)} placeholder="택배사" className="w-24 rounded border border-[var(--color-border)] px-2 py-1.5" />
                        <input value={trackingNo} onChange={e => setTrackingNo(e.target.value)} placeholder="송장번호" className="flex-1 rounded border border-[var(--color-border)] px-2 py-1.5" />
                        <button onClick={ship} className="rounded bg-[var(--color-brand)] text-white px-3 text-xs">송장 입력 + 배송 시작</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={deliver} className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs">배송완료 처리</button>
                        <button onClick={() => changeStatus("PREPARING")} className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs">→ 준비중</button>
                        <button onClick={() => changeStatus("CANCELED")} className="rounded border border-[var(--color-danger)]/30 text-[var(--color-danger)] px-3 py-1.5 text-xs">→ 취소</button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-md border border-[var(--color-border)] p-4">
            <h2 className="text-sm font-semibold mb-2">{title}</h2>
            <div className="text-sm space-y-1">{children}</div>
        </div>
    );
}
function Row({ label, value }: { label: string; value: string }) {
    return <div className="flex justify-between"><span className="text-[var(--color-fg-muted)]">{label}</span><span>{value}</span></div>;
}
