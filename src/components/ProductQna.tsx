"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Badge, Button, Checkbox } from "@/components/ui";

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
                <p className="text-sm text-[var(--color-fg-muted)]">
                    총 <span className="text-[var(--color-fg)] font-semibold">{total}</span>건의 문의
                </p>
                {user ? (
                    <Button
                        size="sm"
                        variant={showForm ? "secondary" : "primary"}
                        onClick={() => setShowForm(s => !s)}
                    >
                        {showForm ? "취소" : "문의 작성"}
                    </Button>
                ) : (
                    <Link
                        href={`/login?redirect=/p/${productId}`}
                        className="text-xs rounded-[var(--radius-sm)] border border-[var(--color-fg)] text-[var(--color-fg)] px-3 py-1.5 hover:bg-[var(--color-fg)] hover:text-[var(--color-fg-inverse)] transition"
                    >
                        로그인 후 문의 작성
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
                <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-4 py-10 text-center text-sm text-[var(--color-fg-subtle)]">
                    불러오는 중...
                </p>
            ) : list.length === 0 ? (
                <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-4 py-10 text-center text-sm text-[var(--color-fg-subtle)]">
                    아직 문의가 없습니다. 상품에 대해 궁금한 점을 남겨주세요.
                </p>
            ) : (
                <ul className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden">
                    {list.map(q => (
                        <li key={q.id}>
                            <details className="group">
                                <summary className="cursor-pointer list-none px-4 py-3.5 flex items-start gap-3 hover:bg-[var(--color-bg-subtle)]">
                                    <span className="text-[var(--color-accent)] font-bold flex-shrink-0">Q.</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--color-fg)] line-clamp-2">{q.question}</p>
                                        <p className="text-[11px] text-[var(--color-fg-muted)] mt-1 flex items-center gap-2">
                                            <span>{formatDate(q.createdAt)}</span>
                                            {q.isPrivate && <Badge size="sm" tone="neutral">비공개</Badge>}
                                            {q.answer ? (
                                                <Badge size="sm" tone="success">답변완료</Badge>
                                            ) : (
                                                <Badge size="sm" tone="warning">미답변</Badge>
                                            )}
                                        </p>
                                    </div>
                                    <span className="text-[var(--color-fg-subtle)] text-sm group-open:rotate-180 transition flex-shrink-0 mt-0.5">⌃</span>
                                </summary>
                                {q.answer && (
                                    <div className="px-4 py-3.5 bg-[var(--color-bg-subtle)] flex items-start gap-3 border-l-2 border-[var(--color-accent)]">
                                        <span className="text-[var(--color-fg-muted)] font-bold flex-shrink-0">A.</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[var(--color-fg)] whitespace-pre-line">{q.answer}</p>
                                            {q.answeredAt && (
                                                <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">
                                                    엘프바 운영자 · {formatDate(q.answeredAt)}
                                                </p>
                                            )}
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
