"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type {
    CampaignView, CampaignCatalog, CatalogField, CatalogReward,
    CouponSummary, CampaignCondition, CampaignReward,
} from "@/types/api";

const ic = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)]";

export default function AdminCampaignsPage() {
    const [catalog, setCatalog] = useState<CampaignCatalog | null>(null);
    const [coupons, setCoupons] = useState<CouponSummary[]>([]);
    const [list, setList] = useState<CampaignView[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<CampaignView | "new" | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [cat, cps, cmps] = await Promise.all([
                adminApi<CampaignCatalog>("/api/v1/admin/campaigns/catalog"),
                adminApi<CouponSummary[]>("/api/v1/admin/coupons"),
                adminApi<CampaignView[]>("/api/v1/admin/campaigns"),
            ]);
            setCatalog(cat); setCoupons(cps); setList(cmps);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function toggleActive(c: CampaignView) {
        try {
            await adminApi(`/api/v1/admin/campaigns/${c.id}/active`, {
                method: "PATCH", body: JSON.stringify({ active: !c.active }),
            });
            await load();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "변경 실패");
        }
    }
    async function remove(c: CampaignView) {
        if (!confirm(`'${c.name}' 캠페인을 삭제하시겠습니까? (지급 이력은 보존)`)) return;
        try {
            await adminApi(`/api/v1/admin/campaigns/${c.id}`, { method: "DELETE" });
            await load();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "삭제 실패");
        }
    }

    const triggerLabel = (k: string) => catalog?.triggers.find(t => t.key === k)?.label ?? k;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold">캠페인 (적립금·쿠폰 룰)</h1>
                    <p className="text-xs text-[var(--color-fg-subtle)] mt-1">
                        트리거 + 조건 + 보상을 조합해 적립금/쿠폰 캠페인을 만듭니다. 보상은 회원당/전체 한도로 보호됩니다.
                    </p>
                </div>
                <button
                    onClick={() => setEditing("new")}
                    className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                >
                    + 새 캠페인
                </button>
            </div>

            {editing && catalog && (
                <CampaignForm
                    catalog={catalog}
                    coupons={coupons}
                    initial={editing === "new" ? null : editing}
                    onClose={() => setEditing(null)}
                    onSaved={async () => { setEditing(null); await load(); }}
                />
            )}

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-bg-subtle)] text-xs text-[var(--color-fg-muted)] uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-4 py-3">이름</th>
                            <th className="text-left px-4 py-3">트리거</th>
                            <th className="text-left px-4 py-3">조건</th>
                            <th className="text-left px-4 py-3">보상</th>
                            <th className="text-left px-4 py-3">한도</th>
                            <th className="text-left px-4 py-3">지급</th>
                            <th className="text-left px-4 py-3">상태</th>
                            <th className="text-right px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {loading ? (
                            <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--color-fg-subtle)]">불러오는 중...</td></tr>
                        ) : list.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--color-fg-subtle)]">등록된 캠페인이 없습니다.</td></tr>
                        ) : list.map(c => (
                            <tr key={c.id} className={c.active ? "" : "opacity-60"}>
                                <td className="px-4 py-3 text-[var(--color-fg)] font-medium">{c.name}</td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">{triggerLabel(c.trigger)}</td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">{c.conditions.length}개</td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">{rewardsSummary(c.rewards)}</td>
                                <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">
                                    {c.perMemberLimit ? `1인 ${c.perMemberLimit}` : "1인 무제한"}
                                    {c.totalLimit ? ` / 전체 ${c.totalLimit}` : ""}
                                </td>
                                <td className="px-4 py-3 text-xs font-mono text-[var(--color-accent)]">{c.grantCount}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs rounded-[var(--radius-sm)] px-2 py-0.5 ${
                                        c.active ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                                                 : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
                                    }`}>{c.active ? "활성" : "비활성"}</span>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <button onClick={() => setEditing(c)} className="text-xs text-[var(--color-accent)] hover:underline mr-3">편집</button>
                                    <button onClick={() => toggleActive(c)} className="text-xs text-[var(--color-fg-muted)] hover:underline mr-3">{c.active ? "끄기" : "켜기"}</button>
                                    <button onClick={() => remove(c)} className="text-xs text-[var(--color-danger)] hover:underline">삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function rewardsSummary(rewards: CampaignReward[]): string {
    if (!rewards || rewards.length === 0) return "—";
    return rewards.map(r => {
        const tgt = r.target === "REFERRER" ? "추천인" : "본인";
        if (r.type === "POINT_FIXED") return `${tgt} ${r.amount?.toLocaleString()}P`;
        if (r.type === "POINT_RATE") return `${tgt} ${Math.round((r.rate ?? 0) * 100)}%`;
        if (r.type === "COUPON_ISSUE") return `${tgt} 쿠폰#${r.couponId}`;
        return r.type;
    }).join(", ");
}

// ── 행 폼 상태 ────────────────────────────────────────────────
type CondRow = { field: string; op: string; raw: string };
type RewardRow = { type: string; target: string; amount: string; rate: string; base: string; cap: string; couponId: string };

function CampaignForm({
    catalog, coupons, initial, onClose, onSaved,
}: {
    catalog: CampaignCatalog;
    coupons: CouponSummary[];
    initial: CampaignView | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [trigger, setTrigger] = useState<string>(initial?.trigger ?? catalog.triggers[0]?.key ?? "ORDER_PAID");
    const [conds, setConds] = useState<CondRow[]>(
        initial ? initial.conditions.map(c => ({ field: c.field, op: c.op, raw: valueToRaw(c.value) })) : []
    );
    const [rewards, setRewards] = useState<RewardRow[]>(
        initial ? initial.rewards.map(rewardToRow) : [{ type: "POINT_FIXED", target: "SELF", amount: "1000", rate: "", base: "productAmount", cap: "", couponId: "" }]
    );
    const [priority, setPriority] = useState(String(initial?.priority ?? 0));
    const [stackable, setStackable] = useState(initial?.stackable ?? true);
    const [active, setActive] = useState(initial?.active ?? false);
    const [validFrom, setValidFrom] = useState(toLocalInput(initial?.validFrom));
    const [validTo, setValidTo] = useState(toLocalInput(initial?.validTo));
    const [perMemberLimit, setPerMemberLimit] = useState(initial?.perMemberLimit != null ? String(initial.perMemberLimit) : "");
    const [totalLimit, setTotalLimit] = useState(initial?.totalLimit != null ? String(initial.totalLimit) : "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fields = useMemo(() => catalog.fields.filter(f => f.triggers.includes(trigger)), [catalog, trigger]);
    const rewardMetas = useMemo(() => catalog.rewards.filter(r => r.triggers.includes(trigger)), [catalog, trigger]);
    const opLabel = (op: string) => catalog.operators.find(o => o.op === op)?.label ?? op;

    function changeTrigger(t: string) {
        setTrigger(t);
        setConds([]);  // 트리거 바뀌면 조건/보상 초기화(필드 호환성)
        setRewards([{ type: catalog.rewards.find(r => r.triggers.includes(t))?.type ?? "POINT_FIXED", target: "SELF", amount: "1000", rate: "", base: "productAmount", cap: "", couponId: "" }]);
    }

    // 조건 행
    function addCond() {
        const f = fields[0];
        if (!f) return;
        setConds(s => [...s, { field: f.field, op: f.ops[0], raw: "" }]);
    }
    function updCond(i: number, patch: Partial<CondRow>) {
        setConds(s => s.map((c, idx) => idx === i ? { ...c, ...patch } : c));
    }
    function rmCond(i: number) { setConds(s => s.filter((_, idx) => idx !== i)); }

    // 보상 행
    function addReward() {
        const r = rewardMetas[0];
        setRewards(s => [...s, { type: r?.type ?? "POINT_FIXED", target: "SELF", amount: "1000", rate: "", base: "productAmount", cap: "", couponId: "" }]);
    }
    function updReward(i: number, patch: Partial<RewardRow>) {
        setRewards(s => s.map((r, idx) => idx === i ? { ...r, ...patch } : r));
    }
    function rmReward(i: number) { setRewards(s => s.filter((_, idx) => idx !== i)); }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (rewards.length === 0) { setError("보상을 1개 이상 추가하세요."); return; }
        const body = {
            name, description: description || null, trigger,
            conditions: conds.map(c => buildCondition(c, fields)),
            rewards: rewards.map(buildReward),
            priority: parseInt(priority, 10) || 0,
            stackable, active,
            validFrom: validFrom ? validFrom + ":00" : null,
            validTo: validTo ? validTo + ":00" : null,
            perMemberLimit: perMemberLimit ? parseInt(perMemberLimit, 10) : null,
            totalLimit: totalLimit ? parseInt(totalLimit, 10) : null,
        };
        setSubmitting(true);
        try {
            if (initial) {
                await adminApi(`/api/v1/admin/campaigns/${initial.id}`, { method: "PUT", body: JSON.stringify(body) });
            } else {
                await adminApi("/api/v1/admin/campaigns", { method: "POST", body: JSON.stringify(body) });
            }
            onSaved();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "저장 실패");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-5 space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">{initial ? "캠페인 편집" : "새 캠페인"}</h2>
                <button type="button" onClick={onClose} className="text-sm text-[var(--color-fg-muted)] hover:underline">닫기</button>
            </div>

            {/* 기본 */}
            <Section title="기본">
                <Grid2>
                    <F label="이름 *"><input className={ic} required value={name} onChange={e => setName(e.target.value)} placeholder="예: 첫구매 10% 적립" /></F>
                    <F label="트리거 *">
                        <select className={ic} value={trigger} onChange={e => changeTrigger(e.target.value)}>
                            {catalog.triggers.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                    </F>
                </Grid2>
                <F label="설명"><input className={ic} value={description} onChange={e => setDescription(e.target.value)} placeholder="관리용 메모" /></F>
            </Section>

            {/* 조건 */}
            <Section title="조건 (모두 충족 시 지급 · AND)" right={<button type="button" onClick={addCond} className="text-xs text-[var(--color-accent)] hover:underline">+ 조건 추가</button>}>
                {conds.length === 0 ? (
                    <p className="text-xs text-[var(--color-fg-subtle)]">조건 없음 — 트리거 발생 시 항상 지급.</p>
                ) : (
                    <div className="space-y-2">
                        {conds.map((c, i) => {
                            const fm = fields.find(f => f.field === c.field);
                            return (
                                <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                                    <select className={`${ic} col-span-4`} value={c.field}
                                        onChange={e => { const nf = fields.find(f => f.field === e.target.value)!; updCond(i, { field: nf.field, op: nf.ops[0], raw: "" }); }}>
                                        {fields.map(f => <option key={f.field} value={f.field}>{f.label}</option>)}
                                    </select>
                                    <select className={`${ic} col-span-3`} value={c.op} onChange={e => updCond(i, { op: e.target.value, raw: "" })}>
                                        {(fm?.ops ?? []).map(op => <option key={op} value={op}>{opLabel(op)}</option>)}
                                    </select>
                                    <div className="col-span-4">
                                        {fm && <CondValue field={fm} op={c.op} raw={c.raw} onChange={v => updCond(i, { raw: v })} />}
                                    </div>
                                    <button type="button" onClick={() => rmCond(i)} className="col-span-1 text-xs text-[var(--color-danger)] hover:underline">삭제</button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Section>

            {/* 보상 */}
            <Section title="보상" right={<button type="button" onClick={addReward} className="text-xs text-[var(--color-accent)] hover:underline">+ 보상 추가</button>}>
                <div className="space-y-2">
                    {rewards.map((r, i) => {
                        const rm = rewardMetas.find(m => m.type === r.type);
                        return (
                            <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                                <select className={`${ic} col-span-3`} value={r.type} onChange={e => updReward(i, { type: e.target.value })}>
                                    {rewardMetas.map(m => <option key={m.type} value={m.type}>{m.label}</option>)}
                                </select>
                                <select className={`${ic} col-span-2`} value={r.target} onChange={e => updReward(i, { target: e.target.value })}>
                                    <option value="SELF">본인</option>
                                    <option value="REFERRER">추천인</option>
                                </select>
                                <div className="col-span-6">
                                    <RewardParams reward={rm} row={r} coupons={coupons} onChange={patch => updReward(i, patch)} />
                                </div>
                                <button type="button" onClick={() => rmReward(i)} className="col-span-1 text-xs text-[var(--color-danger)] hover:underline">삭제</button>
                            </div>
                        );
                    })}
                </div>
                <p className="mt-2 text-[11px] text-[var(--color-fg-subtle)]">
                    * &ldquo;추천인&rdquo; 대상은 회원의 추천인에게 지급됩니다(추천 가입자만). 본인+추천인 양쪽 지급은 보상 2줄로 구성하세요.
                </p>
            </Section>

            {/* 옵션·한도 */}
            <Section title="우선순위 · 기간 · 한도">
                <Grid2>
                    <F label="우선순위 (높을수록 먼저)"><input type="number" className={ic} value={priority} onChange={e => setPriority(e.target.value)} /></F>
                    <F label="중첩(stackable)">
                        <label className="flex items-center gap-2 text-sm h-[34px]">
                            <input type="checkbox" checked={stackable} onChange={e => setStackable(e.target.checked)} />
                            <span className="text-[var(--color-fg-muted)]">{stackable ? "다른 캠페인과 함께 적용" : "매칭 시 이후 캠페인 중단(배타)"}</span>
                        </label>
                    </F>
                    <F label="시작일시 (선택)"><input type="datetime-local" className={ic} value={validFrom} onChange={e => setValidFrom(e.target.value)} /></F>
                    <F label="종료일시 (선택)"><input type="datetime-local" className={ic} value={validTo} onChange={e => setValidTo(e.target.value)} /></F>
                    <F label="회원당 한도 (비우면 무제한)"><input type="number" min={1} className={ic} value={perMemberLimit} onChange={e => setPerMemberLimit(e.target.value)} placeholder="예: 1" /></F>
                    <F label="전체 한도 (예산 cap, 비우면 무제한)"><input type="number" min={1} className={ic} value={totalLimit} onChange={e => setTotalLimit(e.target.value)} placeholder="예: 1000" /></F>
                </Grid2>
            </Section>

            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                    <span>활성화 (켜면 즉시 적용)</span>
                </label>
            </div>

            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

            <div className="flex gap-2">
                <button type="submit" disabled={submitting}
                    className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-brand-hover)] disabled:opacity-50">
                    {submitting ? "저장 중..." : initial ? "수정 저장" : "생성"}
                </button>
                <button type="button" onClick={onClose} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-5 py-2.5 text-sm hover:bg-[var(--color-bg-subtle)]">취소</button>
            </div>
        </form>
    );
}

function CondValue({ field, op, raw, onChange }: { field: CatalogField; op: string; raw: string; onChange: (v: string) => void }) {
    if (op === "isTrue" || op === "isFalse") {
        return <span className="text-xs text-[var(--color-fg-subtle)] block py-1.5">값 불필요</span>;
    }
    const listOp = op === "in" || op === "includesAny";
    if (listOp) {
        const hint = field.options.length ? `예: ${field.options.slice(0, 2).map(o => o.value).join(",")}` : "쉼표로 구분";
        return <input className={ic} value={raw} onChange={e => onChange(e.target.value)} placeholder={hint} />;
    }
    if (field.options.length > 0) {
        return (
            <select className={ic} value={raw} onChange={e => onChange(e.target.value)}>
                <option value="">선택</option>
                {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        );
    }
    return <input type={field.valueType === "NUMBER" ? "number" : "text"} className={ic} value={raw} onChange={e => onChange(e.target.value)} placeholder="값" />;
}

function RewardParams({ reward, row, coupons, onChange }: {
    reward: CatalogReward | undefined; row: RewardRow; coupons: CouponSummary[]; onChange: (patch: Partial<RewardRow>) => void;
}) {
    if (!reward) return null;
    return (
        <div className="grid grid-cols-2 gap-1.5">
            {reward.params.map(p => {
                if (p.key === "couponId") {
                    return (
                        <select key={p.key} className={ic} value={row.couponId} onChange={e => onChange({ couponId: e.target.value })}>
                            <option value="">쿠폰 선택</option>
                            {coupons.map(c => <option key={c.id} value={c.id}>#{c.id} {c.name}</option>)}
                        </select>
                    );
                }
                if (p.options.length > 0) {
                    const val = (row as Record<string, string>)[p.key] ?? "";
                    return (
                        <select key={p.key} className={ic} value={val} onChange={e => onChange({ [p.key]: e.target.value } as Partial<RewardRow>)}>
                            {p.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    );
                }
                const val = (row as Record<string, string>)[p.key] ?? "";
                return (
                    <input key={p.key} type="number" className={ic} value={val} placeholder={p.label}
                        onChange={e => onChange({ [p.key]: e.target.value } as Partial<RewardRow>)} title={p.label} />
                );
            })}
        </div>
    );
}

// ── 변환 ──────────────────────────────────────────────────────
function valueToRaw(value: unknown): string {
    if (value == null) return "";
    if (Array.isArray(value)) return value.join(",");
    return String(value);
}

function buildCondition(c: CondRow, fields: CatalogField[]): CampaignCondition {
    if (c.op === "isTrue" || c.op === "isFalse") return { field: c.field, op: c.op };
    const fm = fields.find(f => f.field === c.field);
    const listOp = c.op === "in" || c.op === "includesAny";
    if (listOp) {
        const parts = c.raw.split(",").map(s => s.trim()).filter(Boolean);
        const asNum = fm?.valueType === "LIST_NUMBER";
        return { field: c.field, op: c.op, value: asNum ? parts.map(Number) : parts };
    }
    const value: unknown = fm?.valueType === "NUMBER" ? Number(c.raw) : c.raw;
    return { field: c.field, op: c.op, value };
}

function buildReward(r: RewardRow): CampaignReward {
    const base = { type: r.type as CampaignReward["type"], target: r.target as "SELF" | "REFERRER" };
    if (r.type === "POINT_FIXED") return { ...base, amount: Number(r.amount) || 0 };
    if (r.type === "POINT_RATE") return { ...base, rate: Number(r.rate) || 0, base: r.base || "productAmount", cap: r.cap ? Number(r.cap) : null };
    if (r.type === "COUPON_ISSUE") return { ...base, couponId: Number(r.couponId) || 0 };
    return base;
}

function rewardToRow(r: CampaignReward): RewardRow {
    return {
        type: r.type, target: r.target ?? "SELF",
        amount: r.amount != null ? String(r.amount) : "",
        rate: r.rate != null ? String(r.rate) : "",
        base: r.base ?? "productAmount",
        cap: r.cap != null ? String(r.cap) : "",
        couponId: r.couponId != null ? String(r.couponId) : "",
    };
}

function toLocalInput(iso: string | null | undefined): string {
    if (!iso) return "";
    return iso.slice(0, 16); // "2026-06-05T00:00"
}

// ── 레이아웃 헬퍼 ─────────────────────────────────────────────
function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--color-fg)]">{title}</h3>
                {right}
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}
function Grid2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-xs text-[var(--color-fg-muted)] block mb-1">{label}</span>
            {children}
        </label>
    );
}
