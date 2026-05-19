"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function FindEmailPage() {
    const [phone, setPhone] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [found, setFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setResult(null); setError(null); setSubmitting(true);
        try {
            const r = await api<{ found: boolean; emailMasked?: string }>("/api/v1/auth/find-email", {
                method: "POST", body: JSON.stringify({ phone }),
            });
            setFound(r.found);
            setResult(r.emailMasked ?? "");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "조회 실패");
        } finally { setSubmitting(false); }
    }

    return (
        <div className="mx-auto max-w-sm px-4 py-12">
            <h1 className="text-2xl font-bold mb-6">아이디(이메일) 찾기</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <label className="block">
                    <span className="text-sm text-zinc-600">가입 시 등록한 휴대폰 번호</span>
                    <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="010-1234-5678"
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                </label>
                {error && <p className="text-sm text-rose-600">{error}</p>}
                <button type="submit" disabled={submitting} className="w-full rounded-md bg-zinc-900 text-white py-2.5 text-sm disabled:opacity-50">
                    {submitting ? "조회 중..." : "조회"}
                </button>
            </form>

            {result !== null && (
                <div className="mt-5 rounded-md border border-zinc-200 p-3 text-sm">
                    {found ? (
                        <>가입된 이메일: <span className="font-mono">{result}</span></>
                    ) : (
                        <span className="text-zinc-500">일치하는 회원을 찾을 수 없습니다.</span>
                    )}
                </div>
            )}

            <div className="mt-6 text-center text-sm">
                <Link href="/login" className="text-zinc-700 underline">로그인 페이지로</Link>
                <span className="mx-2 text-zinc-300">·</span>
                <Link href="/password-reset" className="text-zinc-700 underline">비밀번호 재설정</Link>
            </div>
        </div>
    );
}
