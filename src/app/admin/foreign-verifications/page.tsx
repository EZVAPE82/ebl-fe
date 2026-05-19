"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Page } from "@/types/api";

type Verification = {
    id: number;
    memberId: number;
    method: "PASS" | "FOREIGN_DOC";
    status: "PENDING" | "APPROVED" | "REJECTED";
    documentS3Key: string | null;
    createdAt: string;
    reviewedAt: string | null;
    rejectReason: string | null;
};

export default function ForeignVerificationsPage() {
    const [list, setList] = useState<Page<Verification> | null>(null);
    const [rejectFor, setRejectFor] = useState<number | null>(null);
    const [reason, setReason] = useState("");

    const load = useCallback(async () => {
        const res = await adminApi<Page<Verification>>("/api/v1/admin/adult-verifications?size=20");
        setList(res);
    }, []);

    useEffect(() => { load(); }, [load]);

    async function approve(id: number) {
        try {
            await adminApi(`/api/v1/admin/adult-verifications/${id}/approve`, { method: "POST" });
            load();
        } catch (e) { alert(e instanceof ApiError ? e.message : "실패"); }
    }
    async function reject() {
        if (!rejectFor) return;
        try {
            await adminApi(`/api/v1/admin/adult-verifications/${rejectFor}/reject`, {
                method: "POST", body: JSON.stringify({ reason }),
            });
            setRejectFor(null); setReason("");
            load();
        } catch (e) { alert(e instanceof ApiError ? e.message : "실패"); }
    }

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">외국인 성인 인증 대기</h1>

            <div className="overflow-x-auto bg-white rounded-md border border-zinc-200">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-zinc-600 text-left">
                        <tr>
                            <th className="px-3 py-2">ID</th>
                            <th className="px-3 py-2">회원 ID</th>
                            <th className="px-3 py-2">방법</th>
                            <th className="px-3 py-2">신청일</th>
                            <th className="px-3 py-2">서류</th>
                            <th className="px-3 py-2 text-right">처리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list?.content.map(v => (
                            <tr key={v.id} className="border-t border-zinc-200">
                                <td className="px-3 py-2 text-zinc-500">{v.id}</td>
                                <td className="px-3 py-2">{v.memberId}</td>
                                <td className="px-3 py-2 text-xs">{v.method}</td>
                                <td className="px-3 py-2 text-xs text-zinc-500">{formatDate(v.createdAt)}</td>
                                <td className="px-3 py-2 text-xs">
                                    {v.documentS3Key && (
                                        <span className="font-mono text-zinc-500">{v.documentS3Key.slice(0, 40)}...</span>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-right space-x-1">
                                    <button onClick={() => approve(v.id)} className="rounded bg-emerald-600 text-white px-2 py-1 text-xs">승인</button>
                                    <button onClick={() => setRejectFor(v.id)} className="rounded bg-rose-600 text-white px-2 py-1 text-xs">반려</button>
                                </td>
                            </tr>
                        ))}
                        {list && list.content.length === 0 && (
                            <tr><td colSpan={6} className="px-3 py-8 text-center text-zinc-500">대기 중인 신청이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {rejectFor !== null && (
                <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md w-full max-w-md p-4 space-y-3">
                        <h3 className="font-semibold">반려 사유</h3>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                        <div className="flex gap-2">
                            <button onClick={() => { setRejectFor(null); setReason(""); }} className="flex-1 rounded border border-zinc-300 py-2 text-sm">취소</button>
                            <button onClick={reject} className="flex-1 rounded bg-rose-600 text-white py-2 text-sm">반려</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
