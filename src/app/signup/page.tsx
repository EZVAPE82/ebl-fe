"use client";

import Link from "next/link";

/**
 * 회원가입 시작 — 방식 선택 LANDING (Figma 37:10502 매칭)
 *  - 카카오 / 구글: 소셜 가입 (콘솔 키 수령 전까지 visual + alert 안내)
 *  - 일반 회원가입  → /signup/general
 *  - 외국인 회원가입 → /signup/general?type=foreign
 *  공통 Header/PromoStrip/Footer 는 layout 에서 제공 (여기서 추가하지 않음).
 */
export default function SignupLandingPage() {
    function social(provider: "KAKAO" | "GOOGLE") {
        alert(`${provider} 로그인은 도급인 콘솔 키 수령 후 활성화됩니다.`);
    }

    return (
        <div className="mx-auto max-w-[480px] px-4 pt-10 md:pt-[60px] pb-20 flex flex-col gap-[60px]">
            {/* 1) 헤더 */}
            <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-[32px] md:text-[36px] font-bold text-[#000]">
                    회원가입을 시작해 볼까요?
                </h1>
                <p className="text-[16px] text-[#767676]">
                    회원가입으로 구매시 40% 할인을 할수 있습니다!
                </p>
            </div>

            {/* 2) 가입 방식 버튼 */}
            <div className="flex flex-col gap-4">
                {/* 카카오 */}
                <button
                    type="button"
                    onClick={() => social("KAKAO")}
                    className="w-full p-4 bg-[#F9DB00] rounded-[4px] flex justify-center items-center gap-1.5 hover:brightness-95 transition"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#3E1918" aria-hidden="true">
                        <path d="M12 3C6.48 3 2 6.52 2 10.87c0 2.75 1.81 5.16 4.56 6.55-.2.71-.73 2.65-.84 3.06-.13.51.19.51.41.37.17-.12 2.74-1.86 3.83-2.6.66.09 1.34.14 2.04.14 5.52 0 10-3.52 10-7.87S17.52 3 12 3z" />
                    </svg>
                    <span className="text-[14px] font-medium text-[#3E1918]">카카오로 3초만에 가입하기</span>
                </button>

                {/* 구글 */}
                <button
                    type="button"
                    onClick={() => social("GOOGLE")}
                    className="w-full p-4 bg-white rounded-[4px] border border-[#DDDDDD] flex justify-center items-center gap-1.5 hover:bg-[#F6F7FB] transition"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-[14px] font-medium text-[#000]">구글로 3초만에 가입하기</span>
                </button>

                {/* 일반 회원가입 → 폼(general) */}
                <Link
                    href="/signup/general"
                    className="w-full p-4 bg-[#222222] rounded-[4px] text-center text-[14px] font-medium text-white block hover:opacity-90 transition"
                >
                    일반 회원가입
                </Link>

                {/* 외국인 회원가입 → 폼(general, type=foreign) */}
                <Link
                    href="/signup/general?type=foreign"
                    className="w-full p-4 bg-[#F6F7FB] rounded-[4px] text-center text-[14px] font-medium text-[#767676] block hover:bg-[#eceef6] transition"
                >
                    외국인 회원가입
                </Link>
            </div>
        </div>
    );
}
