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
                <Link href="/admin/products/new" className="rounded-md bg-zinc-900 text-white px-3 py-1.5 text-sm">+ 신규 상품</Link>
            </div>

            <form onSubmit={e => { e.preventDefault(); load(0, keyword); }} className="mb-3 flex gap-2">
                <input
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="상품명 검색"
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                />
                <button className="rounded-md border border-zinc-300 px-3 text-sm">검색</button>
            </form>

            <div className="overflow-x-auto bg-white rounded-md border border-zinc-200">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-zinc-600 text-left">
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
                            <tr key={p.id} className="border-t border-zinc-200">
                                <td className="px-3 py-2 text-zinc-500">{p.id}</td>
                                <td className="px-3 py-2 font-medium">{p.name}</td>
                                <td className="px-3 py-2 text-right">{formatPrice(p.price)}</td>
                                <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                                <td className="px-3 py-2 text-center">{p.reviewCount}</td>
                                <td className="px-3 py-2 text-right">
                                    <Link href={`/admin/products/${p.id}`} className="text-xs text-zinc-600 hover:text-black">수정</Link>
                                </td>
                            </tr>
                        ))}
                        {list && list.content.length === 0 && (
                            <tr><td colSpan={6} className="px-3 py-8 text-center text-zinc-500">상품이 없습니다.</td></tr>
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

function StatusBadge({ status }: { status: string }) {
    const cls = status === "ACTIVE" ? "bg-emerald-100 text-emerald-700"
        : status === "SOLD_OUT" ? "bg-amber-100 text-amber-700"
        : status === "DRAFT" ? "bg-zinc-100 text-zinc-600"
        : "bg-rose-100 text-rose-700";
    return <span className={`inline-block rounded px-2 py-0.5 text-[10px] ${cls}`}>{status}</span>;
}
