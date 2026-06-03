"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";

/**
 * 회원등급 페이지 — 시안 37:12695 매칭. 실제 데이터 연동:
 *  - 적립금: GET /api/v1/members/me/points/balance
 *  - 등급/누적/다음임계치: GET /api/v1/members/me/grade
 *  - 하단 혜택 테이블은 등급 체계 안내(정적, GradeCode 스펙과 일치).
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
        return <div className="mx-auto max-w-screen-2xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    const gradeLabel = grade ? (GRADE_DISPLAY[grade.code] ?? grade.code) : "—";
    const accumulated = grade?.accumulated ?? 0;
    const nextThreshold = grade?.nextThreshold ?? null;
    const progress = nextThreshold ? Math.min(100, (accumulated / nextThreshold) * 100) : 100;
    const remaining = nextThreshold ? Math.max(0, nextThreshold - accumulated) : 0;

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 md:py-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 md:gap-12">
            <MyPageSideNav />

            <section>
                <h2 className="text-xl md:text-2xl font-bold mb-6 text-[var(--color-fg)]">회원 혜택등급</h2>

                {/* 상단 2 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 사용가능한 적립금 카드 — 시안: 연회색 fill, 보더 없음 */}
                    <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-5 md:p-6">
                        <div className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)] mb-3">
                            <span>사용가능한 적립금</span>
                            <span className="inline-flex w-4 h-4 rounded-full bg-[var(--color-bg-subtle)] items-center justify-center text-[10px]">?</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="w-7 h-7 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center">€</span>
                            <span className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] tabular-nums">{points.available.toLocaleString()}P</span>
                        </div>
                        <dl className="mt-5 text-xs space-y-1.5 text-[var(--color-fg-muted)]">
                            <div className="flex justify-between">
                                <dt>예상 적립금</dt><dd className="tabular-nums text-[var(--color-fg)]">{points.expecting.toLocaleString()}원</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt>소멸 예정 적립금(30일 이내)</dt><dd className="tabular-nums text-[var(--color-fg)]">{points.expiring30d.toLocaleString()}원</dd>
                            </div>
                        </dl>
                    </div>

                    {/* 현재 등급 카드 — 실시간 6개월 누적 기반 */}
                    <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <GradeBadge label={gradeLabel} />
                            <span className="text-base md:text-lg font-bold text-[var(--color-fg)]">{gradeLabel}</span>
                        </div>
                        <p className="text-xs text-[var(--color-fg-muted)] mb-3">
                            최근 6개월 <strong className="text-[var(--color-fg)] font-semibold">{accumulated.toLocaleString()}원</strong> 구매하셨습니다.
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)] mb-2">
                            {nextThreshold
                                ? <>다음 등급까지 <strong className="text-[var(--color-fg)] font-semibold">{remaining.toLocaleString()}원</strong> 남았습니다.</>
                                : "최고 등급입니다. 감사합니다!"}
                        </p>
                        <div className="relative h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent)] transition-[width]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-[var(--color-fg-subtle)] tabular-nums">
                            <span>{accumulated.toLocaleString()}원</span>
                            <span>{nextThreshold ? `${nextThreshold.toLocaleString()}원` : "MAX"}</span>
                        </div>
                    </div>
                </div>

                {/* 회원등급별 혜택안내 테이블 */}
                <div className="mt-10">
                    <div className="flex items-end justify-between mb-3">
                        <h3 className="text-base md:text-lg font-bold text-[var(--color-fg)]">회원등급별 혜택안내</h3>
                        <p className="text-[11px] text-[var(--color-fg-muted)] hidden md:block">
                            등급 체계 : 브론즈 / 실버 / 골드 / 다이아 / VIP
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
                        <table className="w-full text-xs md:text-sm">
                            <thead className="bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
                                <tr>
                                    <th className="px-3 py-3 font-medium text-left">회원등급</th>
                                    {GRADES.map(g => (
                                        <th key={g.key} className="px-3 py-3 font-medium text-center">
                                            {/* 시안: 연회색 칩 + 컬러 방패 아이콘 + 등급명 */}
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1">
                                                <ShieldIcon color={g.color} />
                                                <span className="text-[var(--color-fg)]">{g.label}</span>
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-[var(--color-fg)] divide-y divide-[var(--color-border)]">
                                <tr>
                                    <td className="px-3 py-3 text-[var(--color-fg-muted)] whitespace-nowrap">조건 (6개월 누적)</td>
                                    {GRADES.map(g => (
                                        <td key={g.key} className="px-3 py-3 text-center">{g.condition}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-3 py-3 text-[var(--color-fg-muted)]">적립비율</td>
                                    {GRADES.map(g => (
                                        <td key={g.key} className="px-3 py-3 text-center tabular-nums">{g.basePoint}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-3 py-3 text-[var(--color-fg-muted)] whitespace-nowrap">무등급 추가적립</td>
                                    {GRADES.map(g => (
                                        <td key={g.key} className="px-3 py-3 text-center tabular-nums">{g.bonusPoint}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-3 py-3 text-[var(--color-fg-muted)]">지급</td>
                                    {GRADES.map(g => (
                                        <td key={g.key} className="px-3 py-3 text-center">{g.payment}</td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-3 text-[11px] text-[var(--color-fg-subtle)] leading-relaxed">
                        * 시행일: 온라인몰은 2025.09.12부터 시행되며, 오프라인은 2025.10.22부터 시행됩니다.
                        각 채널별 이전까지는 기존과 동일한 기준 유지됩니다.
                    </p>
                </div>
            </section>
        </div>
    );
}

type GradeKey = "STANDARD" | "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "VIP";

type GradeDetail = {
    grade: string; accumulatedAmount: number;
    nextGrade: string | null; nextThreshold: number | null; earnRate: number;
};

// 백엔드 GradeCode → 표시 라벨 (혜택 테이블의 등급명과 일치)
const GRADE_DISPLAY: Record<string, string> = {
    ENTRY: "브론즈",
    TIER_10K: "실버",
    TIER_25K: "골드",
    TIER_40K: "다이아",
    VIP: "VIP",
};

const GRADES: { key: GradeKey; label: string; color: string; condition: string; basePoint: string; bonusPoint: string; payment: string }[] = [
    { key: "BRONZE",  label: "브론즈", color: "#cd7f32", condition: "회원가입",    basePoint: "0%",   bonusPoint: "0%",   payment: "지급" },
    { key: "SILVER",  label: "실버",   color: "#c0c0c0", condition: "7만원 이상",  basePoint: "0%",   bonusPoint: "0.5%", payment: "지급" },
    { key: "GOLD",    label: "골드",   color: "#fbbf24", condition: "15만원 이상", basePoint: "1%",   bonusPoint: "0.5%", payment: "지급" },
    { key: "DIAMOND", label: "다이아", color: "#60a5fa", condition: "30만원 이상", basePoint: "1.5%", bonusPoint: "0.5%", payment: "지급" },
    { key: "VIP",     label: "VIP",    color: "#f87171", condition: "50만원 이상", basePoint: "2%",   bonusPoint: "0.5%", payment: "지급" },
];

/* 시안 매칭: 등급별 컬러 방패 SVG (테이블 헤더 칩 안에) */
function ShieldIcon({ color }: { color: string }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" fill={color} />
        </svg>
    );
}

function GradeBadge({ label }: { label: string }) {
    return (
        <div className="w-12 h-12 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-fg-muted)]" aria-label={label}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="6" />
                <polyline points="8 13 7 21 12 18 17 21 16 13" />
            </svg>
        </div>
    );
}
