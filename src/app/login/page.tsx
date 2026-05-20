"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { fetchIntegrations, type Integrations } from "@/lib/integrations";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-12 text-[var(--color-fg-subtle)]">불러오는 중...</div>}>
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
            <h1 className="text-2xl font-semibold mb-6 text-[var(--color-fg)]">로그인</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <Input
                    type="email"
                    required
                    label="이메일"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <Input
                    type="password"
                    required
                    label="비밀번호"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={error}
                />
                <Button type="submit" loading={submitting} size="lg" fullWidth>
                    로그인
                </Button>
            </form>

            <div className="mt-6">
                <div className="text-center text-xs text-[var(--color-fg-subtle)] mb-3">소셜 계정으로 로그인</div>
                <div className="space-y-2">
                    <SocialBtn provider="KAKAO" label="카카오로 시작하기" bg="bg-[#FEE500] text-[var(--color-fg)]" />
                    <SocialBtn provider="GOOGLE" label="Google로 시작하기" bg="bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)]" />
                    {integrations?.naverLogin && (
                        <SocialBtn provider="NAVER" label="네이버로 시작하기" bg="bg-[#03C75A] text-white" />
                    )}
                </div>
            </div>

            <div className="mt-5 flex justify-center gap-3 text-xs text-[var(--color-fg-muted)]">
                <Link href="/find-email" className="hover:text-[var(--color-fg)]">아이디 찾기</Link>
                <span className="text-[var(--color-fg-subtle)]">·</span>
                <Link href="/password-reset" className="hover:text-[var(--color-fg)]">비밀번호 재설정</Link>
            </div>
            <div className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
                계정이 없으신가요?{" "}
                <Link href="/signup" className="text-[var(--color-fg)] underline">회원가입</Link>
            </div>
            <p className="mt-8 text-xs text-[var(--color-fg-subtle)] leading-relaxed">
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
            className={`w-full rounded-[var(--radius-sm)] py-3.5 text-sm font-medium transition hover:opacity-90 ${bg}`}
        >
            {label}
        </button>
    );
}
