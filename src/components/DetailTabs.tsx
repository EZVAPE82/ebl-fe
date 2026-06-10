"use client";

/**
 * 상품 상세 4탭 — 시안 14:3437.
 * 스크롤 위치에 따른 active 자동 전환 + 클릭 시 smooth scroll.
 */

import { useEffect, useState } from "react";

const TABS = [
    { id: "info",    label: "상세정보" },
    { id: "ship",    label: "상품구매안내" },
    { id: "reviews", label: "제품리뷰" },
    { id: "qna",     label: "Q&A" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DetailTabs() {
    const [active, setActive] = useState<TabId>("info");

    // 스크롤 위치에 따른 active 자동 변경
    useEffect(() => {
        function onScroll() {
            // 헤더(56) + 탭(60) 정도 offset
            const scrollY = window.scrollY + 200;
            // 뒤에서부터 첫 매칭 (현재 가장 가까운 위쪽 섹션)
            for (let i = TABS.length - 1; i >= 0; i--) {
                const el = document.getElementById(TABS[i].id);
                if (el && el.offsetTop <= scrollY) {
                    setActive(TABS[i].id);
                    return;
                }
            }
            setActive(TABS[0].id);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // 초기 1회
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    function jump(id: TabId, e: React.MouseEvent<HTMLAnchorElement>) {
        e.preventDefault();
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 120; // 헤더+탭 만큼 offset
        window.scrollTo({ top, behavior: "smooth" });
        setActive(id);
    }

    return (
        <nav className="mx-auto max-w-[1920px] px-4 xl:px-[170px] mt-16 md:mt-[100px]">
            <div className="flex rounded-[8px] bg-[#F6F7FB] p-2">
                {TABS.map(t => {
                    const isActive = t.id === active;
                    return (
                        <a
                            key={t.id}
                            href={`#${t.id}`}
                            onClick={e => jump(t.id, e)}
                            className={`flex-1 rounded-[4px] px-2 py-4 text-center text-[16px] transition ${
                                isActive
                                    ? "bg-white font-medium text-[#000] shadow-[4px_3px_2px_rgba(35,48,59,0.06)]"
                                    : "font-normal text-[#999999] hover:text-[#000]"
                            }`}
                        >
                            {t.label}
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}
