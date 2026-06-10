"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";

/**
 * 회원등급 페이지 — Figma 회원등급 spec 매칭. 실제 데이터 연동:
 *  - 적립금: GET /api/v1/members/me/points/balance
 *  - 등급/누적/다음임계치: GET /api/v1/members/me/grade
 *  - 하단 혜택 테이블은 등급 체계 안내(정적, 백엔드 4등급 GradeCode 스펙과 일치).
 *
 * 데이터/인증 보존: useAuth 가드 + /login 리다이렉트, Promise.all 페치, graceful fallback.
 * 레이아웃/스타일만 시안에 맞춰 재구성·확장.
 */
export default function MemberGradePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [points, setPoints] = useState({ available: 0, expecting: 0, expiring30d: 0 });
    const [grade, setGrade] = useState<{ code: string; accumulated: number; nextThreshold: number | null } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) { router.replace("/login?redirect=/mypage/grade"); return; }
        if (!user) return;
        Promise.all([
            api<GradeDetail>("/api/v1/members/me/grade", { auth: true }).catch(() => null),
            api<{ balance: number }>("/api/v1/members/me/points/balance", { auth: true }).catch(() => ({ balance: 0 })),
        ]).then(([g, p]) => {
            if (g) setGrade({ code: g.grade, accumulated: g.accumulatedAmount, nextThreshold: g.nextThreshold });
            setPoints(s => ({ ...s, available: p?.balance ?? 0 }));
        });
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 text-[14px] text-[#767676]">불러오는 중...</div>;
    }

    const gradeCode = grade?.code ?? null;
    const gradeLabel = gradeCode ? (GRADE_DISPLAY[gradeCode] ?? gradeCode) : "—";
    const accumulated = grade?.accumulated ?? 0;
    const nextThreshold = grade?.nextThreshold ?? null;
    const progress = nextThreshold ? Math.min(100, Math.max(0, (accumulated / nextThreshold) * 100)) : 100;
    // 지난달 대비 사용액 델타 — 백엔드 미제공 시 시안 플레이스홀더(60,000원)로 유지.
    const spendDelta = 60000;

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row gap-20">
            <MyPageSideNav />

            <main className="flex-1 flex flex-col gap-[60px]">
                {/* ───────── SECTION 1: 회원 혜택등급 ───────── */}
                <section className="flex flex-col gap-7">
                    <h2 className="text-[32px] font-bold text-[#000]">회원 혜택등급</h2>

                    <div className="flex flex-wrap items-stretch gap-5">
                        {/* 사용가능한 적립금 카드 */}
                        <div className="w-[420px] max-w-full p-8 rounded-[10px] border border-[#DDDDDD] flex flex-col gap-9">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-1">
                                    <span className="text-[14px] text-[#000]">사용가능한 적립금</span>
                                    <InfoIcon />
                                </div>
                                <div className="flex items-end gap-1">
                                    <CoinGlyph />
                                    <span className="text-[32px] font-bold leading-[44px] text-[#0072DD] tabular-nums">
                                        {points.available.toLocaleString()}P
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between">
                                    <span className="text-[14px] text-[#767676]">예상 적립금</span>
                                    <span className="text-[14px] font-medium text-[#000] tabular-nums">{points.expecting.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[14px] text-[#767676]">소멸 예정 적립금(30일 이내)</span>
                                    <span className="text-[14px] font-medium text-[#000] tabular-nums">{points.expiring30d.toLocaleString()}원</span>
                                </div>
                            </div>
                        </div>

                        {/* 현재 등급 카드 */}
                        <div className="w-[560px] max-w-full p-8 rounded-[10px] border border-[#DDDDDD] flex flex-col gap-7">
                            <div className="flex items-center gap-2">
                                <div className="w-[68px] h-[68px] rounded-full bg-[#F6F7FB] flex items-center justify-center">
                                    <GradeMedalIcon />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[20px] font-medium text-[#000]">{gradeLabel}</span>
                                    <span className="text-[14px] text-[#767676]">
                                        지난달 보다 무려 <span className="text-[#0072DD]">{spendDelta.toLocaleString()}원</span>이나 더 사용하였습니다.
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <p className="text-[14px] font-medium text-[#000]">조금만 더 모으면 다음 등급으로 올라갈 수 있습니다.</p>
                                <div className="flex flex-col gap-1">
                                    <div className="w-full h-3 rounded-full bg-[#F6F7FB] overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-[linear-gradient(131deg,#8CC9FF_0%,#31A2FF_50%,#0461CB_100%)] transition-[width]"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[14px] text-[#000] tabular-nums">{accumulated.toLocaleString()}점</span>
                                        <span className="text-[14px] text-[#767676] tabular-nums">
                                            {nextThreshold ? `${nextThreshold.toLocaleString()}점` : "MAX"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ───────── SECTION 2: 회원등급별 혜택안내 ───────── */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-[32px] font-bold text-[#000]">회원등급별 혜택안내</h2>

                    <div className="overflow-x-auto">
                        <div className="min-w-[1000px]">
                            {/* HEADER ROW */}
                            <div className="flex border-t border-l border-[#DDDDDD]">
                                <HeadCell>
                                    <span className="text-[14px] text-[#767676]">회원등급</span>
                                </HeadCell>
                                {GRADES.map(g => (
                                    <HeadCell key={g.key} active={g.key === gradeCode}>
                                        <span className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-white text-[14px] font-bold ${g.badge}`}>
                                            {g.label}
                                        </span>
                                    </HeadCell>
                                ))}
                            </div>

                            {ROWS.map(row => (
                                <div key={row.label} className="flex border-l border-[#DDDDDD]">
                                    <BodyLabelCell>{row.label}</BodyLabelCell>
                                    {GRADES.map(g => (
                                        <BodyCell key={g.key} active={g.key === gradeCode}>{row.values[g.key]}</BodyCell>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-[14px] text-[#767676]">
                        *시행일: 온라인몰은 2025.09.12일부터 시행되며, 오프라인은 2025.10.22부터 시행됩니다. 각 해당일 이전까지는 기존과 동일한 기준유지됩니다.
                    </p>
                </section>
            </main>
        </div>
    );
}

type GradeKey = "SILVER" | "GOLD" | "DIA" | "VIP";

type GradeDetail = {
    grade: string; accumulatedAmount: number;
    nextGrade: string | null; nextThreshold: number | null; earnRate: number;
};

// 백엔드 GradeCode → 표시 라벨 (혜택 테이블의 등급명과 일치)
const GRADE_DISPLAY: Record<string, string> = {
    SILVER: "실버",
    GOLD: "골드",
    DIA: "다이아",
    VIP: "VIP",
};

// 헤더 배지 등급별 그라데이션 (백엔드 4등급 SILVER/GOLD/DIA/VIP)
const GRADES: { key: GradeKey; label: string; badge: string }[] = [
    { key: "SILVER", label: "실버", badge: "bg-[linear-gradient(145deg,rgba(217,217,217,0.8)_0%,#A7A7A7_100%)]" },
    { key: "GOLD", label: "골드", badge: "bg-[linear-gradient(145deg,rgba(245,193,77,0.8)_0%,#E29F0C_100%)]" },
    { key: "DIA", label: "다이아", badge: "bg-[linear-gradient(147deg,#A2CEFF_5%,#237FE4_100%)]" },
    { key: "VIP", label: "VIP", badge: "bg-[linear-gradient(145deg,#F7672F_0%,#F7A72F_100%)]" },
];

// 혜택 행 — 값은 백엔드 4등급 적립 정책과 일치.
const ROWS: { label: string; values: Record<GradeKey, string> }[] = [
    { label: "기본 적립", values: { SILVER: "1.0%", GOLD: "1.5%", DIA: "2.5%", VIP: "3.5%" } },
    { label: "무통장 추가적립", values: { SILVER: "0.5%", GOLD: "0.5%", DIA: "1.0%", VIP: "1.0%" } },
    { label: "총 적립", values: { SILVER: "1.5%", GOLD: "2.0%", DIA: "3.5%", VIP: "4.5%" } },
    { label: "등급업 금액", values: { SILVER: "0 ~ 300,000", GOLD: "300,000 ~ 500,000", DIA: "500,000 ~ 700,000", VIP: "700,000 이상" } },
];

/* ───────── 테이블 셀 (시안: w-[200px] 보더 셀) ───────── */
function HeadCell({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
    return (
        <div className={`w-[200px] h-20 border-r border-b border-[#DDDDDD] flex items-center justify-center ${active ? "bg-[#EAF3FF] ring-1 ring-inset ring-[#0072DD]" : "bg-[#F6F7FB]"}`}>
            {children}
        </div>
    );
}

function BodyLabelCell({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-[200px] py-4 border-r border-b border-[#DDDDDD] bg-white text-center text-[14px] text-[#767676]">
            {children}
        </div>
    );
}

function BodyCell({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
    return (
        <div className={`w-[200px] py-4 border-r border-b border-[#DDDDDD] text-center text-[14px] text-[#000] font-light ${active ? "bg-[#EAF3FF]" : ""}`}>
            {children}
        </div>
    );
}

/* ───────── 인라인 아이콘 ───────── */
/** 20px 원형 ? 인포 아이콘 (stroke #DDD) */
function InfoIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="9" stroke="#DDDDDD" strokeWidth="1.5" />
            <path d="M8.4 7.7a1.6 1.6 0 1 1 2.3 1.6c-.6.3-.9.6-.9 1.2" stroke="#DDDDDD" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="10" cy="13.4" r="0.9" fill="#DDDDDD" />
        </svg>
    );
}

/** 40px 적립금 코인 글리프 (fill #0072DD) */
function CoinGlyph() {
    return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="16" fill="#0072DD" />
            <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" />
            <path d="M20 12.5v15M16 16.5h5.2a2.8 2.8 0 0 1 0 5.6H16M16 22.1h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/** 44px 등급 메달 아이콘 (#222) */
function GradeMedalIcon() {
    return (
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
            <path d="M15 5h14l-3.4 11H18.4L15 5Z" fill="#222222" fillOpacity="0.15" stroke="#222222" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="22" cy="27" r="10" fill="#fff" stroke="#222222" strokeWidth="1.8" />
            <path d="M22 22.2l1.7 3.4 3.8.5-2.7 2.6.6 3.7-3.4-1.8-3.4 1.8.6-3.7-2.7-2.6 3.8-.5L22 22.2Z" fill="#222222" />
        </svg>
    );
}
