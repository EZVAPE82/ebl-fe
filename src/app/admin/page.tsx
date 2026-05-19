"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin";

type Page<T> = { content: T[]; totalElements: number };
type Order = {
    id: number; orderNo: string; status: string; paidAmount: number; orderedAt: string;
};

const STATUS_BUCKETS: { key: string; label: string }[] = [
    { key: "PAID", label: "결제완료" },
    { key: "PREPARING", label: "준비중" },
    { key: "SHIPPING", label: "배송중" },
    { key: "DELIVERED", label: "배송완료" },
];

export default function AdminDashboard() {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [pendingForeign, setPendingForeign] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const buckets = await Promise.all(STATUS_BUCKETS.map(async b => {
                    try {
                        const p = await adminApi<Page<Order>>(`/api/v1/admin/orders?status=${b.key}&size=1`);
                        return [b.key, p.totalElements] as const;
                    } catch { return [b.key, 0] as const; }
                }));
                setCounts(Object.fromEntries(buckets));

                try {
                    const fv = await adminApi<Page<unknown>>("/api/v1/admin/adult-verifications?size=1");
                    setPendingForeign(fv.totalElements);
                } catch { /* ignore */ }
            } catch { /* ignore */ }
        })();
    }, []);

    return (
        <div>
            <h1 className="text-xl font-bold mb-5">대시보드</h1>

            <h2 className="text-sm font-semibold text-zinc-600 mb-2">주문 상태 현황</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {STATUS_BUCKETS.map(b => (
                    <Link
                        key={b.key}
                        href={`/admin/orders?status=${b.key}`}
                        className="rounded-md bg-white border border-zinc-200 p-4 hover:border-zinc-400"
                    >
                        <div className="text-xs text-zinc-500">{b.label}</div>
                        <div className="text-2xl font-bold mt-1">{counts[b.key] ?? "-"}</div>
                    </Link>
                ))}
            </div>

            <h2 className="text-sm font-semibold text-zinc-600 mb-2">처리 대기</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link
                    href="/admin/foreign-verifications"
                    className="rounded-md bg-white border border-zinc-200 p-4 hover:border-rose-400"
                >
                    <div className="text-xs text-zinc-500">외국인 승인 대기</div>
                    <div className="text-2xl font-bold mt-1 text-rose-600">{pendingForeign}</div>
                </Link>
            </div>
        </div>
    );
}
