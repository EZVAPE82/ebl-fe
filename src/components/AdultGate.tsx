"use client";

/**
 * 성인인증 게이팅 — 비회원(미로그인)에게 상품/리뷰 이미지를 블러+자물쇠로 가린다.
 * 텍스트는 가리지 않음(SEO). 기준 = 로그인 여부. 로딩 중에도 블러 기본(비회원 원본 노출 0).
 *
 *  - useGated(): 가려야 하는가(미로그인 또는 로딩 중)
 *  - <GateOverlay/>: 이미지 컨테이너(relative) 위에 얹는 블러+자물쇠 오버레이. 클릭 시 게이트 모달.
 *  - useAdultGate().openGate(): 모달 열기
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";

type GateCtx = { openGate: () => void };
const Ctx = createContext<GateCtx | null>(null);

export function AdultGateProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const openGate = useCallback(() => setOpen(true), []);
    const value = useMemo<GateCtx>(() => ({ openGate }), [openGate]);
    const redirect = encodeURIComponent(pathname || "/");

    return (
        <Ctx.Provider value={value}>
            {children}
            {open && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
                    <div className="relative w-full max-w-[360px] rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 text-center shadow-xl">
                        <div className="text-4xl mb-3">🔞</div>
                        <h2 className="text-base font-bold text-[var(--color-fg)]">성인인증 후 확인 가능합니다</h2>
                        <p className="mt-2 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                            상품·리뷰 이미지는 로그인(성인인증) 후<br />확인할 수 있습니다. 회원가입 후 이용해주세요.
                        </p>
                        <div className="mt-5 flex flex-col gap-2">
                            <Link
                                href={`/login?redirect=${redirect}`}
                                onClick={() => setOpen(false)}
                                className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                            >
                                로그인
                            </Link>
                            <Link
                                href="/signup"
                                onClick={() => setOpen(false)}
                                className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 py-2.5 text-sm hover:bg-[var(--color-bg-subtle)] text-[var(--color-fg)]"
                            >
                                회원가입
                            </Link>
                        </div>
                        <button onClick={() => setOpen(false)} className="mt-3 text-xs text-[var(--color-fg-subtle)] hover:underline">
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </Ctx.Provider>
    );
}

export function useAdultGate(): GateCtx {
    const v = useContext(Ctx);
    return v ?? { openGate: () => {} }; // provider 밖이면 안전한 no-op
}

/** 가려야 하는가 — 미로그인 또는 인증 로딩 중(비회원에 원본 노출 방지). */
export function useGated(): boolean {
    const { user, loading } = useAuth();
    return loading || !user;
}

/** 이미지(relative 컨테이너) 위에 얹는 블러+자물쇠 오버레이. 클릭 시 게이트 모달. */
export function GateOverlay({ compact = false }: { compact?: boolean }) {
    const { openGate } = useAdultGate();
    return (
        <div
            role="button"
            tabIndex={0}
            aria-label="성인인증 후 확인 가능"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openGate(); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGate(); } }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 backdrop-blur-xl bg-black/20 cursor-pointer select-none"
        >
            <LockIcon big={!compact} />
            {!compact && (
                <span className="text-[10px] md:text-[11px] font-semibold text-white px-2 text-center leading-tight drop-shadow">
                    성인인증 후 확인
                </span>
            )}
        </div>
    );
}

function LockIcon({ big }: { big: boolean }) {
    const s = big ? 26 : 16;
    return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-white drop-shadow">
            <rect x="4.5" y="10.5" width="15" height="10" rx="2" fill="currentColor" />
            <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}
