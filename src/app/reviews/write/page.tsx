"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";

export default function ReviewWritePage() {
    return (
        <Suspense fallback={<Shell><p className="text-[var(--color-fg-subtle)]">불러오는 중...</p></Shell>}>
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
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (authLoading) return <Shell><p className="text-[var(--color-fg-subtle)]">로그인 확인 중...</p></Shell>;
    if (!user) {
        const redirect = encodeURIComponent(`/reviews/write?orderItemId=${orderItemId}`);
        router.replace(`/login?redirect=${redirect}`);
        return null;
    }
    if (!orderItemId) {
        return <Shell><p className="text-[var(--color-danger)]">잘못된 접근입니다.</p></Shell>;
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
                    <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">별점</div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setRating(n)}
                                className={`text-2xl transition ${n <= rating ? "text-[var(--color-warning)]" : "text-[var(--color-fg-subtle)]"}`}
                            >★</button>
                        ))}
                    </div>
                </div>

                <label className="block">
                    <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1">내용</span>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={5}
                        maxLength={2000}
                        placeholder="상품에 대한 솔직한 후기를 남겨주세요."
                        className="block w-full bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3 text-sm placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)] transition"
                    />
                </label>

                <PhotoUploader photoUrls={photoUrls} onChange={setPhotoUrls} setError={setError} />

                {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

                <Button type="submit" loading={submitting} size="lg" fullWidth>
                    리뷰 등록
                </Button>
                <p className="text-xs text-[var(--color-fg-subtle)]">
                    * 배송 완료 후 7일 이내 작성분에 한해 적립금이 지급됩니다.
                </p>
            </form>
        </Shell>
    );
}

/**
 * 사진 업로드 UI — 최대 5 장, multipart POST.
 *  - 백엔드 /api/v1/me/images/batch 가 800x800 / 300x300 thumbnail 자동 생성
 *  - 응답 thumbnailUrl 을 form 의 photoUrls 에 저장
 *  - 화면 미리보기는 thumbnailUrl 사용
 */
function PhotoUploader({
    photoUrls,
    onChange,
    setError,
}: {
    photoUrls: string[];
    onChange: (urls: string[]) => void;
    setError: (msg: string | null) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const MAX_PHOTOS = 5;

    async function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        const remaining = MAX_PHOTOS - photoUrls.length;
        if (remaining <= 0) {
            setError(`사진은 최대 ${MAX_PHOTOS} 장까지 등록 가능합니다.`);
            return;
        }
        const list = Array.from(files).slice(0, remaining);
        setError(null);
        setUploading(true);
        try {
            const fd = new FormData();
            list.forEach(f => fd.append("files", f));
            // 인증은 httpOnly 쿠키로 — credentials:'include'. (기존 localStorage 토큰은 항상 null 인 죽은 코드였음)
            const res = await fetch(`${API_BASE}/api/v1/me/images/batch`, {
                method: "POST",
                body: fd,
                credentials: "include",
            });
            if (!res.ok) throw new Error("업로드 실패: " + res.status);
            const json = await res.json() as Array<{ url: string; thumbnailUrl: string }>;
            onChange([...photoUrls, ...json.map(j => j.thumbnailUrl ?? j.url)]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "사진 업로드에 실패했습니다.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div>
            <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">
                사진 (선택, 포토 리뷰는 적립금 2배 · 최대 {MAX_PHOTOS} 장)
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {photoUrls.map((u, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt={`사진 ${i+1}`} className="w-full h-full object-cover" />
                        <button
                            type="button"
                            aria-label="삭제"
                            onClick={() => onChange(photoUrls.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                        >×</button>
                    </div>
                ))}
                {photoUrls.length < MAX_PHOTOS && (
                    <label className="aspect-square rounded-md border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-fg-muted)] flex flex-col items-center justify-center cursor-pointer text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={e => handleFiles(e.target.files)}
                            disabled={uploading}
                            className="hidden"
                        />
                        {uploading ? (
                            <span className="text-xs">업로드중...</span>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                <span className="text-[10px] mt-1">사진 추가</span>
                            </>
                        )}
                    </label>
                )}
            </div>
            <p className="mt-1 text-[10px] text-[var(--color-fg-subtle)]">
                JPG/PNG/WebP, 장당 최대 10MB. 업로드 시 800×800 정사각형 자동 변환 (메인 리스트용).
            </p>
        </div>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto max-w-md px-4 py-8">
            <h1 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--color-fg)]">리뷰 작성</h1>
            {children}
        </div>
    );
}
