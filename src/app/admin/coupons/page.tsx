"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { CouponSummary } from "@/types/api";

const TYPE_LABEL: Record<string, string> = {
    SIGNUP: "가입", BIRTHDAY: "생일", REFERRAL: "추천", MANUAL: "코드등록",
};

const ic = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)]";

export default function AdminCouponsPage() {
    const [list, setList] = useState<CouponSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setList(await adminApi<CouponSummary[]>("/api/v1/admin/coupons"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">쿠폰 관리</h1>
                <button
                    onClick={() => { setCreating(s => !s); setError(null); }}
                    className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                >
                    {creating ? "취소" : "+ 새 쿠폰"}
                </button>
            </div>

            {creating && <CreateForm onDone={async () => { setCreating(false); await load(); }} setError={setError} />}
            {error && <p className="text-sm text-[var(--color-danger)] my-2">{error}</p>}

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-bg-subtle)] text-xs text-[var(--color-fg-muted)] uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-4 py-3">ID</th>
                            <th className="text-left px-4 py-3">이름</th>
                            <th className="text-left px-4 py-3">코드</th>
                            <th className="text-left px-4 py-3">유형</th>
                            <th className="text-left px-4 py-3">할인</th>
                            <th className="text-left px-4 py-3">최소주문</th>
                            <th className="text-left px-4 py-3">유효일</th>
                            <th className="text-left px-4 py-3">상태</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {loading ? (
                            <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--color-fg-subtle)]">불러오는 중...</td></tr>
                        ) : list.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--color-fg-subtle)]">등록된 쿠폰이 없습니다.</td></tr>
                        ) : list.map(c => (
                            <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                                <td className="px-4 py-3 font-mono text-[var(--color-fg-muted)]">{c.id}</td>
                                <td className="px-4 py-3 text-[var(--color-fg)]">{c.name}</td>
                                <td className="px-4 py-3 font-mono text-xs">{c.code || "—"}</td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">{TYPE_LABEL[c.type] ?? c.type}</td>
                                <td className="px-4 py-3 font-semibold text-[var(--color-accent)]">
                                    {c.discountType === "PERCENT" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}원`}
                                    {c.maxDiscount > 0 && c.discountType === "PERCENT" && (
                                        <span className="ml-1 text-[10px] text-[var(--color-fg-subtle)]">(최대 {c.maxDiscount.toLocaleString()})</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">{c.minOrderAmount.toLocaleString()}원</td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">{c.validDays}일</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs rounded-[var(--radius-sm)] px-2 py-0.5 ${
                                        c.active ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                                                 : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
                                    }`}>
                                        {c.active ? "활성" : "비활성"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="mt-4 text-xs text-[var(--color-fg-subtle)]">
                * 캠페인의 &ldquo;쿠폰 발급&rdquo; 보상은 여기서 만든 쿠폰의 ID 를 참조합니다. MANUAL 타입만 회원이 코드로 직접 등록할 수 있습니다.
            </p>
        </div>
    );
}

function CreateForm({ onDone, setError }: { onDone: () => void; setError: (s: string | null) => void }) {
    const [form, setForm] = useState({
        name: "", code: "",
        type: "MANUAL" as "SIGNUP" | "BIRTHDAY" | "REFERRAL" | "MANUAL",
        discountType: "AMOUNT" as "AMOUNT" | "PERCENT",
        discountValue: 3000,
        minOrderAmount: 0,
        maxDiscount: 0,
        validDays: 30,
        active: true,
    });
    const [submitting, setSubmitting] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await adminApi("/api/v1/admin/coupons", {
                method: "POST",
                body: JSON.stringify({
                    code: form.code.trim() || null,
                    name: form.name,
                    type: form.type,
                    discountType: form.discountType,
                    discountValue: form.discountValue,
                    minOrderAmount: form.minOrderAmount,
                    maxDiscount: form.maxDiscount,
                    validDays: form.validDays,
                    active: form.active,
                }),
            });
            onDone();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "생성 실패");
        } finally {
            setSubmitting(false);
        }
    }

    function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm(s => ({ ...s, [k]: v }));
    }

    return (
        <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">이름 *</span>
                    <input className={ic} required value={form.name} onChange={e => up("name", e.target.value)} placeholder="예: 추천 감사 쿠폰 3천원" />
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">코드 (선택 — 회원 코드등록용)</span>
                    <input className={ic} value={form.code} onChange={e => up("code", e.target.value)} placeholder="예: WELCOME-REF" />
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">유형 *</span>
                    <select className={ic} value={form.type} onChange={e => up("type", e.target.value as typeof form.type)}>
                        <option value="MANUAL">MANUAL (코드등록/캠페인 발급)</option>
                        <option value="SIGNUP">SIGNUP (가입 자동발급)</option>
                        <option value="BIRTHDAY">BIRTHDAY (생일 자동발급)</option>
                        <option value="REFERRAL">REFERRAL (추천 자동발급)</option>
                    </select>
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">할인 방식 *</span>
                    <select className={ic} value={form.discountType} onChange={e => up("discountType", e.target.value as typeof form.discountType)}>
                        <option value="AMOUNT">정액 (원)</option>
                        <option value="PERCENT">정률 (%)</option>
                    </select>
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">할인 값 *</span>
                    <input type="number" min={0} className={ic} required value={form.discountValue} onChange={e => up("discountValue", parseInt(e.target.value, 10) || 0)} />
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">최소 주문금액</span>
                    <input type="number" min={0} className={ic} value={form.minOrderAmount} onChange={e => up("minOrderAmount", parseInt(e.target.value, 10) || 0)} />
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">최대 할인 (정률 상한, 0=무제한)</span>
                    <input type="number" min={0} className={ic} value={form.maxDiscount} onChange={e => up("maxDiscount", parseInt(e.target.value, 10) || 0)} />
                </label>
                <label className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">유효일 (발급 후 N일) *</span>
                    <input type="number" min={1} className={ic} required value={form.validDays} onChange={e => up("validDays", parseInt(e.target.value, 10) || 1)} />
                </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={e => up("active", e.target.checked)} />
                <span>활성화</span>
            </label>
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
