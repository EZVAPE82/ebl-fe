"use client";

/**
 * 비회원 이미지 게이팅 — 상품 판매 이미지(클릭 시 상품 상세로 이동하는 것)만 블러+자물쇠.
 * 후기 사진·배너·카테고리 아이콘 등은 게이팅하지 않는다(클라이언트 확정).
 *
 * 동작: 비회원이 블러 이미지를 누르면 모달 없이 **바로 로그인 페이지로 이동**
 * (성인인증은 회원가입 절차에서 수행 — 비회원 단독 성인인증 경로 없음).
 *
 *  - useGated(): 가려야 하는가(미로그인 또는 인증 로딩 중 — 비회원 원본 노출 0)
 *  - useAdultGate().openGate(): /login?redirect=현재경로 로 즉시 이동
 *  - <GateOverlay/>: 이미지 컨테이너(relative) 위 블러+자물쇠 오버레이. 클릭 시 로그인 이동.
 */

import { usePathname, useRouter } from "next/navigation";
import {
    createContext, useCallback, useContext, useMemo, type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";

/** 게이팅 전역 스위치 — false 면 블러/오버레이 전부 비활성. */
const GATING_ENABLED = true;

type GateCtx = { openGate: () => void };
const Ctx = createContext<GateCtx | null>(null);

export function AdultGateProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    // 모달 없음 — 즉시 로그인 페이지로 (로그인 후 원래 페이지 복귀)
    const openGate = useCallback(() => {
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
    }, [router, pathname]);

    const value = useMemo<GateCtx>(() => ({ openGate }), [openGate]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdultGate(): GateCtx {
    const v = useContext(Ctx);
    return v ?? { openGate: () => {} }; // provider 밖이면 안전한 no-op
}

/** 가려야 하는가 — 미로그인 또는 인증 로딩 중. 전역 스위치 OFF 면 항상 false. */
export function useGated(): boolean {
    const { user, loading } = useAuth();
    if (!GATING_ENABLED) return false;
    return loading || !user;
}

/** 이미지(relative 컨테이너) 위에 얹는 블러+자물쇠 오버레이. 클릭 시 바로 로그인 이동. */
export function GateOverlay({ compact = false }: { compact?: boolean }) {
    const { openGate } = useAdultGate();
    return (
        <div
            role="button"
            tabIndex={0}
            aria-label="로그인 후 확인 가능"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openGate(); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGate(); } }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 backdrop-blur-xl bg-black/20 cursor-pointer select-none"
        >
            <LockIcon big={!compact} />
            {!compact && (
                <span className="text-[10px] md:text-[11px] font-semibold text-white px-2 text-center leading-tight drop-shadow">
                    로그인 후 확인 가능
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
