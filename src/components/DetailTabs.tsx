"use client";

/**
 * 상품 상세 4탭 — 시안 14:3437.
 * 스크롤 위치에 따른 active 자동 전환 + 클릭 시 smooth scroll.
 */

import { useEffect, useState } from "react";

const TABS = [
    { id: "info",    label: "상세정보" },
    { id: "reviews", label: "상품후기" },
    { id: "ship",    label: "배송·교환·반품" },
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
        <nav className="mt-10 border-y border-[var(--color-border)] bg-[var(--color-surface)] sticky top-14 z-10">
            <ul className="mx-auto max-w-screen-2xl px-4 flex">
                {TABS.map(t => {
                    const isActive = t.id === active;
                    return (
                        <li key={t.id} className="flex-1">
                            <a
                                href={`#${t.id}`}
                                onClick={e => jump(t.id, e)}
                                className={`block text-center text-sm py-4 transition border-b-2 ${
                                    isActive
                                        ? "border-[var(--color-fg)] text-[var(--color-fg)] font-semibold"
                                        : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                                }`}
                            >
                                {t.label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
