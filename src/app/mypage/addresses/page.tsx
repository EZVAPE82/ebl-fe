"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
            phone: "", // 마스킹된 phone은 다시 입력
            postalCode: a.postalCode,
            address1: a.address1,
            address2: a.address2 ?? "",
            isDefault: a.isDefault,
        });
    }

    if (authLoading || !user) return <div className="mx-auto max-w-md px-4 py-10 text-zinc-500">불러오는 중...</div>;

    return (
        <div className="mx-auto max-w-md px-4 py-8 space-y-6">
            <div>
                <Link href="/mypage" className="text-xs text-zinc-500 hover:text-black">← 마이페이지</Link>
                <h1 className="text-xl md:text-2xl font-bold mt-1">배송지 관리</h1>
                <p className="text-xs text-zinc-500 mt-1">최대 5개까지 저장할 수 있습니다.</p>
            </div>

            {/* 목록 */}
            <ul className="space-y-2">
                {list.map(a => (
                    <li key={a.id} className="rounded-md border border-zinc-200 p-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{a.label || "배송지"}</span>
                            {a.isDefault && <span className="text-[10px] rounded bg-zinc-900 text-white px-1.5 py-0.5">기본</span>}
                        </div>
                        <div className="mt-1 text-zinc-700">{a.recipientName} · {a.phoneMasked}</div>
                        <div className="text-zinc-600">({a.postalCode}) {a.address1} {a.address2 ?? ""}</div>
                        <div className="mt-2 flex gap-2 text-xs">
                            {!a.isDefault && <button onClick={() => setDefault(a.id)} className="rounded border border-zinc-300 px-2 py-1">기본 설정</button>}
                            <button onClick={() => startEdit(a)} className="rounded border border-zinc-300 px-2 py-1">수정</button>
                            <button onClick={() => remove(a.id)} className="rounded border border-rose-300 text-rose-600 px-2 py-1">삭제</button>
                        </div>
                    </li>
                ))}
                {list.length === 0 && <p className="text-sm text-zinc-500 text-center py-6">등록된 배송지가 없습니다.</p>}
            </ul>

            {/* 등록·수정 폼 */}
            <form onSubmit={save} className="space-y-2 rounded-md border border-zinc-200 p-4">
                <h2 className="text-sm font-semibold">{editingId ? "배송지 수정" : "새 배송지 등록"}</h2>
                <input placeholder="별칭 (예: 집, 회사)" value={form.label} onChange={e => setForm(s => ({...s, label: e.target.value}))} className={input} />
                <input placeholder="수령인" required value={form.recipientName} onChange={e => setForm(s => ({...s, recipientName: e.target.value}))} className={input} />
                <input placeholder="휴대폰" required value={form.phone} onChange={e => setForm(s => ({...s, phone: e.target.value}))} className={input} />
                <input placeholder="우편번호" required value={form.postalCode} onChange={e => setForm(s => ({...s, postalCode: e.target.value}))} className={input} />
                <input placeholder="주소" required value={form.address1} onChange={e => setForm(s => ({...s, address1: e.target.value}))} className={input} />
                <input placeholder="상세 주소" value={form.address2} onChange={e => setForm(s => ({...s, address2: e.target.value}))} className={input} />
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isDefault} onChange={e => setForm(s => ({...s, isDefault: e.target.checked}))} />
                    기본 배송지로 설정
                </label>
                <div className="flex gap-2">
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ ...empty }); }} className="flex-1 rounded-md border border-zinc-300 py-2 text-sm">취소</button>}
                    <button type="submit" className="flex-1 rounded-md bg-zinc-900 text-white py-2 text-sm">
                        {editingId ? "수정" : "등록"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const input = "w-full rounded border border-zinc-300 px-2 py-1.5 text-sm";
