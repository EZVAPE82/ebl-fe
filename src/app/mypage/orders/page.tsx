"use client";

/**
 * 나의 주문 내역 (Figma node 37:12558).
 *
 * 레이아웃
 *  - 좌측: MyPageSideNav (PC)
 *  - 우측:
 *      h1 "나의 주문내역"  (최근1달내역)
 *      탭: [주문내역조회 (n)] [취소/반품/교환내역 (n)]
 *      필터바: 전체 주문처리상태 ▾ | 1개월 ▾ | 시작일자 | 종료일자
 *      페이지 사이즈 셀렉트 (우측 정렬, 10개씩보기)
 *      목록: 썸네일 | 상품명/주문번호 | 가격 | 수량 | 날짜 | 상태칩(pill, 파란점)
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { MyPageSideNav } from "@/components/mypage/SideNav";

type OrderSummary = {
    id: number;
    orderNo: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemCount: number;
    // optional — backend may populate
    productName?: string;
    thumbnailUrl?: string | null;
};

type PageResp<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
};

const STATUS_LABEL: Record<string, string> = {
    PENDING_PAYMENT: "결제대기",
    PAID: "결제완료",
    PREPARING: "배송준비중",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    REFUNDED: "환불완료",
    EXCHANGED: "교환완료",
};

export default function MypageOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [loading, setLoading] = useState(true);

    // 필터
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [periodFilter, setPeriodFilter] = useState("1M");
    const [startDate, setStartDate] = useState(defaultStart());
    const [endDate, setEndDate] = useState(defaultEnd());
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/mypage/orders");
            return;
        }
        if (!user) return;
        setLoading(true);
        api<PageResp<OrderSummary>>(`/api/v1/members/me/orders?page=0&size=${pageSize}`, { auth: true })
            .then(r => setOrders(r.content ?? []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [user, authLoading, pageSize, router]);

    // 클라이언트 사이드 필터 (백엔드가 미지원)
    const filtered = useMemo(() => {
        return orders.filter(o => {
            if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
            const t = new Date(o.createdAt).getTime();
            if (!Number.isNaN(new Date(startDate).getTime()) && t < new Date(startDate).getTime()) return false;
            if (!Number.isNaN(new Date(endDate).getTime()) && t > new Date(endDate).getTime() + 86400000) return false;
            return true;
        });
    }, [orders, statusFilter, startDate, endDate]);

    const orderTabCount = orders.filter(o => !["CANCELED", "REFUNDED", "EXCHANGED"].includes(o.status)).length;
    const returnTabCount = orders.filter(o => ["CANCELED", "REFUNDED", "EXCHANGED"].includes(o.status)).length;

    if (authLoading || !user) {
        return <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8 text-sm text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    return (
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            <MyPageSideNav />

            <div>
                {/* 페이지 타이틀 */}
                <div className="flex items-baseline gap-2 mb-5">
                    <h1 className="text-2xl md:text-[26px] font-bold text-[var(--color-fg)]">나의 주문내역</h1>
                    <span className="text-xs text-[var(--color-fg-muted)]">(최근1달내역)</span>
                </div>

                {/* 탭 */}
                <div className="flex items-center gap-2 mb-5">
                    <Tab active label={`주문내역조회 (${orderTabCount})`} href="/mypage/orders" />
                    <Tab label={`취소/반품/교환내역 (${returnTabCount})`} href="/mypage/returns" />
                </div>

                {/* 필터 바 */}
                <div className="rounded-md bg-[var(--color-bg-subtle)] px-4 py-3 mb-2 flex flex-wrap items-center gap-2">
                    <Select value={statusFilter} onChange={setStatusFilter} className="min-w-[180px]">
                        <option value="ALL">전체 주문처리상태</option>
                        <option value="PENDING_PAYMENT">결제대기</option>
                        <option value="PAID">결제완료</option>
                        <option value="PREPARING">배송준비중</option>
                        <option value="SHIPPING">배송중</option>
                        <option value="DELIVERED">배송완료</option>
                    </Select>
                    <Select value={periodFilter} onChange={setPeriodFilter} className="min-w-[90px]">
                        <option value="1M">1개월</option>
                        <option value="3M">3개월</option>
                        <option value="6M">6개월</option>
                        <option value="1Y">1년</option>
                    </Select>
                    <DateInput value={startDate} onChange={setStartDate} />
                    <DateInput value={endDate} onChange={setEndDate} />
                </div>

                {/* 페이지 사이즈 */}
                <div className="flex justify-end mb-2">
                    <select
                        value={pageSize}
                        onChange={e => setPageSize(Number(e.target.value))}
                        className="text-xs text-[var(--color-fg-muted)] bg-transparent px-2 py-1 focus:outline-none cursor-pointer"
                    >
                        <option value={10}>10개씩보기</option>
                        <option value={20}>20개씩보기</option>
                        <option value={50}>50개씩보기</option>
                    </select>
                </div>

                {/* 목록 */}
                <div className="border-t border-[var(--color-fg)]">
                    {loading ? (
                        <p className="py-16 text-center text-sm text-[var(--color-fg-subtle)]">불러오는 중...</p>
                    ) : filtered.length === 0 ? (
                        <p className="py-20 text-center text-sm text-[var(--color-fg-subtle)]">주문 내역이 없습니다.</p>
                    ) : (
                        <ul className="divide-y divide-[var(--color-border)]">
                            {filtered.map(o => (
                                <li key={o.id}>
                                    <Link
                                        href={`/orders/${o.id}`}
                                        className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[80px_1fr_110px_60px_100px_110px] items-center gap-4 px-2 py-4 hover:bg-[var(--color-bg-subtle)] transition"
                                    >
                                        {/* 썸네일 */}
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded bg-[var(--color-bg-subtle)] flex items-center justify-center overflow-hidden">
                                            {o.thumbnailUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={o.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-12 bg-[var(--color-fg-subtle)]/30 rounded-sm" />
                                            )}
                                        </div>

                                        {/* 상품명 / 주문번호 */}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--color-fg)] line-clamp-1">
                                                {o.productName ?? "상품아이템"}
                                                {o.itemCount > 1 && <span className="text-[var(--color-fg-muted)]"> 외 {o.itemCount - 1}건</span>}
                                            </p>
                                            <p className="text-xs text-[var(--color-fg-muted)] mt-1 font-mono">#{o.orderNo}</p>
                                            {/* 모바일 인라인 메타 */}
                                            <p className="md:hidden text-xs text-[var(--color-fg-muted)] mt-1">
                                                <span className="text-[var(--color-fg)] font-semibold">{formatPrice(o.totalAmount)}</span>
                                                <span className="mx-1.5">·</span>
                                                {o.itemCount}개
                                                <span className="mx-1.5">·</span>
                                                {formatDate(o.createdAt)}
                                            </p>
                                        </div>

                                        {/* PC 컬럼 */}
                                        <div className="hidden md:block text-sm font-medium text-[var(--color-fg)] text-center">{formatPrice(o.totalAmount)}</div>
                                        <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">{o.itemCount}개</div>
                                        <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">{formatDateShort(o.createdAt)}</div>

                                        {/* 상태 pill */}
                                        <div className="text-right">
                                            <StatusPill status={o.status} />
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
 * 보조 컴포넌트
 * ============================================================ */
function Tab({ label, href, active }: { label: string; href: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition ${
                active
                    ? "bg-[#DBEAFE] text-[#3b82f6]"
                    : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}

function Select({
    value, onChange, children, className,
}: {
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] ${className ?? ""}`}
        >
            {children}
        </select>
    );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <input
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
        />
    );
}

function StatusPill({ status }: { status: string }) {
    const label = STATUS_LABEL[status] ?? status;
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-medium px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            {label}
        </span>
    );
}

/* ============================================================
 * 유틸
 * ============================================================ */
function defaultStart(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
}
function defaultEnd(): string {
    return new Date().toISOString().slice(0, 10);
}
function formatDateShort(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = String(d.getFullYear()).slice(2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
}
