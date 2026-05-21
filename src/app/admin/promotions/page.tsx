"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";

type PromotionView = {
    id: number;
    name: string;
    type: "BOGO_SAME" | "BOGO_OTHER";
    buyQuantity: number;
    getQuantity: number;
    giftProductId: number | null;
    giftProductOptionId: number | null;
    validFrom: string;
    validTo: string;
    active: boolean;
    productIds: number[];
    createdAt: string;
};
type Page<T> = { content: T[]; totalElements: number; totalPages: number };

export default function AdminPromotionsPage() {
    const [list, setList] = useState<PromotionView[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await adminApi<Page<PromotionView>>("/api/v1/admin/promotions?size=50");
            setList(r.content);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function deactivate(id: number) {
        if (!confirm("이 프로모션을 비활성화하시겠습니까?")) return;
        try {
            await adminApi(`/api/v1/admin/promotions/${id}`, { method: "DELETE" });
            await load();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "비활성화 실패");
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">프로모션 관리</h1>
                <button
                    onClick={() => { setCreating(s => !s); setError(null); }}
                    className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                >
                    {creating ? "취소" : "+ 새 프로모션"}
                </button>
            </div>

            {creating && <CreateForm onDone={async () => { setCreating(false); await load(); }} setError={setError} />}
            {error && <p className="text-sm text-[var(--color-danger)] my-2">{error}</p>}

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-bg-subtle)] text-xs text-[var(--color-fg-muted)] uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-4 py-3">이름</th>
                            <th className="text-left px-4 py-3">N+M</th>
                            <th className="text-left px-4 py-3">유형</th>
                            <th className="text-left px-4 py-3">기간</th>
                            <th className="text-left px-4 py-3">대상</th>
                            <th className="text-left px-4 py-3">상태</th>
                            <th className="text-right px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--color-fg-subtle)]">불러오는 중...</td></tr>
                        ) : list.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--color-fg-subtle)]">등록된 프로모션이 없습니다.</td></tr>
                        ) : list.map(p => (
                            <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                                <td className="px-4 py-3 text-[var(--color-fg)]">{p.name}</td>
                                <td className="px-4 py-3 font-mono font-semibold text-[var(--color-accent)]">{p.buyQuantity}+{p.getQuantity}</td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">{p.type === "BOGO_SAME" ? "동일상품" : "별도사은품"}</td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">
                                    {p.validFrom.slice(0, 10)}<br />~ {p.validTo.slice(0, 10)}
                                </td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">
                                    {p.productIds.length}개 상품
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs rounded-[var(--radius-sm)] px-2 py-0.5 ${
                                        p.active
                                            ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                                            : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
                                    }`}>
                                        {p.active ? "활성" : "비활성"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {p.active && (
                                        <button
                                            onClick={() => deactivate(p.id)}
                                            className="text-xs rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] px-2.5 py-1 hover:bg-[var(--color-danger-bg)]"
                                        >
                                            비활성화
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="mt-4 text-xs text-[var(--color-fg-subtle)]">
                * 비활성화된 프로모션은 결제 시 적용되지 않습니다. 영구 삭제는 DB 직접 처리 (이력 보존 정책).
            </p>
        </div>
    );
}

function CreateForm({ onDone, setError }: { onDone: () => void; setError: (s: string | null) => void }) {
    const [form, setForm] = useState({
        name: "",
        type: "BOGO_SAME" as "BOGO_SAME" | "BOGO_OTHER",
        buyQuantity: 2,
        getQuantity: 1,
        giftProductId: "" as string,
        productIds: "" as string,  // "1,2,3" 형태로 입력
        validFrom: defaultDate(0),
        validTo: defaultDate(30),
    });
    const [submitting, setSubmitting] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const productIds = form.productIds.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (productIds.length === 0) { setError("적용 상품 ID 를 콤마로 구분해 입력하세요. 예: 1,2,3"); return; }
        setSubmitting(true);
        try {
            await adminApi("/api/v1/admin/promotions", {
                method: "POST",
                body: JSON.stringify({
                    name: form.name,
                    type: form.type,
                    buyQuantity: form.buyQuantity,
                    getQuantity: form.getQuantity,
                    giftProductId: form.type === "BOGO_OTHER" ? (parseInt(form.giftProductId, 10) || null) : null,
                    giftProductOptionId: null,
                    validFrom: form.validFrom + "T00:00:00",
                    validTo:   form.validTo   + "T23:59:59",
                    productIds,
                }),
            });
            onDone();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "생성 실패");
        } finally {
            setSubmitting(false);
        }
    }

    const ic = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)]";

    return (
        <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">이름 *</span>
                    <input className={ic} required value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} placeholder="예: 여름 BC5000 2+1" />
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">유형 *</span>
                    <select className={ic} value={form.type} onChange={e => setForm(s => ({ ...s, type: e.target.value as "BOGO_SAME" | "BOGO_OTHER" }))}>
                        <option value="BOGO_SAME">BOGO_SAME (동일 상품 증정)</option>
                        <option value="BOGO_OTHER">BOGO_OTHER (별도 사은품)</option>
                    </select>
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">구매 수량 (N) *</span>
                    <input type="number" min={1} className={ic} required value={form.buyQuantity} onChange={e => setForm(s => ({ ...s, buyQuantity: parseInt(e.target.value, 10) || 1 }))} />
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">증정 수량 (M) *</span>
                    <input type="number" min={1} className={ic} required value={form.getQuantity} onChange={e => setForm(s => ({ ...s, getQuantity: parseInt(e.target.value, 10) || 1 }))} />
                </label>
                <label className="block md:col-span-2">
                    <span className="text-xs text-[var(--color-fg-muted)]">적용 상품 ID (콤마 구분) *</span>
                    <input className={ic} required placeholder="1,2,3" value={form.productIds} onChange={e => setForm(s => ({ ...s, productIds: e.target.value }))} />
                </label>
                {form.type === "BOGO_OTHER" && (
                    <label className="block md:col-span-2">
                        <span className="text-xs text-[var(--color-fg-muted)]">사은품 상품 ID *</span>
                        <input className={ic} value={form.giftProductId} onChange={e => setForm(s => ({ ...s, giftProductId: e.target.value }))} placeholder="별도 사은품 상품의 ID" />
                    </label>
                )}
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">시작일 *</span>
                    <input type="date" className={ic} required value={form.validFrom} onChange={e => setForm(s => ({ ...s, validFrom: e.target.value }))} />
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">종료일 *</span>
                    <input type="date" className={ic} required value={form.validTo} onChange={e => setForm(s => ({ ...s, validTo: e.target.value }))} />
                </label>
            </div>
            <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
            >
                {submitting ? "생성 중..." : "생성"}
            </button>
        </form>
    );
}

function defaultDate(daysOffset: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
}
