"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

type Review = {
    id: number;
    productId: number;
    memberId: number;
    rating: number;
    content: string | null;
    hasPhoto: boolean;
    pointRewarded: boolean;
    createdAt: string;
};

type Page<T> = { content: T[]; totalElements: number };

export function ProductReviews({ productId }: { productId: number }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api<Page<Review>>(`/api/v1/public/products/${productId}/reviews?size=10`)
            .then(p => { setReviews(p.content); setTotal(p.totalElements); })
            .catch(() => { /* ignore */ })
            .finally(() => setLoading(false));
    }, [productId]);

    return (
        <section>
            <h2 className="text-lg font-bold mb-3">
                리뷰 {total > 0 && <span className="text-zinc-500 text-sm font-normal">({total})</span>}
            </h2>
            {loading ? (
                <p className="text-sm text-zinc-500">불러오는 중...</p>
            ) : reviews.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8 border border-dashed border-zinc-300 rounded-md">
                    아직 리뷰가 없습니다.
                </p>
            ) : (
                <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
                    {reviews.map(r => (
                        <li key={r.id} className="p-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">★ {r.rating}</span>
                                <span className="text-xs text-zinc-500">{formatDate(r.createdAt)}</span>
                            </div>
                            {r.content && <p className="mt-1 text-sm text-zinc-700 whitespace-pre-line">{r.content}</p>}
                            {r.hasPhoto && <span className="inline-block mt-1 text-[10px] text-zinc-500">📷 포토</span>}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
