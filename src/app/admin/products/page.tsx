"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import type { ProductSummary, Page } from "@/types/api";

export default function AdminProductsPage() {
    const [keyword, setKeyword] = useState("");
    const [list, setList] = useState<Page<ProductSummary> | null>(null);
    const [page, setPage] = useState(0);

    const load = useCallback(async (pg = 0, kw = keyword) => {
        const qs = new URLSearchParams({ page: String(pg), size: "20" });
        if (kw) qs.set("keyword", kw);
        const res = await adminApi<Page<ProductSummary>>(`/api/v1/admin/products?${qs.toString()}`);
        setList(res);
        setPage(pg);
    }, [keyword]);

    useEffect(() => { load(0, ""); }, [load]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">상품 관리</h1>
                <Link href="/admin/products/new" className="rounded-md bg-[var(--color-brand)] text-white px-3 py-1.5 text-sm">+ 신규 상품</Link>
            </div>

            <form onSubmit={e => { e.preventDefault(); load(0, keyword); }} className="mb-3 flex gap-2">
                <input
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="상품명 검색"
                    className="flex-1 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm"
                />
                <button className="rounded-md border border-[var(--color-border)] px-3 text-sm">검색</button>
            </form>

            <div className="overflow-x-auto bg-white rounded-md border border-[var(--color-border)]">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] text-left">
                        <tr>
                            <th className="px-3 py-2 w-16">ID</th>
                            <th className="px-3 py-2">상품명</th>
                            <th className="px-3 py-2 w-24 text-right">가격</th>
                            <th className="px-3 py-2 w-24">상태</th>
                            <th className="px-3 py-2 w-20 text-center">리뷰</th>
                            <th className="px-3 py-2 w-16"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {list?.content.map(p => (
                            <tr key={p.id} className="border-t border-[var(--color-border)]">
                                <td className="px-3 py-2 text-[var(--color-fg-muted)]">{p.id}</td>
                                <td className="px-3 py-2 font-medium">{p.name}</td>
                                <td className="px-3 py-2 text-right">{formatPrice(p.price)}</td>
                                <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                                <td className="px-3 py-2 text-center">{p.reviewCount}</td>
                                <td className="px-3 py-2 text-right">
                                    <Link href={`/admin/products/${p.id}`} className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">수정</Link>
                                </td>
                            </tr>
                        ))}
                        {list && list.content.length === 0 && (
                            <tr><td colSpan={6} className="px-3 py-8 text-center text-[var(--color-fg-muted)]">상품이 없습니다.</td></tr>
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
                            className={`px-3 py-1 rounded border ${i === page ? "bg-[var(--color-brand)] text-white border-[var(--color-fg)]" : "border-[var(--color-border)]"}`}
                        >{i + 1}</button>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cls = status === "ACTIVE" ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
        : status === "SOLD_OUT" ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
        : status === "DRAFT" ? "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
        : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]";
    return <span className={`inline-block rounded px-2 py-0.5 text-[10px] ${cls}`}>{status}</span>;
}
