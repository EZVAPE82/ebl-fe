"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { fetchIntegrations, type Integrations } from "@/lib/integrations";

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-12 text-zinc-500">불러오는 중...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const sp = useSearchParams();
    const redirectTo = sp.get("redirect") ?? "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [integrations, setIntegrations] = useState<Integrations | null>(null);

    useEffect(() => {
        fetchIntegrations().then(setIntegrations);
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email, password);
            router.replace(redirectTo);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "로그인에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-sm px-4 py-12">
            <h1 className="text-2xl font-bold mb-6">로그인</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <label className="block">
                    <span className="text-sm text-zinc-600">이메일</span>
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                </label>
                <label className="block">
                    <span className="text-sm text-zinc-600">비밀번호</span>
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
                    className="w-full rounded-md bg-zinc-900 text-white py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
                >
                    {submitting ? "로그인 중..." : "로그인"}
                </button>
            </form>

            <div className="mt-5">
                <div className="text-center text-xs text-zinc-400 mb-2">소셜 계정으로 로그인</div>
                <div className="space-y-2">
                    <SocialBtn provider="KAKAO" label="카카오로 시작하기" bg="bg-yellow-300 text-zinc-900" />
                    <SocialBtn provider="GOOGLE" label="Google로 시작하기" bg="bg-white text-zinc-800 border border-zinc-300" />
                    {integrations?.naverLogin && (
                        <SocialBtn provider="NAVER" label="네이버로 시작하기" bg="bg-emerald-500 text-white" />
                    )}
                </div>
            </div>

            <div className="mt-4 flex justify-center gap-3 text-xs text-zinc-500">
                <Link href="/find-email" className="hover:text-black">아이디 찾기</Link>
                <span>·</span>
                <Link href="/password-reset" className="hover:text-black">비밀번호 재설정</Link>
            </div>
            <div className="mt-6 text-center text-sm text-zinc-500">
                계정이 없으신가요?{" "}
                <Link href="/signup" className="text-zinc-900 underline">회원가입</Link>
            </div>
            <p className="mt-8 text-xs text-zinc-400 leading-relaxed">
                * 본 사이트는 만 19세 이상 성인만 이용 가능합니다.<br />
                * 가입 후 PASS 본인인증을 완료해야 구매가 가능합니다.
            </p>
        </div>
    );
}

function SocialBtn({ provider, label, bg }: { provider: string; label: string; bg: string }) {
    function handleClick() {
        alert(`${provider} 로그인은 도급인 콘솔 키 수령 후 활성화됩니다.`);
    }
    return (
        <button
            type="button"
            onClick={handleClick}
            className={`w-full rounded-md py-2.5 text-sm font-medium ${bg}`}
        >
            {label}
        </button>
    );
}
