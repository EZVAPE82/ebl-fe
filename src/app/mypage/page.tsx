"use client";

/**
 * 마이페이지 메인 (Figma node 37:12411).
 *
 * 디자인 노트 — 라운딩:
 * - 환영 카드:        rounded-lg (~12px)
 * - "정보수정" 버튼:  rounded-sm (~4px) — 검정 채움
 * - 3분할 통계 카드:  rounded-md (~8px) — 옅은 회색 배경, 보더 없음
 * - 주문처리 현황 박스: 보더만, rounded 없음(0) — sharp
 * - 최근 주문 카드:   rounded 없음 — 라인 구분만
 * - 상태 pill:        rounded-full + 좌측 컬러 dot
 * - 상품 썸네일:      rounded-sm
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

// 상태 dot 색상 — Figma: 파랑/검정 위주
const STATUS_DOT: Record<string, string> = {
    PENDING_PAYMENT: "#3b82f6",
    PAID: "#3b82f6",
    PREPARING: "#3b82f6",
    SHIPPING: "#3b82f6",
    DELIVERED: "#3b82f6",
    CANCELED: "#ffffff",
    REFUNDED: "#ffffff",
};

const STATUS_CONTAINER: Record<string, string> = {
    PENDING_PAYMENT: "bg-[var(--color-bg-subtle)] text-[var(--color-fg)]",
    PAID: "bg-[var(--color-bg-subtle)] text-[var(--color-fg)]",
    PREPARING: "bg-[var(--color-bg-subtle)] text-[var(--color-fg)]",
    SHIPPING: "bg-[var(--color-bg-subtle)] text-[var(--color-fg)]",
    DELIVERED: "bg-[var(--color-bg-subtle)] text-[var(--color-fg)]",
    CANCELED: "bg-[var(--color-fg)] text-white",
    REFUNDED: "bg-[var(--color-fg)] text-white",
};

export default function MyPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [balance, setBalance] = useState(0);
    const [coupons, setCoupons] = useState<CouponItem[]>([]);
    const [joinedAt, setJoinedAt] = useState<string>("");

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/mypage");
            return;
        }
        if (!user) return;
        (async () => {
            try {
                const [me, o, b, c] = await Promise.all([
                    api<{ createdAt?: string }>("/api/v1/members/me", { auth: true }).catch(
                        () => ({}) as { createdAt?: string }
                    ),
                    api<{ content: Order[] }>("/api/v1/orders?size=10", { auth: true }),
                    api<{ balance: number }>("/api/v1/members/me/points/balance", { auth: true }),
                    api<{ content: CouponItem[] }>("/api/v1/members/me/coupons?size=50", { auth: true }),
                ]);
                if (me.createdAt) setJoinedAt(me.createdAt);
                setOrders(o.content);
                setBalance(b.balance);
                setCoupons(c.content);
            } catch {
                /* ignore */
            }
        })();
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-screen-2xl px-4 py-10 text-[var(--color-fg-subtle)]">
                불러오는 중...
            </div>
        );
    }

    const usableCoupons = coupons.filter(
        (c) => !c.usedAt && new Date(c.expiresAt) > new Date()
    );

    // 주문 처리 현황 단계별 카운트
    const counts = {
        PENDING_PAYMENT: orders.filter((o) => o.status === "PENDING_PAYMENT").length,
        PREPARING: orders.filter((o) => ["PAID", "PREPARING"].includes(o.status)).length,
        SHIPPING: orders.filter((o) => o.status === "SHIPPING").length,
        DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
        CANCELED: orders.filter((o) => o.status === "CANCELED").length,
        EXCHANGE: 0,
        REFUNDED: orders.filter((o) => o.status === "REFUNDED").length,
    };

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 grid gap-8 md:grid-cols-[220px_1fr]">
            {/* ===== 좌측 사이드바 (PC) ===== */}
            <MyPageSideNav />

            {/* ===== 모바일 헤더 ===== */}
            <div className="md:hidden">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-semibold text-[var(--color-fg)]">마이페이지</h1>
                    <button
                        onClick={async () => {
                            await logout();
                            router.replace("/");
                        }}
                        className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]"
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            {/* ===== 우측 메인 ===== */}
            <main className="space-y-6">
                {/* 환영 카드 — rounded-lg, 보더 회색 */}
                <div className="rounded-lg border border-[var(--color-border)] bg-white px-6 py-5 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-bg-subtle)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-[var(--color-fg)]">
                            안녕하세요. 엘프바님!
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                            {user.name}님의 회원등급은 일반회원입니다.
                        </p>
                        <p className="text-[11px] text-[var(--color-fg-muted)] mt-2">
                            가입일 <span className="ml-2 text-[var(--color-fg)]">
                                {joinedAt ? formatDate(joinedAt).replace(/\./g, ".") : "—"}
                            </span>
                        </p>
                    </div>
                    <Link
                        href="/mypage/settings"
                        className="hidden md:inline-flex items-center justify-center rounded-sm bg-[var(--color-fg)] text-white px-5 py-2.5 text-sm font-medium hover:opacity-90"
                    >
                        정보수정
                    </Link>
                </div>

                {/* 3분할 통계 카드 — 옅은 회색 박스, rounded-md, 보더 없음 */}
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <StatCard
                        label="현재 고객님의 회원등급"
                        icon={
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#3b82f6]">
                                <path d="M12 2l2.39 5.84L20 9l-4.5 3.9L17 19l-5-3-5 3 1.5-6.1L4 9l5.61-1.16z" />
                            </svg>
                        }
                        value="골드"
                    />
                    <StatCard
                        label="사용가능한 쿠폰"
                        icon={
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#3b82f6]">
                                <path d="M4 5h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V5zm5 3v8h2V8H9z" />
                            </svg>
                        }
                        value={`${usableCoupons.length}개`}
                    />
                    <StatCard
                        label="사용가능한 적립금"
                        icon={
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#3b82f6]">
                                <circle cx="12" cy="12" r="9" />
                                <text x="12" y="16" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">€</text>
                            </svg>
                        }
                        value={`${balance.toLocaleString()}P`}
                    />
                </div>

                {/* 주문 처리 현황 */}
                <div>
                    <h2 className="text-base font-semibold mb-3 text-[var(--color-fg)]">
                        나의 주문처리 현황{" "}
                        <span className="text-xs font-normal text-[var(--color-fg-muted)]">
                            (최근 1개월)
                        </span>
                    </h2>
                    <div className="border-t border-b border-[var(--color-border)] py-6 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                        {/* 4단계 흐름 */}
                        <div className="flex items-center justify-around">
                            <FlowStep label="입금대기" value={counts.PENDING_PAYMENT} />
                            <Arrow />
                            <FlowStep label="배송준비중" value={counts.PREPARING} />
                            <Arrow />
                            <FlowStep label="배송중" value={counts.SHIPPING} />
                            <Arrow />
                            <FlowStep label="배송완료" value={counts.DELIVERED} />
                        </div>
                        {/* 사이드 카운터 — 좌측 보더 */}
                        <div className="md:border-l md:border-[var(--color-border)] md:pl-6 space-y-2 text-sm flex flex-col justify-center">
                            <SideCount label="취소" value={counts.CANCELED} />
                            <SideCount label="교환" value={counts.EXCHANGE} />
                            <SideCount label="환불" value={counts.REFUNDED} />
                        </div>
                    </div>
                </div>

                {/* 최근 주문 내역 */}
                <div>
                    <div className="flex items-end justify-between mb-3">
                        <h2 className="text-base font-semibold text-[var(--color-fg)]">
                            최근 나의 주문내역{" "}
                            <span className="text-xs font-normal text-[var(--color-fg-muted)]">
                                (최근 1개월)
                            </span>
                        </h2>
                        <Link
                            href="/mypage/orders"
                            className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                        >
                            전체보기 →
                        </Link>
                    </div>
                    {orders.length === 0 ? (
                        <p className="border-t border-b border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-fg-subtle)]">
                            주문 내역이 없습니다.
                        </p>
                    ) : (
                        <ul className="border-t border-[var(--color-border)]">
                            {orders.slice(0, 5).map((o) => (
                                <li key={o.id} className="border-b border-[var(--color-border)]">
                                    <Link
                                        href={`/orders/${o.id}`}
                                        className="grid grid-cols-[56px_1fr_auto] md:grid-cols-[80px_1fr_110px_60px_100px_110px] items-center gap-3 px-2 py-4 hover:bg-[var(--color-bg-subtle)]"
                                    >
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--color-bg-subtle)] rounded-sm flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--color-fg)] line-clamp-1">
                                                {o.items[0]?.productName ?? "-"}
                                                {o.items.length > 1 && ` 외 ${o.items.length - 1}건`}
                                            </p>
                                            <p className="text-xs text-[var(--color-fg-muted)] mt-0.5 font-mono">
                                                #{o.orderNo}
                                            </p>
                                            <p className="md:hidden text-xs text-[var(--color-fg-muted)] mt-1">
                                                <span className="text-[var(--color-fg)] font-semibold">
                                                    {formatPrice(o.paidAmount)}
                                                </span>
                                                <span className="mx-1.5">·</span>
                                                {formatDate(o.orderedAt)}
                                            </p>
                                        </div>
                                        <div className="hidden md:block text-sm text-[var(--color-fg)] text-center">
                                            {formatPrice(o.paidAmount)}
                                        </div>
                                        <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">
                                            {o.items[0]?.quantity ?? 1}개
                                        </div>
                                        <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">
                                            {formatDate(o.orderedAt)}
                                        </div>
                                        <div className="flex justify-end">
                                            <StatusPill status={o.status} />
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* 모바일 전용 정보수정 */}
                <div className="md:hidden">
                    <Link
                        href="/mypage/settings"
                        className="block w-full text-center bg-[var(--color-fg)] text-white py-3 rounded-sm text-sm font-medium"
                    >
                        정보수정
                    </Link>
                </div>
            </main>
        </div>
    );
}

/* ============================================================
 * 보조 컴포넌트
 * ============================================================ */
function StatCard({
    label,
    icon,
    value,
}: {
    label: string;
    icon: React.ReactNode;
    value: string;
}) {
    return (
        <div className="rounded-md bg-[var(--color-bg-subtle)] p-4 md:p-5">
            <div className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
                <span>{label}</span>
                <span className="w-3.5 h-3.5 rounded-full border border-[var(--color-fg-subtle)] text-[9px] flex items-center justify-center text-[var(--color-fg-muted)]">
                    ?
                </span>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-base md:text-lg font-bold text-[var(--color-fg)]">
                <span>{icon}</span>
                <span>{value}</span>
            </div>
        </div>
    );
}

function FlowStep({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-center min-w-[60px]">
            <div
                className={`text-3xl md:text-4xl font-light ${
                    value > 0 ? "text-[var(--color-fg)]" : "text-[var(--color-fg)]"
                }`}
            >
                {value}
            </div>
            <div className="text-xs text-[var(--color-fg-muted)] mt-2">{label}</div>
        </div>
    );
}

function Arrow() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 stroke-[var(--color-fg-subtle)] fill-none"
            strokeWidth="1.5"
        >
            <path d="M9 6l6 6-6 6" />
        </svg>
    );
}

function SideCount({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[var(--color-fg-muted)] text-xs">{label}</span>
            <span className="text-[var(--color-fg)] text-sm">{value}</span>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const label = STATUS_LABEL[status] ?? status;
    const container = STATUS_CONTAINER[status] ?? "bg-[var(--color-bg-subtle)] text-[var(--color-fg)]";
    const dotColor = STATUS_DOT[status] ?? "#3b82f6";
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${container}`}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: dotColor }}
            />
            {label}
        </span>
    );
}
