"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "./Header";
import { PromoStrip } from "./PromoStrip";

/**
 * 헤더 스택 — PromoStrip + Header 묶음 + 페이지별 위치/투명 로직
 *
 * - 홈 (`/`): fixed 로 히어로 위에 얹어 띄움.
 *   - 스크롤 0~60px: 투명 + 흰 글씨 (배너 위에 떠 있는 시안 모드)
 *   - 60px+: 흰 배경 + 다크 글씨 + backdrop blur 솔리드 모드
 * - 그 외 경로: sticky 솔리드 (기존 동작 유지)
 *
 * 홈 모드는 fixed 라 flow 공간을 차지하지 않음. 히어로가 viewport top 부터 시작.
 * 다른 페이지는 sticky 라 자연스럽게 헤더 아래로 내용 배치.
 */
export function HeaderStack() {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (!isHome) { setScrolled(false); return; }
        // 히어로 거의 끝날 때까지 (뷰포트 높이의 70%) 투명 유지. 그 다음 솔리드 전환.
        // 데스크톱 1080p 기준 ~756px → 히어로(420~720px)를 충분히 지나가야 흰배경 등장.
        const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [isHome]);

    const overlay = isHome && !scrolled;

    return (
        <div
            className={`${isHome ? "fixed" : "sticky"} top-0 left-0 right-0 z-40 transition-colors duration-300`}
        >
            <PromoStrip />
            <Header transparent={overlay} />
        </div>
    );
}
