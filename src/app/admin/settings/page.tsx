"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";

type Setting = {
    key: string;
    value: string;
    description: string | null;
    updatedAt: string;
};

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        const res = await adminApi<Setting[]>("/api/v1/admin/settings");
        setSettings(res);
        setDrafts(Object.fromEntries(res.map(s => [s.key, s.value])));
    }, []);

    useEffect(() => { load(); }, [load]);

    async function save(key: string) {
        try {
            await adminApi(`/api/v1/admin/settings/${key}`, {
                method: "PUT", body: JSON.stringify({ value: drafts[key] }),
            });
            alert("저장되었습니다.");
            load();
        } catch (e) { alert(e instanceof ApiError ? e.message : "저장 실패"); }
    }

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">정책 설정</h1>
            <p className="text-xs text-zinc-500 mb-4">
                * 변경 즉시 적용됩니다 (서비스 인메모리 캐시 갱신).
            </p>

            <div className="bg-white rounded-md border border-zinc-200 divide-y divide-zinc-200">
                {settings.map(s => {
                    const changed = drafts[s.key] !== s.value;
                    return (
                        <div key={s.key} className="p-3 flex flex-wrap items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="font-mono text-xs text-zinc-600">{s.key}</div>
                                <div className="text-xs text-zinc-400 mt-0.5">{s.description ?? ""}</div>
                            </div>
                            <input
                                value={drafts[s.key] ?? ""}
                                onChange={e => setDrafts(d => ({ ...d, [s.key]: e.target.value }))}
                                className="w-40 rounded border border-zinc-300 px-2 py-1 text-sm text-right"
                            />
                            <button
                                onClick={() => save(s.key)}
                                disabled={!changed}
                                className={`rounded px-3 py-1 text-xs ${
                                    changed ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                                }`}
                            >저장</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
