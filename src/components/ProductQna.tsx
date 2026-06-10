"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Button, Checkbox } from "@/components/ui";

type Qna = {
    id: number;
    productId: number;
    memberId: number;
    question: string;
    answer: string | null;
    answeredAt: string | null;
    isPrivate: boolean;
    createdAt: string;
};
type Page<T> = { content: T[]; totalElements: number; totalPages: number };

export function ProductQna({ productId }: { productId: number }) {
    const { user } = useAuth();
    const [list, setList] = useState<Qna[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [question, setQuestion] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api<Page<Qna>>(`/api/v1/public/products/${productId}/qnas?size=10`);
            setList(r.content);
            setTotal(r.totalElements);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => { load(); }, [load]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!question.trim()) return;
        setError(null);
        setSubmitting(true);
        try {
            await api(`/api/v1/products/${productId}/qnas`, {
                method: "POST",
                auth: true,
                body: JSON.stringify({ question: question.trim(), isPrivate }),
            });
            setQuestion("");
            setIsPrivate(false);
            setShowForm(false);
            await load();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "문의 작성에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-[24px] font-medium text-[#222222]">Q&amp;A ({total})</p>
                {user ? (
                    <button
                        type="button"
                        onClick={() => setShowForm(s => !s)}
                        className="w-[108px] p-3 rounded-[4px] bg-[#222222] flex justify-center items-center text-white text-[14px] font-medium"
                    >
                        {showForm ? "취소" : "문의하기"}
                    </button>
                ) : (
                    <Link
                        href={`/login?redirect=/p/${productId}`}
                        className="w-[108px] p-3 rounded-[4px] bg-[#222222] flex justify-center items-center text-white text-[14px] font-medium"
                    >
                        문의하기
                    </Link>
                )}
            </div>

            {/* 작성 폼 */}
            {showForm && user && (
                <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-4 space-y-3">
                    <label className="block">
                        <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1">문의 내용 *</span>
                        <textarea
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            placeholder="상품에 대해 궁금한 점을 남겨주세요. (배송·옵션·환불 등)"
                            className="block w-full bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3 text-sm placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)] transition"
                        />
                        <div className="mt-1 text-[11px] text-[var(--color-fg-subtle)] text-right">
                            {question.length}/2000
                        </div>
                    </label>
                    <Checkbox
                        label={<span className="text-xs text-[var(--color-fg-muted)]">비공개 문의 (작성자·운영자만 열람)</span>}
                        checked={isPrivate}
                        onChange={e => setIsPrivate(e.target.checked)}
                    />
                    {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" fullWidth onClick={() => setShowForm(false)}>취소</Button>
                        <Button type="submit" fullWidth loading={submitting} disabled={!question.trim()}>등록</Button>
                    </div>
                </form>
            )}

            {/* 리스트 */}
            {loading ? (
                <p className="border-t border-[#222] px-4 py-10 text-center text-[14px] text-[#767676]">
                    불러오는 중...
                </p>
            ) : list.length === 0 ? (
                <p className="border-t border-[#222] px-4 py-10 text-center text-[14px] text-[#767676]">
                    아직 문의가 없습니다. 상품에 대해 궁금한 점을 남겨주세요.
                </p>
            ) : (
                <ul className="border-t border-[#222]">
                    {list.map(q => (
                        <li key={q.id} className="border-b border-[#E5E5EC]">
                            <details className="group">
                                <summary className="cursor-pointer list-none py-7 flex justify-between items-center">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="px-4 py-2 rounded-[4px] bg-[#F6F7FB] text-[14px] font-medium text-[#767676] whitespace-nowrap">
                                            {q.answer ? "답변완료" : "미답변"}
                                        </span>
                                        <div className="flex items-center gap-1 min-w-0">
                                            <span className="text-[16px] font-medium text-[#000] truncate">{q.question}</span>
                                            {q.isPrivate && (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" className="w-6 h-6 flex-shrink-0">
                                                    <rect x="5" y="11" width="14" height="10" rx="2" />
                                                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[14px] text-[#000]">{maskAuthor(q.memberId)}</span>
                                        <span className="w-px h-3 bg-[#E5E5EC]" />
                                        <span className="text-[14px] text-[#767676]">{formatDate(q.createdAt)}</span>
                                    </div>
                                </summary>
                                {q.answer && (
                                    <div className="pb-7 pl-[72px] pr-2">
                                        <div className="rounded-[4px] bg-[#F6F7FB] px-5 py-4 flex items-start gap-3">
                                            <span className="text-[#767676] font-bold flex-shrink-0">A.</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] text-[#222222] whitespace-pre-line">{q.answer}</p>
                                                {q.answeredAt && (
                                                    <p className="text-[12px] text-[#767676] mt-1">
                                                        엘프바 운영자 · {formatDate(q.answeredAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </details>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/**
 * 작성자 마스킹 표기.
 * 백엔드 QnaView 가 작성자명을 내려주지 않으므로(memberId 만 제공),
 * 회원 식별자를 노출 최소화하여 "회원##***" 형태로 마스킹한다.
 */
function maskAuthor(memberId: number): string {
    const s = String(memberId);
    const head = s.length <= 2 ? s : s.slice(0, 2);
    return `회원${head}***`;
}
