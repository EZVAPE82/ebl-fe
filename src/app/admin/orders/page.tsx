"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/admin";
import { formatDate, formatPrice } from "@/lib/format";
import type { Page } from "@/types/api";

const STATUS_OPTIONS = ["", "PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPING", "DELIVERED", "CANCELED", "REFUNDED"];

type Order = {
    id: number; orderNo: string; status: string;
    paidAmount: number; orderedAt: string;
    items: { id: number; productName: string }[];
};

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={<p className="text-zinc-500">불러오는 중...</p>}>
            <OrdersInner />
        </Suspense>
    );
}

function OrdersInner() {
    const sp = useSearchParams();
    const initialStatus = sp.get("status") ?? "";
    const [status, setStatus] = useState(initialStatus);
    const [list, setList] = useState<Page<Order> | null>(null);
    const [page, setPage] = useState(0);

    const load = useCallback(async (pg = 0, st = status) => {
        const qs = new URLSearchParams({ page: String(pg), size: "20" });
        if (st) qs.set("status", st);
        const res = await adminApi<Page<Order>>(`/api/v1/admin/orders?${qs.toString()}`);
        setList(res);
        setPage(pg);
    }, [status]);

    useEffect(() => { load(0); }, [load]);

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">주문 관리</h1>
            <div className="flex flex-wrap gap-1 mb-3 text-xs">
                {STATUS_OPTIONS.map(s => (
                    <button
                        key={s || "ALL"}
                        onClick={() => { setStatus(s); load(0, s); }}
                        className={`px-3 py-1 rounded-full border ${status === s ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-300"}`}
                    >{s || "전체"}</button>
                ))}
            </div>

            <div className="overflow-x-auto bg-white rounded-md border border-zinc-200">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-zinc-600 text-left">
                        <tr>
                            <th className="px-3 py-2 w-12">ID</th>
                            <th className="px-3 py-2 w-40">주문번호</th>
                            <th className="px-3 py-2">상품</th>
                            <th className="px-3 py-2 w-24 text-right">결제액</th>
                            <th className="px-3 py-2 w-32">상태</th>
                            <th className="px-3 py-2 w-32">주문일</th>
                            <th className="px-3 py-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {list?.content.map(o => (
                            <tr key={o.id} className="border-t border-zinc-200">
                                <td className="px-3 py-2 text-zinc-500">{o.id}</td>
                                <td className="px-3 py-2 font-mono text-xs">{o.orderNo}</td>
                                <td className="px-3 py-2 truncate max-w-xs">
                                    {o.items[0]?.productName} {o.items.length > 1 && `외 ${o.items.length - 1}`}
                                </td>
                                <td className="px-3 py-2 text-right">{formatPrice(o.paidAmount)}</td>
                                <td className="px-3 py-2 text-xs">{o.status}</td>
                                <td className="px-3 py-2 text-xs text-zinc-500">{formatDate(o.orderedAt)}</td>
                                <td className="px-3 py-2 text-right">
                                    <Link href={`/admin/orders/${o.id}`} className="text-xs">상세</Link>
                                </td>
                            </tr>
                        ))}
                        {list && list.content.length === 0 && (
                            <tr><td colSpan={7} className="px-3 py-8 text-center text-zinc-500">주문이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {list && list.totalPages > 1 && (
                <div className="mt-4 flex justify-center gap-1 text-sm">
                    {Array.from({ length: list.totalPages }, (_, i) => i).map(i => (
                        <button
                            key={i}
                            onClick={() => load(i)}
                            className={`px-3 py-1 rounded border ${i === page ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300"}`}
                        >{i + 1}</button>
                    ))}
                </div>
            )}
        </div>
    );
}
