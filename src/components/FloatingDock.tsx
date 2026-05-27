"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

/**
 * 우측 플로팅 dock (시안 매칭)
 *  - 화면 우측 중간에 고정, 세로 4 아이콘 (프로필 / 보안·로그인 / 채팅 / 댓글)
 *  - 프로필 아이콘 옆에 "개인정보 바로가기" 말풍선 배지 (마이페이지 진입)
 *  - 모바일에서는 숨김 (md 이상 노출) — 화면 좁을 때 콘텐츠 가려짐 방지
 *  - 상단 PromoStrip + Header 와 z-index 겹침 방지 (z-30, header=z-40 보다 낮게)
 */
export function FloatingDock() {
    const { user } = useAuth();
    const [badgeOpen, setBadgeOpen] = useState(true);
    const profileHref = user ? "/mypage" : "/login";

    // viewport 우측 끝에 fixed (콘텐츠 컨테이너 침범 안 함 — DUKE 4번째 카드 가림 방지).
    // 와이드 모니터에선 컨테이너 우측 바깥 여백에 들어가고, 좁은 화면에선 자연스럽게 가장자리.
    // z-20 으로 헤더(z-40) / 모달(z-50) 보다 낮춤.
    return (
        <div className="hidden md:block fixed right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <aside
                className="flex justify-end pointer-events-none"
                aria-label="빠른 메뉴"
            >
                <div className="flex flex-col gap-2 pointer-events-auto">
            {/* 프로필 + 개인정보 바로가기 배지 */}
            <div className="relative">
                {badgeOpen && (
                    <Link
                        href={profileHref}
                        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] text-[11px] font-medium px-3 py-1.5 shadow-md hover:opacity-90 transition flex items-center gap-1.5"
                        aria-label="개인정보 바로가기"
                    >
                        <span>개인정보 바로가기</span>
                        <button
                            type="button"
                            aria-label="배지 닫기"
                            onClick={(e) => { e.preventDefault(); setBadgeOpen(false); }}
                            className="ml-1 opacity-70 hover:opacity-100"
                        >
                            <CloseIcon size={10} />
                        </button>
                        {/* 말풍선 꼬리 */}
                        <span
                            aria-hidden="true"
                            className="absolute left-full top-1/2 -translate-y-1/2 -ml-px h-0 w-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-[var(--color-fg)]"
                        />
                    </Link>
                )}
                <DockButton href={profileHref} label="마이페이지">
                    <ProfileIcon />
                </DockButton>
            </div>

            <DockButton href={user ? "/mypage/settings" : "/login"} label={user ? "계정 보안" : "로그인"}>
                <LockIcon />
            </DockButton>

            <DockButton href="/faq" label="고객문의">
                <ChatIcon />
            </DockButton>

            <DockButton href="/notices" label="공지·소식">
                <CommentIcon />
            </DockButton>
                </div>
            </aside>
        </div>
    );
}

function DockButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            aria-label={label}
            className="w-11 h-11 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm hover:shadow-md hover:border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-fg)] transition"
        >
            {children}
        </Link>
    );
}

function ProfileIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
    );
}
function LockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 1 1 8 0v4" />
        </svg>
    );
}
function ChatIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.7-.8L3 21l1.9-5.4A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" />
        </svg>
    );
}
function CommentIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function CloseIcon({ size = 12 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
