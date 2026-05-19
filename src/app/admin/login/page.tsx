"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/admin";
import { ApiError } from "@/lib/api";

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await adminLogin(username, password);
            router.replace("/admin");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "로그인 실패");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-900">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6 space-y-4"
            >
                <div>
                    <h1 className="text-lg font-bold">엘프바 어드민</h1>
                    <p className="text-xs text-zinc-500 mt-1">관리자만 접근 가능합니다.</p>
                </div>

                <label className="block">
                    <span className="text-xs text-zinc-600">아이디</span>
                    <input
                        type="text"
                        required
                        autoComplete="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                </label>
                <label className="block">
                    <span className="text-xs text-zinc-600">비밀번호</span>
                    <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                </label>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-md bg-zinc-900 text-white py-2.5 text-sm font-medium disabled:opacity-50"
                >
                    {submitting ? "로그인 중..." : "로그인"}
                </button>

                <p className="text-[10px] text-zinc-400 text-center">
                    * 5회 이상 실패 시 30분 잠금
                </p>
            </form>
        </div>
    );
}
