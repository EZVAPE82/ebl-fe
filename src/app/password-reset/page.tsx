"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function PasswordResetPage() {
    const [step, setStep] = useState<"request" | "confirm">("request");
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [info, setInfo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function request(e: React.FormEvent) {
        e.preventDefault();
        setError(null); setInfo(null); setSubmitting(true);
        try {
            const r = await api<{ message: string; devToken?: string }>("/api/v1/auth/password-reset/request", {
                method: "POST", body: JSON.stringify({ email }),
            });
            setInfo(r.message);
            if (r.devToken) setToken(r.devToken);
            setStep("confirm");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "요청 실패");
        } finally { setSubmitting(false); }
    }

    async function confirm(e: React.FormEvent) {
        e.preventDefault();
        setError(null); setSubmitting(true);
        try {
            await api("/api/v1/auth/password-reset/confirm", {
                method: "POST", body: JSON.stringify({ token, newPassword }),
            });
            alert("비밀번호가 변경되었습니다. 로그인해주세요.");
            window.location.href = "/login";
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "재설정 실패");
        } finally { setSubmitting(false); }
    }

    return (
        <div className="mx-auto max-w-sm px-4 py-12">
            <h1 className="text-2xl font-bold mb-6">비밀번호 재설정</h1>

            {step === "request" ? (
                <form onSubmit={request} className="space-y-3">
                    <label className="block">
                        <span className="text-sm text-zinc-600">가입 이메일</span>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={input} />
                    </label>
                    {error && <p className="text-sm text-rose-600">{error}</p>}
                    <button type="submit" disabled={submitting} className={btnPrimary}>
                        {submitting ? "요청 중..." : "재설정 요청"}
                    </button>
                    <p className="text-xs text-zinc-400">
                        * 보안상 가입 여부와 무관하게 동일한 응답을 드립니다.
                    </p>
                </form>
            ) : (
                <form onSubmit={confirm} className="space-y-3">
                    {info && <p className="text-sm text-emerald-700 bg-emerald-50 rounded p-2">{info}</p>}
                    <label className="block">
                        <span className="text-sm text-zinc-600">재설정 토큰 (이메일로 받은 값)</span>
                        <input required value={token} onChange={e => setToken(e.target.value)} className={input} />
                    </label>
                    <label className="block">
                        <span className="text-sm text-zinc-600">새 비밀번호 (10자 이상, 영문/숫자/특수문자)</span>
                        <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className={input} />
                    </label>
                    {error && <p className="text-sm text-rose-600">{error}</p>}
                    <button type="submit" disabled={submitting} className={btnPrimary}>
                        {submitting ? "처리 중..." : "비밀번호 변경"}
                    </button>
                </form>
            )}

            <div className="mt-6 text-center text-sm">
                <Link href="/login" className="text-zinc-700 underline">로그인</Link>
                <span className="mx-2 text-zinc-300">·</span>
                <Link href="/find-email" className="text-zinc-700 underline">아이디 찾기</Link>
            </div>
        </div>
    );
}

const input = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";
const btnPrimary = "w-full rounded-md bg-zinc-900 text-white py-2.5 text-sm font-medium disabled:opacity-50";
