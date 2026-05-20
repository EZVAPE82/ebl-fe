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
            <h2 className="text-lg font-semibold mb-3 text-[var(--color-fg)]">
                리뷰 {total > 0 && <span className="text-[var(--color-fg-muted)] text-sm font-normal">({total})</span>}
            </h2>
            {loading ? (
                <p className="text-sm text-[var(--color-fg-subtle)]">불러오는 중...</p>
            ) : reviews.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-8 border border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-lg)]">
                    아직 리뷰가 없습니다.
                </p>
            ) : (
                <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                    {reviews.map(r => (
                        <li key={r.id} className="p-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-[var(--color-fg)]">★ {r.rating}</span>
                                <span className="text-xs text-[var(--color-fg-muted)]">{formatDate(r.createdAt)}</span>
                            </div>
                            {r.content && <p className="mt-1 text-sm text-[var(--color-fg)] whitespace-pre-line">{r.content}</p>}
                            {r.hasPhoto && <span className="inline-block mt-1 text-[11px] text-[var(--color-fg-muted)]">📷 포토</span>}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
