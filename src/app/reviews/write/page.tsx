"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ReviewWritePage() {
    return (
        <Suspense fallback={<Shell><p className="text-zinc-500">불러오는 중...</p></Shell>}>
            <Inner />
        </Suspense>
    );
}

function Inner() {
    const sp = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const orderItemId = sp.get("orderItemId");

    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (authLoading) return <Shell><p className="text-zinc-500">로그인 확인 중...</p></Shell>;
    if (!user) {
        const redirect = encodeURIComponent(`/reviews/write?orderItemId=${orderItemId}`);
        router.replace(`/login?redirect=${redirect}`);
        return null;
    }
    if (!orderItemId) {
        return <Shell><p className="text-rose-600">잘못된 접근입니다.</p></Shell>;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const r = await api<{ id: number; productId: number; pointRewarded: boolean }>("/api/v1/reviews", {
                method: "POST", auth: true,
                body: JSON.stringify({
                    orderItemId: Number(orderItemId),
                    rating,
                    content: content || null,
                    photoUrls: photoUrls.length > 0 ? photoUrls : null,
                }),
            });
            alert(r.pointRewarded ? "리뷰가 등록되고 적립금이 지급되었습니다." : "리뷰가 등록되었습니다.");
            router.replace(`/p/${r.productId}`);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "리뷰 등록에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Shell>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <div className="text-sm text-zinc-600 mb-1">별점</div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setRating(n)}
                                className={`text-2xl ${n <= rating ? "text-amber-400" : "text-zinc-300"}`}
                            >★</button>
                        ))}
                    </div>
                </div>

                <label className="block">
                    <span className="text-sm text-zinc-600">내용</span>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={5}
                        maxLength={2000}
                        placeholder="상품에 대한 솔직한 후기를 남겨주세요."
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                </label>

                <div>
                    <div className="text-sm text-zinc-600 mb-1">사진 URL (선택, 포토 리뷰는 적립금 2배)</div>
                    <div className="flex gap-2">
                        <input
                            value={newPhotoUrl}
                            onChange={e => setNewPhotoUrl(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (newPhotoUrl.trim()) {
                                    setPhotoUrls(s => [...s, newPhotoUrl.trim()]);
                                    setNewPhotoUrl("");
                                }
                            }}
                            className="rounded-md border border-zinc-300 px-3 text-sm"
                        >추가</button>
                    </div>
                    {photoUrls.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs">
                            {photoUrls.map((u, i) => (
                                <li key={i} className="flex items-center gap-2 text-zinc-600">
                                    <span className="truncate flex-1">{u}</span>
                                    <button
                                        type="button"
                                        onClick={() => setPhotoUrls(s => s.filter((_, j) => j !== i))}
                                        className="text-rose-500"
                                    >삭제</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-md bg-zinc-900 text-white py-3 text-sm font-medium disabled:opacity-50"
                >
                    {submitting ? "등록 중..." : "리뷰 등록"}
                </button>
                <p className="text-xs text-zinc-400">
                    * 배송 완료 후 7일 이내 작성분에 한해 적립금이 지급됩니다.
                </p>
            </form>
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto max-w-md px-4 py-8">
            <h1 className="text-xl md:text-2xl font-bold mb-6">리뷰 작성</h1>
            {children}
        </div>
    );
}
