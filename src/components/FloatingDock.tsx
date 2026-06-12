"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getRecentlyViewed, RECENT_EVENT, type RecentProduct } from "@/lib/recentlyViewed";

/**
 * 우측 플로팅 dock — 시안 402:11754 (Frame 1707488248) 매칭.
 *  - 흰색 라운드 컨테이너 88px 폭, border + 그림자, padding 12.
 *  - 아이콘+라벨 5개: 내정보 / 최근 본 상품 / 장바구니 / 문의 / 위쳇
 *  - 맨 아래 파란 ⌃ "맨 위로" 버튼.
 *  - 우측 35px, 세로 중앙 고정. 2xl 이상만 노출(좁은 화면 콘텐츠 가림 방지).
 *  - z-20 으로 헤더(z-40)/모달(z-50)보다 낮춤.
 *  - "최근 본 상품"은 localStorage 기반 실연동(DockRecent) — 버튼 1개, 누르면 최근 본 상품으로 이동.
 */
export function FloatingDock() {
    const { user } = useAuth();
    const profileHref = user ? "/mypage" : "/login";

    function scrollTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <div className="hidden 2xl:block fixed right-[35px] top-1/2 -translate-y-1/2 z-20">
            {/* 시안 CSS: w 88 · padding-top 12 · col · center · gap 12 · radius 8 · border 1px #DDD · bg #FFF */}
            <div className="w-[88px] rounded-lg border border-[#DDD] bg-white overflow-hidden pt-3 flex flex-col items-center gap-3">
                <DockItem href={profileHref} label="내정보">
                    <PersonIcon />
                </DockItem>
                <DockRecent />
                <DockItem href="/cart" label="장바구니">
                    <BagIcon />
                </DockItem>
                <DockItem href="/faq" label="문의">
                    <ChatIcon />
                </DockItem>
                <DockItem href="/contact" label="위쳇">
                    <WeChatIcon />
                </DockItem>
                <button
                    type="button"
                    onClick={scrollTop}
                    aria-label="맨 위로"
                    className="w-full h-9 bg-[#1f8fff] text-white flex items-center justify-center hover:opacity-90 transition"
                >
                    <ChevronUpIcon />
                </button>
            </div>
        </div>
    );
}

function DockItem({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            aria-label={label}
            className="w-full flex flex-col items-center gap-1.5 pb-1 text-[var(--color-fg)] hover:opacity-60 transition"
        >
            <span className="flex items-center justify-center h-9">{children}</span>
            <span className="text-[10px] text-[var(--color-fg-muted)] leading-none">{label}</span>
        </Link>
    );
}

/**
 * 최근 본 상품 — localStorage(getRecentlyViewed) 연동.
 * 가장 최근 본 상품의 썸네일을 노출하고, 누르면 그 상품으로 바로 이동.
 * 최근 본 상품이 없으면 전체 상품(/products)으로 이동.
 */
function DockRecent() {
    const [recent, setRecent] = useState<RecentProduct[]>([]);

    useEffect(() => {
        const read = () => setRecent(getRecentlyViewed());
        read();
        window.addEventListener(RECENT_EVENT, read);
        window.addEventListener("storage", read);
        return () => {
            window.removeEventListener(RECENT_EVENT, read);
            window.removeEventListener("storage", read);
        };
    }, []);

    const latest = recent[0];

    return (
        <Link
            href={latest?.href ?? "/products"}
            aria-label={latest ? `최근 본 상품: ${latest.name}` : "최근 본 상품"}
            title={latest?.name ?? "최근 본 상품"}
            className="w-full flex flex-col items-center gap-1.5 pb-1 hover:opacity-70 transition"
        >
            <span className="w-11 h-11 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] overflow-hidden">
                {latest?.thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={latest.thumb} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : (
                    <BoxIcon />
                )}
            </span>
            <span className="text-[10px] text-[var(--color-fg-muted)] leading-none">최근 본 상품</span>
        </Link>
    );
}

function PersonIcon() {
    return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="7" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
        </svg>
    );
}
function BagIcon() {
    return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5 9h14l-1.1 10.2a1.5 1.5 0 0 1-1.5 1.3H7.6a1.5 1.5 0 0 1-1.5-1.3L5 9z" />
            <path d="M8.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}
function ChatIcon() {
    return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 4v-4a2 2 0 0 1 0-12z" />
        </svg>
    );
}
function WeChatIcon() {
    return (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 4C5.1 4 2 6.6 2 9.8c0 1.8 1 3.4 2.6 4.5L4 16.5l2.4-1.2c.8.2 1.7.4 2.6.4h.5a4.8 4.8 0 0 1-.1-1c0-2.9 2.8-5.2 6.2-5.2h.6C15.9 6.2 12.8 4 9 4z" />
            <path d="M22 14.3c0-2.4-2.4-4.3-5.3-4.3s-5.3 1.9-5.3 4.3 2.4 4.3 5.3 4.3c.7 0 1.4-.1 2-.3l1.9.9-.5-1.6c1.2-.8 1.9-2 1.9-3.3z" />
        </svg>
    );
}
function ChevronUpIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
        </svg>
    );
}
function BoxIcon() {
    return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8" y="3" width="8" height="18" rx="3" />
            <line x1="10" y1="6.5" x2="14" y2="6.5" />
        </svg>
    );
}
