"use client";

/**
 * 교환·반품·취소 내역 (Figma node 257:19883).
 *
 * 나의 주문 내역(/mypage/orders)과 구조·스타일 동일. 차이점:
 *  - 사이드바: "교환/반품/취소 내역" active (pathname)
 *  - 제목: "교환/반품/취소 내역" + (최근1달내역)
 *  - 탭: [주문내역조회] = inactive(border) / [취소/반품/교환내역] = active(#0072DD)
 *  - 목록: 취소/반품/교환 상태(CANCELED/REFUNDED/EXCHANGED)인 주문만 표시
 *  - 상태 칩 2톤: 취소완료/취소(검정 fill·흰 도트) / 교환·반품완료(연회색 fill·#999 도트)
 *
 * 데이터 보존: 주문 fetch(/api/v1/orders), 디테일 링크(/orders/{id}),
 * auth(useAuth + /login redirect) 그대로 유지. 주문 페이지와 동일한 소스를 필터링한다.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
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

// 백엔드 /api/v1/orders 응답(OrderView) — 목록 표시용으로 매핑한다.
type RawOrderItem = { productName: string; kind: string };
type RawOrder = {
    id: number; orderNo: string; status: string;
    totalAmount: number; orderedAt: string; items: RawOrderItem[];
};
function toSummary(o: RawOrder): OrderSummary {
    const paid = (o.items ?? []).filter(i => i.kind !== "FREE_GIFT");
    const items = paid.length ? paid : (o.items ?? []);
    return {
        id: o.id, orderNo: o.orderNo, status: o.status,
        totalAmount: o.totalAmount, createdAt: o.orderedAt,
        itemCount: items.length, productName: items[0]?.productName,
        thumbnailUrl: null,
    };
}

// 교환/반품/취소로 분류되는 상태들 — 이 페이지는 이 상태만 표시한다.
const RETURN_STATUSES = ["CANCELED", "REFUNDED", "EXCHANGED", "RETURNED"];

const STATUS_LABEL: Record<string, string> = {
    PENDING_PAYMENT: "결제대기",
    PAID: "결제완료",
    PREPARING: "배송준비중",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    REFUNDED: "반품완료",
    EXCHANGED: "교환완료",
    RETURNED: "반품완료",
};

export default function MypageReturnsPage() {
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
            router.replace("/login?redirect=/mypage/returns");
            return;
        }
        if (!user) return;
        setLoading(true);
        // 내 주문 목록 — 백엔드 정식 경로는 /api/v1/orders (OrderView). 표시용으로 매핑.
        api<PageResp<RawOrder>>(`/api/v1/orders?page=0&size=${pageSize}`, { auth: true })
            .then(r => setOrders((r.content ?? []).map(toSummary)))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [user, authLoading, pageSize, router]);

    // 취소/반품/교환 상태인 주문만 + 클라이언트 사이드 필터 (백엔드가 미지원)
    const filtered = useMemo(() => {
        return orders.filter(o => {
            if (!RETURN_STATUSES.includes(o.status)) return false;
            if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
            const t = new Date(o.createdAt).getTime();
            if (!Number.isNaN(new Date(startDate).getTime()) && t < new Date(startDate).getTime()) return false;
            if (!Number.isNaN(new Date(endDate).getTime()) && t > new Date(endDate).getTime() + 86400000) return false;
            return true;
        });
    }, [orders, statusFilter, startDate, endDate]);

    const orderTabCount = orders.filter(o => !RETURN_STATUSES.includes(o.status)).length;
    const returnTabCount = orders.filter(o => RETURN_STATUSES.includes(o.status)).length;

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 text-[14px] text-[#767676]">
                불러오는 중...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row gap-20">
            {/* 사이드바 — pathname 으로 "교환/반품/취소 내역" active */}
            <MyPageSideNav />

            {/* 메인 */}
            <main className="flex-1 lg:w-[1000px] flex flex-col gap-7">
                {/* 1) Header */}
                <header className="flex flex-col gap-5">
                    <div className="flex items-end gap-1">
                        <h1 className="text-[32px] font-bold text-[#000000]">교환/반품/취소 내역</h1>
                        <span className="text-[14px] text-[#767676]">(최근1달내역)</span>
                    </div>

                    {/* 탭 — returns 탭이 active */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/mypage/orders"
                            className="px-4 py-3 rounded-[4px] border border-[#DDDDDD] text-[14px] font-medium text-[#000000] hover:bg-[#F6F7FB] transition"
                        >
                            주문내역조회 ({orderTabCount})
                        </Link>
                        <span className="px-4 py-3 rounded-[4px] bg-[#0072DD] text-white text-[14px] font-medium">
                            취소/반품/교환내역 ({returnTabCount})
                        </span>
                    </div>
                </header>

                {/* 2) 필터 바 */}
                <div className="p-6 bg-[#F6F7FB] rounded-[10px] flex flex-wrap justify-center items-center gap-3">
                    {/* 주문처리상태 드롭다운 */}
                    <div className="relative w-[260px]">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full p-4 bg-white rounded-[4px] border border-[#DDDDDD] text-[14px] text-[#767676] appearance-none cursor-pointer focus:outline-none"
                        >
                            <option value="ALL">전체 주문처리상태</option>
                            <option value="CANCELED">취소완료</option>
                            <option value="REFUNDED">반품완료</option>
                            <option value="EXCHANGED">교환완료</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>

                    {/* 기간 드롭다운 */}
                    <div className="relative w-[150px]">
                        <select
                            value={periodFilter}
                            onChange={e => setPeriodFilter(e.target.value)}
                            className="w-full p-4 bg-white rounded-[4px] border border-[#DDDDDD] text-[14px] text-[#767676] appearance-none cursor-pointer focus:outline-none"
                        >
                            <option value="1M">1개월</option>
                            <option value="3M">3개월</option>
                            <option value="6M">6개월</option>
                            <option value="1Y">1년</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>

                    {/* 시작 일자 */}
                    <div className="relative w-[212px]">
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            placeholder="YYYY-MM-DD"
                            className="w-full p-4 bg-white rounded-[4px] border border-[#DDDDDD] text-[14px] text-[#767676] focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <CalendarIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>

                    {/* 종료 일자 */}
                    <div className="relative w-[212px]">
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            placeholder="YYYY-MM-DD"
                            className="w-full p-4 bg-white rounded-[4px] border border-[#DDDDDD] text-[14px] text-[#767676] focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <CalendarIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* 3) 페이지 사이즈 컨트롤 */}
                <div className="flex justify-end">
                    <div className="relative flex items-center">
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                            className="appearance-none bg-transparent pr-5 text-[14px] font-light text-[#505050] cursor-pointer focus:outline-none"
                        >
                            <option value={10}>10개씩보기</option>
                            <option value={20}>20개씩보기</option>
                            <option value={50}>50개씩보기</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* 4) 교환/반품/취소 목록 */}
                <div className="border-t border-[#222222] flex flex-col">
                    {loading ? (
                        <p className="py-16 text-center text-[14px] text-[#767676]">불러오는 중...</p>
                    ) : filtered.length === 0 ? (
                        <p className="py-20 text-center text-[14px] text-[#767676]">교환/반품/취소 내역이 없습니다.</p>
                    ) : (
                        filtered.map(o => (
                            <Link
                                key={o.id}
                                href={`/orders/${o.id}`}
                                className="py-3 border-b border-[#DDDDDD] flex flex-wrap justify-between items-center gap-3 hover:bg-[#F6F7FB] transition"
                            >
                                {/* LEFT: 썸네일 + 상품명/주문번호 */}
                                <div className="flex items-center gap-3">
                                    {o.thumbnailUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={o.thumbnailUrl}
                                            alt=""
                                            className="w-[90px] h-[108px] rounded-[4px] object-cover bg-[#F6F7FB]"
                                        />
                                    ) : (
                                        <div className="w-[90px] h-[108px] rounded-[4px] bg-[#F6F7FB] flex items-center justify-center">
                                            <div className="w-9 h-11 rounded-sm bg-[#DDDDDD]" />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <p className="text-[16px] font-medium text-[#000000] line-clamp-1">
                                            {o.productName ?? "상품아이템"}
                                            {o.itemCount > 1 && (
                                                <span className="text-[#767676]"> 외 {o.itemCount - 1}건</span>
                                            )}
                                        </p>
                                        <p className="text-[14px] font-light text-[#767676]">#{o.orderNo}</p>
                                    </div>
                                </div>

                                {/* 가격 */}
                                <div className="w-[184px] text-center text-[14px] font-medium text-[#000000]">
                                    {formatPrice(o.totalAmount)}
                                </div>

                                {/* 수량 */}
                                <div className="w-[184px] text-center text-[14px] text-[#767676]">
                                    {o.itemCount}개
                                </div>

                                {/* 날짜 */}
                                <div className="w-[184px] text-center text-[14px] text-[#767676]">
                                    {formatDateShort(o.createdAt)}
                                </div>

                                {/* 상태 pill */}
                                <StatusPill status={o.status} />
                            </Link>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

/* ============================================================
 * 보조 컴포넌트
 * ============================================================ */

/** 16px chevron-down */
function ChevronDown({ className }: { className?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
            <path d="M7 10l5 5 5-5" stroke="#767676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/** 20px calendar */
function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
            <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="#767676" strokeWidth="1.5" />
            <path d="M3.5 9h17M8 3v4M16 3v4" stroke="#767676" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/**
 * 상태 칩 — 교환/반품/취소 내역 시안 매핑(2톤):
 *  - 취소완료·취소(CANCELED): bg #222222 / text white / dot white
 *  - 교환완료·반품완료(EXCHANGED/REFUNDED/RETURNED): bg #F6F7FB / text #767676 / dot #999999
 */
function StatusPill({ status }: { status: string }) {
    const label = STATUS_LABEL[status] ?? status;

    let pillClass: string;
    let dotClass: string;
    if (status === "CANCELED") {
        pillClass = "bg-[#222222] text-white";
        dotClass = "bg-white";
    } else {
        // EXCHANGED / REFUNDED / RETURNED 등
        pillClass = "bg-[#F6F7FB] text-[#767676]";
        dotClass = "bg-[#999999]";
    }

    return (
        <span className={`px-[18px] py-2.5 rounded-full text-[14px] font-medium flex items-center gap-1 ${pillClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
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
