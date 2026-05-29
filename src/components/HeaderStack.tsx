"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "./Header";
import { PromoStrip } from "./PromoStrip";

/**
 * 헤더 스택 — PromoStrip + Header 묶음.
 *
 * 시안 캡쳐 정합성:
 *  - 홈 ('/')        : fixed 투명 오버레이. Hero 그라데이션 위에 떠있음. 텍스트 흰색.
 *                      스크롤 시: 살짝 어두운 반투명 회색 + backdrop-blur (시안의 frost 효과).
 *                      Hero 가 헤더 높이만큼 위로 침범 (page.tsx 에서 Hero 위 spacer 없음).
 *  - 그 외 페이지    : sticky 솔리드 흰 배경 + 보더. flow 공간 차지.
 */
export function HeaderStack() {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const [scrolled, setScrolled] = useState(false);

    // 홈 only: scrollY > 40 이면 투명 → 반투명 회색 frost 로 전환.
    useEffect(() => {
        if (!isHome) return;
        function onScroll() {
            setScrolled(window.scrollY > 40);
        }
        onScroll(); // initial
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [isHome]);

    if (isHome) {
        return (
            <div
                className="fixed top-0 left-0 right-0 z-40 transition-colors duration-300"
                style={{
                    // scroll 전: 완전 투명. scroll 후: 반투명 회색 (어두운 hero 위에 frost 효과).
                    backgroundColor: scrolled ? "rgba(20, 18, 35, 0.55)" : "transparent",
                    backdropFilter: scrolled ? "blur(10px)" : "none",
                    WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
                }}
            >
                <PromoStrip />
                <Header transparent />
            </div>
        );
    }

    return (
        <div className="sticky top-0 left-0 right-0 z-40">
            <PromoStrip />
            <Header />
        </div>
    );
}
