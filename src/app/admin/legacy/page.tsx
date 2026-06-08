"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { API_BASE } from "@/lib/api";

type ImportResult = { imported: number; skipped: number; total: number };

export default function AdminLegacyPage() {
    const [total, setTotal] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCount = useCallback(async () => {
        try {
            const r = await adminApi<{ total: number }>("/api/v1/admin/legacy/count");
            setTotal(r.total);
        } catch { /* adminApi 가 401 시 로그인으로 보냄 */ }
    }, []);

    useEffect(() => { loadCount(); }, [loadCount]);

    async function upload(e: React.FormEvent) {
        e.preventDefault();
        if (!file) { setError("CSV 파일을 선택하세요."); return; }
        setError(null); setUploading(true); setResult(null);
        try {
            const fd = new FormData();
            fd.append("file", file);
            // multipart 는 api() 헬퍼(JSON) 대신 raw fetch + 쿠키 인증.
            const res = await fetch(`${API_BASE}/api/v1/admin/legacy/import`, {
                method: "POST", body: fd, credentials: "include",
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({} as { message?: string }));
                throw new Error(b.message ?? "업로드에 실패했습니다.");
            }
            const r: ImportResult = await res.json();
            setResult(r);
            setTotal(r.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
        } finally {
            setUploading(false);
        }
    }

    const ic = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] px-3 py-2 text-sm";

    return (
        <div>
            <h1 className="text-xl font-bold mb-1">기존 회원 명단 (리뉴얼 이전 고객)</h1>
            <p className="text-xs text-[var(--color-fg-subtle)] mb-5">
                업로드한 명단은 신규 가입 시 이메일/전화 매칭으로 인식되어, &ldquo;기존 엘프바코리아 회원&rdquo; 조건의 SIGNUP 캠페인 보상에 사용됩니다.
            </p>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-5">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-fg-muted)]">현재 등록된 명단</span>
                    <span className="text-2xl font-bold text-[var(--color-accent)] tabular-nums">
                        {total == null ? "—" : total.toLocaleString()}<span className="text-sm font-normal text-[var(--color-fg-muted)] ml-1">건</span>
                    </span>
                </div>
            </div>

            <form onSubmit={upload} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                <h2 className="font-semibold text-sm">CSV 업로드</h2>
                <p className="text-xs text-[var(--color-fg-muted)]">
                    형식: <code className="bg-[var(--color-bg-subtle)] px-1 rounded">email,phone,name</code> (헤더 행 선택, 이메일/전화 중 하나만 있어도 됨). 이미 등록된 이메일/전화는 자동 제외됩니다.
                </p>
                <input
                    type="file"
                    accept=".csv,text/csv"
                    className={ic}
                    onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(null); }}
                />
                <button
                    type="submit"
                    disabled={uploading || !file}
                    className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
                >
                    {uploading ? "업로드 중..." : "업로드"}
                </button>

                {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
                {result && (
                    <div className="text-sm rounded-[var(--radius-sm)] bg-[var(--color-success)]/10 text-[var(--color-success)] px-3 py-2">
                        신규 {result.imported.toLocaleString()}건 등록 · 중복/무효 {result.skipped.toLocaleString()}건 제외 · 총 {result.total.toLocaleString()}건
                    </div>
                )}
            </form>

            <p className="mt-4 text-[11px] text-[var(--color-fg-subtle)] leading-relaxed">
                * 개인정보 최소 수집: 매칭에 필요한 이메일/전화만 저장합니다. 명단은 계정이 아니며, 가입은 고객이 직접 진행합니다.
            </p>
        </div>
    );
}
