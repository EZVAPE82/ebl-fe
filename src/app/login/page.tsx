"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

/* 시안 37:10470 매칭 — 회원/비회원 탭 + 깔끔한 input + 검정 로그인 버튼 + 소셜 (카카오/구글) */

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-[var(--color-fg-subtle)]">불러오는 중...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const sp = useSearchParams();
    const redirectTo = sp.get("redirect") ?? "/";

    const [tab, setTab] = useState<"member" | "guest">("member");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberEmail, setRememberEmail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (tab === "guest") {
            router.push("/checkout?guest=1");
            return;
        }
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

    const inputClass = "w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg-muted)] transition";

    return (
        <div className="mx-auto max-w-md px-4 py-10 md:py-16">
            {/* 큰 타이틀 가운데 */}
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] text-center mb-8 md:mb-10">회원 로그인</h1>

            {/* 회원/비회원 탭 — 밑줄 (라운딩 없음) */}
            <div className="grid grid-cols-2 border-b border-[var(--color-border)] mb-8">
                <button
                    type="button"
                    onClick={() => setTab("member")}
                    className={`pb-3 text-sm font-medium transition ${
                        tab === "member"
                            ? "text-[var(--color-fg)] border-b-2 border-[var(--color-fg)] -mb-px"
                            : "text-[var(--color-fg-muted)]"
                    }`}
                >
                    회원로그인
                </button>
                <button
                    type="button"
                    onClick={() => setTab("guest")}
                    className={`pb-3 text-sm font-medium transition ${
                        tab === "guest"
                            ? "text-[var(--color-fg)] border-b-2 border-[var(--color-fg)] -mb-px"
                            : "text-[var(--color-fg-muted)]"
                    }`}
                >
                    비회원로그인
                </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                {/* 아이디 */}
                <div>
                    <label className="block text-xs font-medium text-[var(--color-fg)] mb-1.5">
                        아이디 <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="아이디를 입력해주세요"
                        className={inputClass}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                {/* 비밀번호 (회원만) */}
                {tab === "member" && (
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-fg)] mb-1.5">
                            비밀번호 <span className="text-[var(--color-danger)]">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="비밀번호를 입력해주세요"
                            className={inputClass}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                )}

                {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

                {/* 아이디 저장 (좌) / 아이디찾기·비밀번호찾기 (우) */}
                {tab === "member" && (
                    <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={rememberEmail} onChange={e => setRememberEmail(e.target.checked)} className="w-4 h-4 rounded-full border-[var(--color-border)] accent-[var(--color-fg)]" />
                            <span className="text-[var(--color-fg-muted)]">아이디 저장</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <Link href="/find-email" className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">아이디찾기</Link>
                            <span className="text-[var(--color-fg-subtle)]">|</span>
                            <Link href="/password-reset" className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">비밀번호 찾기</Link>
                        </div>
                    </div>
                )}

                {/* 검정 로그인 버튼 (rounded-[6px]) */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center rounded-[6px] bg-[var(--color-fg)] text-[var(--color-bg)] py-3.5 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                    {submitting ? "처리 중..." : tab === "member" ? "로그인" : "비회원으로 주문하기"}
                </button>
            </form>

            {/* 회원가입 안내 */}
            {tab === "member" && (
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--color-fg-muted)]">
                    <span>아직 엘프바 회원이 아니신가요?</span>
                    <Link href="/signup" className="font-bold text-[var(--color-fg)] underline">회원가입</Link>
                    <span className="text-[var(--color-fg-subtle)]">|</span>
                    <Link href="/signup?type=foreign" className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">외국인 회원가입</Link>
                </div>
            )}

            {/* 소셜 아이콘 — 카카오(노랑 원) + 구글(흰 원) */}
            <div className="mt-8 flex items-center justify-center gap-4">
                <SocialIcon provider="KAKAO" bg="bg-[#FEE500]" />
                <SocialIcon provider="GOOGLE" bg="bg-white border border-[var(--color-border)]" />
            </div>
        </div>
    );
}

function SocialIcon({ provider, bg }: { provider: "KAKAO" | "GOOGLE"; bg: string }) {
    function handleClick() {
        alert(`${provider} 로그인은 도급인 콘솔 키 수령 후 활성화됩니다.`);
    }
    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={`${provider} 로그인`}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition hover:scale-105 ${bg}`}
        >
            {provider === "KAKAO" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
                    <path d="M12 3C6.48 3 2 6.52 2 10.87c0 2.75 1.81 5.16 4.56 6.55-.2.71-.73 2.65-.84 3.06-.13.51.19.51.41.37.17-.12 2.74-1.86 3.83-2.6.66.09 1.34.14 2.04.14 5.52 0 10-3.52 10-7.87S17.52 3 12 3z"/>
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            )}
        </button>
    );
}
