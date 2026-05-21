"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Checkbox, Input } from "@/components/ui";
import { MyPageSideNav } from "@/components/mypage/SideNav";

type AddressView = {
    id: number;
    label: string | null;
    recipientName: string;
    phoneMasked: string;
    postalCode: string;
    address1: string;
    address2: string | null;
    isDefault: boolean;
};

const empty = {
    label: "", recipientName: "", phone: "", postalCode: "",
    address1: "", address2: "", isDefault: false,
};

export default function AddressesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [list, setList] = useState<AddressView[]>([]);
    const [form, setForm] = useState({ ...empty });
    const [editingId, setEditingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        const r = await api<AddressView[]>("/api/v1/members/me/addresses", { auth: true });
        setList(r);
    }, []);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/login?redirect=/mypage/addresses");
        else if (user) load();
    }, [user, authLoading, load, router]);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingId) {
                await api(`/api/v1/members/me/addresses/${editingId}`, {
                    method: "PUT", auth: true, body: JSON.stringify(form),
                });
            } else {
                await api("/api/v1/members/me/addresses", {
                    method: "POST", auth: true, body: JSON.stringify(form),
                });
            }
            setForm({ ...empty });
            setEditingId(null);
            await load();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "저장 실패");
        }
    }

    async function remove(id: number) {
        if (!confirm("삭제하시겠습니까?")) return;
        await api(`/api/v1/members/me/addresses/${id}`, { method: "DELETE", auth: true });
        await load();
    }
    async function setDefault(id: number) {
        await api(`/api/v1/members/me/addresses/${id}/default`, { method: "POST", auth: true });
        await load();
    }

    function startEdit(a: AddressView) {
        setEditingId(a.id);
        setForm({
            label: a.label ?? "",
            recipientName: a.recipientName,
            phone: "",
            postalCode: a.postalCode,
            address1: a.address1,
            address2: a.address2 ?? "",
            isDefault: a.isDefault,
        });
    }

    if (authLoading || !user) return <div className="mx-auto max-w-screen-xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-8 grid gap-8 md:grid-cols-[220px_1fr]">
            <MyPageSideNav />

            <main className="max-w-2xl space-y-6">
                <header className="flex items-end justify-between pb-3 border-b border-[var(--color-fg)]">
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-fg)]">배송지 관리</h2>
                    <span className="text-xs text-[var(--color-accent)]">*필수입력사항</span>
                </header>
                <p className="text-xs text-[var(--color-fg-muted)]">최대 5개까지 저장할 수 있습니다.</p>

            <ul className="space-y-2">
                {list.map(a => (
                    <li key={a.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--color-fg)]">{a.label || "배송지"}</span>
                            {a.isDefault && <Badge size="sm" tone="brand">기본</Badge>}
                        </div>
                        <div className="mt-1 text-[var(--color-fg)]">{a.recipientName} · {a.phoneMasked}</div>
                        <div className="text-[var(--color-fg-muted)]">({a.postalCode}) {a.address1} {a.address2 ?? ""}</div>
                        <div className="mt-3 flex gap-1.5 text-xs">
                            {!a.isDefault && (
                                <button onClick={() => setDefault(a.id)} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-fg)] px-2.5 py-1 hover:border-[var(--color-border-strong)]">기본 설정</button>
                            )}
                            <button onClick={() => startEdit(a)} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-fg)] px-2.5 py-1 hover:border-[var(--color-border-strong)]">수정</button>
                            <button onClick={() => remove(a.id)} className="rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] px-2.5 py-1 hover:bg-[var(--color-danger-bg)]">삭제</button>
                        </div>
                    </li>
                ))}
                {list.length === 0 && <p className="text-sm text-[var(--color-fg-subtle)] text-center py-6">등록된 배송지가 없습니다.</p>}
            </ul>

            <form onSubmit={save} className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h2 className="text-base font-medium text-[var(--color-fg)]">{editingId ? "배송지 수정" : "새 배송지 등록"}</h2>
                <Input placeholder="별칭 (예: 집, 회사)" value={form.label} onChange={e => setForm(s => ({ ...s, label: e.target.value }))} />
                <Input placeholder="수령인" required value={form.recipientName} onChange={e => setForm(s => ({ ...s, recipientName: e.target.value }))} />
                <Input placeholder="휴대폰" required value={form.phone} onChange={e => setForm(s => ({ ...s, phone: e.target.value }))} />
                <Input placeholder="우편번호" required value={form.postalCode} onChange={e => setForm(s => ({ ...s, postalCode: e.target.value }))} />
                <Input placeholder="주소" required value={form.address1} onChange={e => setForm(s => ({ ...s, address1: e.target.value }))} />
                <Input placeholder="상세 주소" value={form.address2} onChange={e => setForm(s => ({ ...s, address2: e.target.value }))} />
                <Checkbox label="기본 배송지로 설정" checked={form.isDefault} onChange={e => setForm(s => ({ ...s, isDefault: e.target.checked }))} />
                <div className="flex gap-2 pt-1">
                    {editingId && (
                        <Button type="button" variant="secondary" fullWidth className="flex-1"
                            onClick={() => { setEditingId(null); setForm({ ...empty }); }}>
                            취소
                        </Button>
                    )}
                    <Button type="submit" fullWidth className="flex-1">
                        {editingId ? "수정" : "등록"}
                    </Button>
                </div>
            </form>
            </main>
        </div>
    );
}
