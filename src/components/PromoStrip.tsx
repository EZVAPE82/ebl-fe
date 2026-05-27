"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * 상단 검은 띠 (시안 매칭)
 *  - 검은 배경 + 작은 흰 글씨로 가입 혜택 안내
 *  - 우측 끝 X 버튼으로 세션 동안 닫기 (sessionStorage)
 *  - SSR 시에는 항상 표시 (CLS 방지). 닫혀있던 사용자는 클라이언트 마운트 후 숨김.
 */
export function PromoStrip() {
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        try {
            if (sessionStorage.getItem("elf:promoStrip:closed") === "1") setClosed(true);
        } catch {
            /* sessionStorage 비활성 환경 무시 */
        }
    }, []);

    if (closed) return null;

    function close() {
        try {
            sessionStorage.setItem("elf:promoStrip:closed", "1");
        } catch { /* noop */ }
        setClosed(true);
    }

    return (
        <div className="w-full bg-black text-white text-xs">
            <div className="mx-auto max-w-screen-xl px-4 py-2 flex items-center justify-center relative">
                <Link href="/signup" className="flex items-center gap-2 hover:opacity-80 transition">
                    <HomeIcon />
                    <span>신규 회원 가입 시 <strong className="font-semibold">3,000원 적립금</strong> 지급</span>
                </Link>
                <button
                    type="button"
                    aria-label="공지 닫기"
                    onClick={close}
                    className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition"
                >
                    <CloseIcon />
                </button>
            </div>
        </div>
    );
}

function HomeIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12 12 3l9 9" />
            <path d="M5 10v10h14V10" />
        </svg>
    );
}
function CloseIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
