"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { safeRedirectPath } from "@/lib/url";

/* Figma 로그인 SPEC 매칭 — 회원 전용(비회원 경로 제거) + 검정 로그인 버튼 + 소셜 (카카오/구글) */

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-[520px] px-4 pt-10 md:pt-[60px] text-[#767676]">불러오는 중...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const sp = useSearchParams();
    const redirectTo = safeRedirectPath(sp.get("redirect"));

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberEmail, setRememberEmail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

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

    const inputClass = "w-full p-4 rounded-[4px] border border-[#E5E5EC] text-[14px] outline-none focus:border-[#222] placeholder:text-[#999999] text-[#000] transition";

    return (
        <div className="mx-auto max-w-[520px] px-4 pt-10 md:pt-[60px] pb-20 flex flex-col items-center gap-[60px]">
            {/* 큰 타이틀 가운데 */}
            <h1 className="text-[32px] md:text-[36px] font-bold text-center text-[#000]">회원 로그인</h1>

            {/* 폼 블록 */}
            <div className="w-full max-w-[480px] flex flex-col gap-7">
                {/* 회원 로그인 단일 — 비회원 로그인/구매 경로 제거(회원 전용 몰, 클라 확정) */}
                <div className="flex border-b border-[#DDDDDD]">
                    <span className="flex-1 py-4 text-center border-b-2 border-[#222222] text-[16px] font-medium text-[#222222]">
                        회원로그인
                    </span>
                </div>

                {/* 폼 */}
                <form onSubmit={onSubmit} className="flex flex-col gap-10">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-6">
                            {/* 아이디 */}
                            <div className="flex flex-col gap-2">
                                <div className="flex">
                                    <span className="text-[14px] font-medium text-[#000]">아이디</span>
                                    <span className="text-[14px] font-medium text-[#0072DD]">*</span>
                                </div>
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

                            {/* 비밀번호 */}
                            <div className="flex flex-col gap-2">
                                <div className="flex">
                                    <span className="text-[14px] font-medium text-[#000]">비밀번호</span>
                                    <span className="text-[14px] font-medium text-[#0072DD]">*</span>
                                </div>
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
                        </div>

                        {/* 아이디 저장 (좌) / 아이디찾기·비밀번호찾기 (우) */}
                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberEmail}
                                    onChange={e => setRememberEmail(e.target.checked)}
                                    className="w-[22px] h-[22px] rounded-[4px] border border-[#E5E5EC] accent-[#222222]"
                                />
                                <span className="text-[14px] font-medium text-[#000]">아이디 저장</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <Link href="/find-email" className="text-[14px] text-[#000]">아이디찾기</Link>
                                <span className="w-px h-3 bg-[#E5E5EC]" />
                                <Link href="/password-reset" className="text-[14px] text-[#000]">비밀번호 찾기</Link>
                            </div>
                        </div>

                        {/* 로그인 에러 */}
                        {error && <p className="text-[14px] text-[#DC0000]">{error}</p>}
                    </div>

                    {/* 제출 그룹 */}
                    <div className="flex flex-col items-center gap-6">
                        {/* 검정 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full p-4 bg-[#222222] rounded-[4px] text-center text-[14px] font-medium text-white hover:opacity-90 transition disabled:opacity-50"
                        >
                            {submitting ? "처리 중..." : "로그인"}
                        </button>

                        {/* 회원가입 안내 */}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <span className="text-[14px] text-[#767676]">아직 엘프바 회원이 아니신가요?</span>
                            <Link href="/signup" className="text-[14px] font-medium underline text-[#000]">회원가입</Link>
                            <Link href="/signup?type=foreign" className="underline text-[14px] font-medium text-[#767676]">외국인 회원가입</Link>
                        </div>

                        {/* 소셜 아이콘 — 카카오(노랑 원) + 구글(흰 원) */}
                        <div className="flex items-center justify-center gap-5">
                            <SocialIcon provider="KAKAO" />
                            <SocialIcon provider="GOOGLE" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SocialIcon({ provider }: { provider: "KAKAO" | "GOOGLE" }) {
    function handleClick() {
        alert(`${provider} 로그인은 도급인 콘솔 키 수령 후 활성화됩니다.`);
    }
    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={`${provider} 로그인`}
            className={
                provider === "KAKAO"
                    ? "w-12 h-12 rounded-full bg-[#F9DB00] flex items-center justify-center transition hover:scale-105"
                    : "w-12 h-12 rounded-full bg-white border border-[#DDDDDD] flex items-center justify-center transition hover:scale-105"
            }
        >
            {provider === "KAKAO" ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#3E1918" aria-hidden="true">
                    <path d="M12 3C6.48 3 2 6.52 2 10.87c0 2.75 1.81 5.16 4.56 6.55-.2.71-.73 2.65-.84 3.06-.13.51.19.51.41.37.17-.12 2.74-1.86 3.83-2.6.66.09 1.34.14 2.04.14 5.52 0 10-3.52 10-7.87S17.52 3 12 3z"/>
                </svg>
            ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            )}
        </button>
    );
}
