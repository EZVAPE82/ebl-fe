"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";

/**
 * 어드민 — 추천인 보상 설정.
 *  GET  /api/v1/admin/referral/settings — 현재 보상 로드
 *  PUT  /api/v1/admin/referral/settings — 변경 저장
 *
 * referrer (추천한 사람) ≠ referee (가입자) — 각각 다른 적립금/쿠폰 가능
 */

type Setting = {
    referrerPoint: number;
    refereePoint: number;
    referrerCouponId: number | null;
    refereeCouponId: number | null;
    active: boolean;
    updatedAt: string;
};

export default function AdminReferralPage() {
    const [s, setS] = useState<Setting | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await adminApi<Setting>("/api/v1/admin/referral/settings");
                setS(data);
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "설정을 불러올 수 없습니다.");
            }
        })();
    }, []);

    async function save() {
        if (!s) return;
        setError(null); setMsg(null); setSubmitting(true);
        try {
            const updated = await adminApi<Setting>("/api/v1/admin/referral/settings", {
                method: "PUT",
                body: JSON.stringify({
                    referrerPoint: s.referrerPoint,
                    refereePoint: s.refereePoint,
                    referrerCouponId: s.referrerCouponId,
                    refereeCouponId: s.refereeCouponId,
                    active: s.active,
                }),
            });
            setS(updated);
            setMsg("저장되었습니다.");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "저장 실패");
        } finally {
            setSubmitting(false);
        }
    }

    function up<K extends keyof Setting>(k: K, v: Setting[K]) {
        setS(prev => prev ? { ...prev, [k]: v } : prev);
    }

    if (error && !s) return <p className="text-[var(--color-danger)] text-sm">{error}</p>;
    if (!s) return <p className="text-[var(--color-fg-muted)]">불러오는 중...</p>;

    const ic = "w-full bg-white border border-[var(--color-border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-fg-muted)]";

    return (
        <div>
            <h1 className="text-xl font-bold mb-2">추천인 보상 설정</h1>
            <p className="text-xs text-[var(--color-fg-muted)] mb-6">
                회원가입 시 추천 코드 입력 → <strong>추천한 사람(referrer)</strong>과 <strong>가입자(referee)</strong> 양쪽에 보상이 자동 지급됩니다.
                각각 다른 적립금/쿠폰 설정 가능.
            </p>

            <form onSubmit={e => { e.preventDefault(); save(); }} className="max-w-2xl space-y-6">
                {/* 활성 토글 */}
                <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={s.active}
                        onChange={e => up("active", e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">추천인 보상 활성화</span>
                    <span className="text-xs text-[var(--color-fg-muted)]">
                        (비활성화 시 코드 입력해도 보상 지급 안 함)
                    </span>
                </label>

                <Section title="추천한 사람 (referrer) 보상">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="적립금 (원)">
                            <input
                                type="number" min={0}
                                value={s.referrerPoint}
                                onChange={e => up("referrerPoint", Math.max(0, Number(e.target.value) || 0))}
                                className={ic}
                            />
                        </Field>
                        <Field label="쿠폰 ID (선택)">
                            <input
                                type="number"
                                value={s.referrerCouponId ?? ""}
                                onChange={e => up("referrerCouponId", e.target.value ? Number(e.target.value) : null)}
                                className={ic}
                                placeholder="비우면 쿠폰 미지급"
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="가입자 (referee) 보상">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="적립금 (원)">
                            <input
                                type="number" min={0}
                                value={s.refereePoint}
                                onChange={e => up("refereePoint", Math.max(0, Number(e.target.value) || 0))}
                                className={ic}
                            />
                        </Field>
                        <Field label="쿠폰 ID (선택)">
                            <input
                                type="number"
                                value={s.refereeCouponId ?? ""}
                                onChange={e => up("refereeCouponId", e.target.value ? Number(e.target.value) : null)}
                                className={ic}
                                placeholder="비우면 쿠폰 미지급"
                            />
                        </Field>
                    </div>
                </Section>

                <p className="text-[11px] text-[var(--color-fg-subtle)]">
                    마지막 수정: {new Date(s.updatedAt).toLocaleString("ko-KR")}
                </p>

                {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
                {msg && <p className="text-sm text-[#10b981]">{msg}</p>}

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 rounded bg-[var(--color-fg)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {submitting ? "저장 중..." : "저장"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded bg-white border border-[var(--color-border)] p-5">
            <h2 className="text-sm font-bold mb-3 text-[var(--color-fg)]">{title}</h2>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-xs text-[var(--color-fg-muted)] mb-1.5">{label}</span>
            {children}
        </label>
    );
}
