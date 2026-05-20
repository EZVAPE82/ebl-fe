"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge, Button } from "@/components/ui";

type Order = {
    id: number; orderNo: string; status: string;
    paidAmount: number; orderedAt: string;
    items: { id: number; productName: string; quantity: number }[];
};

type CouponItem = {
    memberCouponId: number; name: string; discountType: string; discountValue: number;
    expiresAt: string; usedAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
    PENDING_PAYMENT: "입금대기",
    PAID: "결제완료",
    PREPARING: "배송준비중",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    REFUNDED: "환불완료",
};

const STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
    PENDING_PAYMENT: "warning",
    PAID: "info",
    PREPARING: "info",
    SHIPPING: "info",
    DELIVERED: "success",
    CANCELED: "neutral",
    REFUNDED: "danger",
};

export default function MyPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [balance, setBalance] = useState(0);
    const [coupons, setCoupons] = useState<CouponItem[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/mypage");
            return;
        }
        if (!user) return;
        (async () => {
            try {
                const [o, b, c] = await Promise.all([
                    api<{ content: Order[] }>("/api/v1/orders?size=10", { auth: true }),
                    api<{ balance: number }>("/api/v1/members/me/points/balance", { auth: true }),
                    api<{ content: CouponItem[] }>("/api/v1/members/me/coupons?size=50", { auth: true }),
                ]);
                setOrders(o.content);
                setBalance(b.balance);
                setCoupons(c.content);
            } catch { /* ignore */ }
        })();
    }, [user, authLoading, router]);

    if (authLoading || !user) return <div className="mx-auto max-w-screen-xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;

    const usableCoupons = coupons.filter(c => !c.usedAt && new Date(c.expiresAt) > new Date());

    // 주문 처리 현황 단계별 카운트
    const counts = {
        PENDING_PAYMENT: orders.filter(o => o.status === "PENDING_PAYMENT").length,
        PREPARING: orders.filter(o => ["PAID", "PREPARING"].includes(o.status)).length,
        SHIPPING: orders.filter(o => o.status === "SHIPPING").length,
        DELIVERED: orders.filter(o => o.status === "DELIVERED").length,
        CANCELED: orders.filter(o => o.status === "CANCELED").length,
        EXCHANGE: 0, // 백엔드 미지원
        REFUNDED: orders.filter(o => o.status === "REFUNDED").length,
    };

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-8 grid gap-8 md:grid-cols-[220px_1fr]">
            {/* ===== 좌측 사이드바 (PC) ===== */}
            <aside className="hidden md:block">
                <h1 className="text-2xl font-bold mb-6 text-[var(--color-fg)]">마이페이지</h1>
                <SideNav onLogout={async () => { await logout(); router.replace("/"); }} />
            </aside>

            {/* ===== 모바일 헤더 ===== */}
            <div className="md:hidden">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-semibold text-[var(--color-fg)]">마이페이지</h1>
                    <button
                        onClick={async () => { await logout(); router.replace("/"); }}
                        className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]"
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            {/* ===== 우측 메인 ===== */}
            <main className="space-y-6">
                {/* 환영 카드 */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center text-2xl text-[var(--color-fg-subtle)]">
                        👤
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base md:text-lg font-semibold text-[var(--color-fg)]">
                            안녕하세요. {user.name}님!
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                            회원 등급은 <span className="text-[var(--color-accent)] font-medium">일반</span>회원입니다.
                        </p>
                    </div>
                    <Link
                        href="/mypage/settings"
                        className="hidden md:inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                    >
                        정보수정
                    </Link>
                </div>

                {/* 3분할 통계 카드 */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <StatCard label="회원등급" icon="🏅" valueColor="text-[var(--color-accent)]" value="일반" hint="?" />
                    <StatCard label="사용가능한 쿠폰" icon="🎟️" valueColor="text-[var(--color-accent)]" value={`${usableCoupons.length}개`} hint="?" />
                    <StatCard label="사용가능한 적립금" icon="💰" valueColor="text-[var(--color-accent)]" value={`${balance.toLocaleString()}P`} hint="?" />
                </div>

                {/* 주문 처리 현황 */}
                <div>
                    <h2 className="text-base md:text-lg font-semibold mb-3 text-[var(--color-fg)]">
                        나의 주문처리 현황 <span className="text-xs font-normal text-[var(--color-fg-muted)]">(최근 1개월)</span>
                    </h2>
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                        {/* 4단계 흐름 */}
                        <div className="flex items-center justify-between">
                            <FlowStep label="입금대기" value={counts.PENDING_PAYMENT} />
                            <Arrow />
                            <FlowStep label="배송준비중" value={counts.PREPARING} />
                            <Arrow />
                            <FlowStep label="배송중" value={counts.SHIPPING} />
                            <Arrow />
                            <FlowStep label="배송완료" value={counts.DELIVERED} />
                        </div>
                        {/* 사이드 카운터 */}
                        <div className="md:border-l md:border-[var(--color-border)] md:pl-4 space-y-1.5 text-sm">
                            <SideCount label="취소" value={counts.CANCELED} />
                            <SideCount label="교환" value={counts.EXCHANGE} />
                            <SideCount label="환불" value={counts.REFUNDED} />
                        </div>
                    </div>
                </div>

                {/* 최근 주문 내역 */}
                <div>
                    <div className="flex items-end justify-between mb-3">
                        <h2 className="text-base md:text-lg font-semibold text-[var(--color-fg)]">
                            최근 나의 주문내역 <span className="text-xs font-normal text-[var(--color-fg-muted)]">(최근 1개월)</span>
                        </h2>
                        <Link href="#" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">전체보기 →</Link>
                    </div>
                    {orders.length === 0 ? (
                        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] py-12 text-center text-sm text-[var(--color-fg-subtle)]">
                            주문 내역이 없습니다.
                        </p>
                    ) : (
                        <ul className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden">
                            {orders.slice(0, 5).map(o => (
                                <li key={o.id}>
                                    <Link
                                        href={`/orders/${o.id}`}
                                        className="grid grid-cols-[64px_1fr_100px_60px_120px] md:grid-cols-[80px_1fr_120px_80px_140px_100px] items-center gap-3 px-4 py-4 hover:bg-[var(--color-bg-subtle)]"
                                    >
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--color-bg-subtle)] rounded-[var(--radius-sm)] flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--color-fg)] line-clamp-1">
                                                {o.items[0]?.productName ?? "-"}{o.items.length > 1 && ` 외 ${o.items.length - 1}건`}
                                            </p>
                                            <p className="text-xs text-[var(--color-fg-muted)] mt-0.5 font-mono">#{o.orderNo}</p>
                                        </div>
                                        <div className="text-sm font-semibold text-[var(--color-fg)]">{formatPrice(o.paidAmount)}</div>
                                        <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">
                                            {(o.items[0]?.quantity ?? 1)}개
                                        </div>
                                        <div className="text-xs text-[var(--color-fg-muted)]">{formatDate(o.orderedAt)}</div>
                                        <div className="text-right">
                                            <Badge size="sm" tone={STATUS_TONE[o.status] ?? "neutral"}>
                                                ● {STATUS_LABEL[o.status] ?? o.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* 모바일 전용 정보수정 + 로그아웃 */}
                <div className="md:hidden">
                    <Link href="/mypage/settings">
                        <Button variant="secondary" fullWidth>정보수정</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}

/* ============================================================
 * SideNav — 좌측 트리 메뉴 (시안 사이드바)
 * ============================================================ */
function SideNav({ onLogout }: { onLogout: () => void | Promise<void> }) {
    return (
        <nav className="text-sm space-y-5">
            <NavGroup icon="🛒" title="나의 쇼핑정보" items={[
                { label: "주문 내역", href: "#" },
                { label: "교환·반품·취소 내역", href: "#" },
            ]} />
            <NavGroup icon="📋" title="나의 참여내역" items={[
                { label: "1:1 문의", href: "#" },
                { label: "상품 Q&A", href: "#" },
                { label: "제품리뷰", href: "/reviews/write" },
            ]} />
            <NavGroup icon="🛡️" title="나의 정보 관리" items={[
                { label: "회원정보 수정", href: "/mypage/settings" },
                { label: "적립금", href: "#" },
                { label: "쿠폰", href: "#" },
                { label: "배송지 관리", href: "/mypage/addresses" },
                { label: "위시리스트", href: "/mypage/wishlist" },
            ]} />
            <button
                type="button"
                onClick={onLogout}
                className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] pt-2"
            >
                로그아웃
            </button>
        </nav>
    );
}

function NavGroup({ icon, title, items }: { icon: string; title: string; items: { label: string; href: string }[] }) {
    return (
        <div>
            <div className="flex items-center gap-2 text-[var(--color-fg)] font-medium pb-2 border-b border-[var(--color-border)]">
                <span>{icon}</span>
                <span>{title}</span>
            </div>
            <ul className="mt-2 space-y-1.5">
                {items.map(it => (
                    <li key={it.label}>
                        <Link
                            href={it.href}
                            className="block px-2 py-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-subtle)]"
                        >
                            {it.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ============================================================
 * Stat / Flow 컴포넌트
 * ============================================================ */
function StatCard({ label, icon, value, valueColor, hint }: { label: string; icon: string; value: string; valueColor?: string; hint?: string }) {
    return (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-4 md:p-5">
            <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
                <span>{label}</span>
                {hint && <span className="w-4 h-4 rounded-full bg-[var(--color-fg-subtle)]/30 text-[10px] flex items-center justify-center text-[var(--color-fg-muted)]">?</span>}
            </div>
            <div className={`mt-3 flex items-center gap-2 text-base md:text-lg font-bold ${valueColor ?? "text-[var(--color-fg)]"}`}>
                <span>{icon}</span>
                <span>{value}</span>
            </div>
        </div>
    );
}

function FlowStep({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex-1 text-center">
            <div className={`text-2xl md:text-3xl font-bold ${value > 0 ? "text-[var(--color-fg)]" : "text-[var(--color-fg-subtle)]"}`}>
                {value}
            </div>
            <div className="text-[11px] md:text-xs text-[var(--color-fg-muted)] mt-1">{label}</div>
        </div>
    );
}

function Arrow() {
    return <span className="text-[var(--color-fg-subtle)] text-lg md:text-xl">›</span>;
}

function SideCount({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex justify-between">
            <span className="text-[var(--color-fg-muted)]">{label}</span>
            <span className={value > 0 ? "text-[var(--color-fg)] font-medium" : "text-[var(--color-fg-subtle)]"}>{value}</span>
        </div>
    );
}
