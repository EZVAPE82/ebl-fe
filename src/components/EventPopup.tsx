"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * 이벤트 팝업 — 시안 40:8652 (600x468) 통이미지.
 * - 홈 진입 시 1회 표시 (localStorage 24h 차단)
 * - "오늘 하루 보지 않기" / X 닫기
 */
const STORAGE_KEY = "elf:eventPopup:hideUntil";

export function EventPopup() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            const hideUntil = localStorage.getItem(STORAGE_KEY);
            if (hideUntil && parseInt(hideUntil, 10) > Date.now()) return;
            // 짧은 딜레이 후 표시
            const t = window.setTimeout(() => setOpen(true), 500);
            return () => window.clearTimeout(t);
        } catch {
            setOpen(true);
        }
    }, []);

    function close() {
        setOpen(false);
    }
    function hideToday() {
        try {
            const next24h = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem(STORAGE_KEY, String(next24h));
        } catch { /* noop */ }
        setOpen(false);
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="이벤트 안내">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={close} />
            {/* modal */}
            <div className="relative w-full max-w-[480px] bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden shadow-2xl">
                <Link href="/events" onClick={close} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/page-popup-event.png" alt="엘프바의 특별 이벤트" className="w-full block" />
                </Link>
                <button
                    type="button"
                    aria-label="닫기"
                    onClick={close}
                    className="absolute right-3 top-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <div className="flex justify-between border-t border-[var(--color-border)] text-xs">
                    <button
                        type="button"
                        onClick={hideToday}
                        className="flex-1 py-3 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] border-r border-[var(--color-border)]"
                    >
                        오늘 하루 보지 않기
                    </button>
                    <button
                        type="button"
                        onClick={close}
                        className="flex-1 py-3 text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
