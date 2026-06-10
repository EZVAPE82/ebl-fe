"use client";

/**
 * 마이페이지 메인 — Figma 마이페이지 spec.
 *
 * 레이아웃 (Header/PromoStrip/Footer 는 layout 제공 → 여기서 추가 안 함):
 * - Outer: max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flcol lg:row gap-20
 * - SIDEBAR: MyPageSideNav (w-full lg:w-[260px])
 * - MAIN: flex-1 lg:w-[1000px] flex flcol gap-[100px]
 *     1) 프로필 카드 + 3 통계 카드
 *     2) 주문처리 현황 (4단계 흐름 + 취소/교환/환불)
 *     3) 최근 주문내역 (썸네일/가격/수량/일자/상태 pill)
 *
 * 데이터 보존: auth 가드, /members/me, /orders, points/balance, coupons, referrals.
 * 추가: /members/me/grade 로 실제 등급 라벨 매핑(graceful fallback).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { MyPageSideNav } from "@/components/mypage/SideNav";

type Order = {
    id: number;
    orderNo: string;
    status: string;
    paidAmount: number;
    orderedAt: string;
    items: { id: number; productName: string; quantity: number }[];
};

type CouponItem = {
    memberCouponId: number;
    name: string;
    discountType: string;
    discountValue: number;
    expiresAt: string;
    usedAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
    PENDING_PAYMENT: "입금대기",
    PAID: "주문접수",
    PREPARING: "배송준비중",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    REFUNDED: "환불완료",
};

// 백엔드 GradeCode → 표시 라벨 (회원등급 페이지와 일치)
const GRADE_DISPLAY: Record<string, string> = {
    SILVER: "실버",
    GOLD: "골드",
    DIA: "다이아",
    VIP: "VIP",
};

// 상태 pill — Figma: 배송완료(파랑) / 진행(회색) / 취소완료(검정)
type PillStyle = { container: string; dot: string };
const STATUS_PILL: Record<string, PillStyle> = {
    PENDING_PAYMENT: { container: "bg-[#F6F7FB] text-[#767676]", dot: "#767676" },
    PAID: { container: "bg-[#F6F7FB] text-[#767676]", dot: "#767676" },
    PREPARING: { container: "bg-[#F6F7FB] text-[#767676]", dot: "#767676" },
    SHIPPING: { container: "bg-[#F6F7FB] text-[#767676]", dot: "#767676" },
    DELIVERED: { container: "bg-[#E6F3FE] text-[#0072DD]", dot: "#0742AC" },
    CANCELED: { container: "bg-[#222222] text-white", dot: "#ffffff" },
    REFUNDED: { container: "bg-[#222222] text-white", dot: "#ffffff" },
};
const DEFAULT_PILL: PillStyle = { container: "bg-[#F6F7FB] text-[#767676]", dot: "#767676" };

export default function MyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [balance, setBalance] = useState(0);
    const [coupons, setCoupons] = useState<CouponItem[]>([]);
    const [joinedAt, setJoinedAt] = useState<string>("");
    const [gradeCode, setGradeCode] = useState<string>("");

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/mypage");
            return;
        }
        if (!user) return;
        (async () => {
            try {
                const [me, o, b, c, g] = await Promise.all([
                    api<{ createdAt?: string }>("/api/v1/members/me", { auth: true }).catch(
                        () => ({}) as { createdAt?: string }
                    ),
                    api<{ content: Order[] }>("/api/v1/orders?size=10", { auth: true }),
                    api<{ balance: number }>("/api/v1/members/me/points/balance", { auth: true }),
                    api<{ content: CouponItem[] }>("/api/v1/members/me/coupons?size=50", { auth: true }),
                    api<{ grade: string }>("/api/v1/members/me/grade", { auth: true }).catch(
                        () => ({ grade: "" })
                    ),
                ]);
                if (me.createdAt) setJoinedAt(me.createdAt);
                setOrders(o.content);
                setBalance(b.balance);
                setCoupons(c.content);
                setGradeCode(g.grade);
            } catch {
                /* ignore */
            }
        })();
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] py-10 text-[#767676]">
                불러오는 중...
            </div>
        );
    }

    const gradeLabel = gradeCode ? GRADE_DISPLAY[gradeCode] ?? gradeCode : "일반회원";

    const usableCoupons = coupons.filter(
        (c) => !c.usedAt && new Date(c.expiresAt) > new Date()
    );

    // 주문 처리 현황 단계별 카운트 (최근 1개월)
    const counts = {
        PENDING_PAYMENT: orders.filter((o) => o.status === "PENDING_PAYMENT").length,
        PREPARING: orders.filter((o) => ["PAID", "PREPARING"].includes(o.status)).length,
        SHIPPING: orders.filter((o) => o.status === "SHIPPING").length,
        DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
        CANCELED: orders.filter((o) => o.status === "CANCELED").length,
        EXCHANGE: 0,
        REFUNDED: orders.filter((o) => o.status === "REFUNDED").length,
    };

    const recentOrders = orders.slice(0, 5);

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row gap-20">
            {/* ===== 좌측 사이드바 ===== */}
            <MyPageSideNav />

            {/* ===== 우측 메인 ===== */}
            <main className="flex-1 lg:w-[1000px] flex flex-col gap-[100px]">
                {/* ── 1) 프로필 블록 ── */}
                <section className="flex flex-col gap-7">
                    {/* 프로필 카드 */}
                    <div className="p-9 rounded-[16px] border border-[#DDDDDD] flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-[88px] h-[88px] rounded-full bg-[#F3F3F3] flex items-center justify-center">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle cx="12" cy="8" r="4" stroke="#CCCCCC" strokeWidth="1.6" />
                                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#CCCCCC" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col">
                                    <p className="text-[20px] font-medium text-[#000000]">
                                        안녕하세요. {user.name}님!
                                    </p>
                                    <p className="text-[14px] text-[#767676]">
                                        고객님의 회원등급은 {gradeLabel}입니다.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] text-[#767676]">가입일</span>
                                    <span className="w-px h-3 bg-[#E5E5EC]" />
                                    <span className="text-[14px] text-[#000000]">
                                        {joinedAt ? formatDate(joinedAt) : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Link
                            href="/mypage/settings"
                            className="w-[108px] p-3 bg-[#222222] rounded-[4px] text-center text-white text-[14px] font-medium"
                        >
                            정보수정
                        </Link>
                    </div>

                    {/* 3 통계 카드 */}
                    <div className="flex flex-wrap gap-5">
                        <StatCard label="현재 고객님의 회원등급" value={gradeLabel} icon="crown" />
                        <StatCard label="사용가능한 쿠폰" value={`${usableCoupons.length}개`} icon="coupon" />
                        <StatCard label="사용가능한 적립금" value={`${balance.toLocaleString()}P`} icon="coins" />
                    </div>
                </section>

                {/* ── 2) 주문처리 현황 ── */}
                <section className="flex flex-col gap-5">
                    <div className="flex items-end gap-1">
                        <h2 className="text-[24px] font-medium text-[#000000]">나의 주문처리 현황</h2>
                        <span className="text-[14px] font-light text-[#767676]">(최근 1개월)</span>
                    </div>
                    <div className="flex flex-wrap justify-between items-start gap-8">
                        {/* 좌측: 4단계 흐름 */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-6">
                                <FlowBox value={counts.PENDING_PAYMENT} />
                                <FlowArrow />
                                <FlowBox value={counts.PREPARING} />
                                <FlowArrow />
                                <FlowBox value={counts.SHIPPING} />
                                <FlowArrow />
                                <FlowBox value={counts.DELIVERED} />
                            </div>
                            <div className="flex justify-between">
                                {["입금대기", "배송준비중", "배송중", "배송완료"].map((label, i) => (
                                    <span
                                        key={label}
                                        className={`w-[86px] text-center text-[16px] text-[#000000] ${i > 0 ? "ml-6" : ""}`}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {/* 우측: 취소/교환/환불 */}
                        <div className="w-[196px] flex flex-col">
                            <SideCount label="취소" value={counts.CANCELED} />
                            <SideCount label="교환" value={counts.EXCHANGE} />
                            <SideCount label="환불" value={counts.REFUNDED} />
                        </div>
                    </div>
                </section>

                {/* ── 3) 최근 주문내역 ── */}
                <section className="flex flex-col gap-5">
                    <div className="flex justify-between items-end">
                        <div className="flex items-end gap-1">
                            <h2 className="text-[24px] font-medium text-[#000000]">최근 나의 주문내역</h2>
                            <span className="text-[14px] font-light text-[#767676]">(최근 1개월)</span>
                        </div>
                        <Link href="/mypage/orders" className="text-[14px] font-medium text-[#000000]">
                            전체보기
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <p className="border-t border-[#222222] border-b border-b-[#DDDDDD] py-12 text-center text-[14px] text-[#767676]">
                            최근 주문 내역이 없습니다.
                        </p>
                    ) : (
                        <div className="border-t border-[#222222]">
                            {recentOrders.map((o) => (
                                <div
                                    key={o.id}
                                    className="py-3 border-b border-[#DDDDDD] flex flex-wrap justify-between items-center gap-3"
                                >
                                    <Link href={`/orders/${o.id}`} className="flex items-center gap-3 min-w-0">
                                        <span className="w-[90px] h-[108px] rounded-[4px] object-cover bg-[#F6F7FB] shrink-0" />
                                        <span className="flex flex-col gap-1 min-w-0">
                                            <span className="text-[16px] font-medium text-[#000000] line-clamp-1">
                                                {o.items[0]?.productName ?? "-"}
                                                {o.items.length > 1 && ` 외 ${o.items.length - 1}건`}
                                            </span>
                                            <span className="text-[14px] font-light text-[#767676]">
                                                #{o.orderNo}
                                            </span>
                                        </span>
                                    </Link>
                                    <span className="w-[184px] text-center text-[14px] font-medium">
                                        {formatPrice(o.paidAmount)}
                                    </span>
                                    <span className="w-[184px] text-center text-[14px] text-[#767676]">
                                        {o.items[0]?.quantity ?? 1}개
                                    </span>
                                    <span className="w-[184px] text-center text-[14px] text-[#767676]">
                                        {formatDate(o.orderedAt)}
                                    </span>
                                    <StatusPill status={o.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

/* ============================================================
 * 보조 컴포넌트
 * ============================================================ */

function StatIcon({ name }: { name: "crown" | "coupon" | "coins" }) {
    const common = { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none" as const, "aria-hidden": true };
    if (name === "crown") {
        return (
            <svg {...common}>
                <path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 9h-13L4 8Z" stroke="#0072DD" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
        );
    }
    if (name === "coupon") {
        return (
            <svg {...common}>
                <path d="M4 6h16v3a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V6Z" stroke="#0072DD" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M14 7v2M14 12v2M14 17v0" stroke="#0072DD" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        );
    }
    return (
        <svg {...common}>
            <ellipse cx="12" cy="7" rx="6" ry="3" stroke="#0072DD" strokeWidth="1.5" />
            <path d="M6 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" stroke="#0072DD" strokeWidth="1.5" />
            <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" stroke="#0072DD" strokeWidth="1.5" />
        </svg>
    );
}

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: "crown" | "coupon" | "coins";
}) {
    return (
        <div className="flex-1 min-w-[260px] max-w-[320px] p-6 bg-[#F6F7FB] rounded-[10px] flex flex-col gap-12">
            <div className="flex items-center gap-1">
                <span className="text-[14px] font-light text-[#767676]">{label}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="#DDDDDD" strokeWidth="1.5" />
                    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.2-.7.6-.7 1.1" stroke="#DDDDDD" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="0.6" fill="#DDDDDD" />
                </svg>
            </div>
            <div className="flex justify-end items-end gap-1">
                <StatIcon name={icon} />
                <span className="text-[26px] font-medium text-[#0072DD] leading-none">{value}</span>
            </div>
        </div>
    );
}

function FlowBox({ value }: { value: number }) {
    return (
        <div className="w-[86px] h-[86px] bg-[#F6F7FB] rounded-[10px] flex items-center justify-center text-[26px] font-medium text-[#000000]">
            {value}
        </div>
    );
}

function FlowArrow() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="#222222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SideCount({ label, value }: { label: string; value: number }) {
    return (
        <div className="py-3 border-b border-[#DDDDDD] flex justify-between items-center">
            <span className="text-[14px] text-[#767676]">{label}</span>
            <span className="text-[14px] font-medium text-[#000000]">{value}</span>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const label = STATUS_LABEL[status] ?? status;
    const { container, dot } = STATUS_PILL[status] ?? DEFAULT_PILL;
    return (
        <span
            className={`px-[18px] py-2.5 rounded-full text-[14px] font-medium flex items-center gap-1 ${container}`}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
            {label}
        </span>
    );
}
