"use client";

import { usePathname } from "next/navigation";
import { HeaderStack } from "./HeaderStack";
import { Footer } from "./Footer";
import { FloatingDock } from "./FloatingDock";

/**
 * LayoutChrome — pathname 따라 chrome (header/footer/dock) 노출 제어.
 *
 * home '/' 페이지는 MainTemplate 가 자체 header/footer 포함 (검정 + 에메랄드 디자인).
 * 그 외 페이지는 기존 한국어 HeaderStack + Footer + FloatingDock 유지.
 */
export function LayoutChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHome = pathname === "/";

    if (isHome) {
        // 홈은 MainTemplate 가 self-contained chrome → layout chrome 모두 숨김
        return <main className="flex-1">{children}</main>;
    }

    return (
        <>
            <HeaderStack />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingDock />
        </>
    );
}
