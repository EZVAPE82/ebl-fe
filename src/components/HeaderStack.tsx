"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { PromoStrip } from "./PromoStrip";

/**
 * 헤더 스택 — PromoStrip + Header 묶음.
 *
 * 시안 캡쳐 정합성:
 *  - 홈 ('/')        : fixed 투명 오버레이. Hero 그라데이션 위에 떠있음. 텍스트 흰색.
 *                      Hero 가 헤더 높이만큼 위로 침범 (page.tsx 에서 Hero 위 spacer 없음).
 *  - 그 외 페이지    : sticky 솔리드 흰 배경 + 보더. flow 공간 차지.
 */
export function HeaderStack() {
    const pathname = usePathname();
    const isHome = pathname === "/";

    if (isHome) {
        return (
            <div className="fixed top-0 left-0 right-0 z-40">
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
