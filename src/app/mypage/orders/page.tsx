"use client";

/**
 * 나의 주문 내역 (Figma node 37:12558).
 *
 * 레이아웃 (Figma: sidebar 260 + main 1000, gap 80)
 *  - Outer: mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row gap-20
 *  - 좌측: MyPageSideNav (pathname 으로 "나의 주문 내역" active)
 *  - 우측 (flex-1 lg:w-[1000px]):
 *      Header: h1 "나의 주문내역" (최근1달내역) + 탭 [주문내역조회 (n)] [취소/반품/교환내역 (n)]
 *      필터바: 전체 주문처리상태 ▾ | 1개월 ▾ | 시작일자 | 종료일자
 *      페이지 사이즈 셀렉트 (우측 정렬, 10개씩보기)
 *      목록: 썸네일 | 상품명/주문번호 | 가격 | 수량 | 날짜 | 상태칩(pill, 도트)
 *
 * 데이터 보존: 주문 fetch(/api/v1/orders), 디테일 링크(/orders/{id}), 상태 매핑(STATUS_LABEL),
 * auth(useAuth + /login redirect) 그대로 유지. 레이아웃/스타일만 시안에 맞춰 재구성.
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
        // 내 주문 목록 — 백엔드 정식 경로는 /api/v1/orders (OrderView). 표시용으로 매핑.
        api<PageResp<RawOrder>>(`/api/v1/orders?page=0&size=${pageSize}`, { auth: true })
            .then(r => setOrders((r.content ?? []).map(toSummary)))
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
        return (
            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 text-[14px] text-[#767676]">
                불러오는 중...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row gap-20">
            {/* 사이드바 — pathname 으로 "나의 주문 내역" active */}
            <MyPageSideNav />

            {/* 메인 */}
            <main className="flex-1 lg:w-[1000px] flex flex-col gap-7">
                {/* 1) Header */}
                <header className="flex flex-col gap-5">
                    <div className="flex items-end gap-1">
                        <h1 className="text-[32px] font-bold text-[#000000]">나의 주문내역</h1>
                        <span className="text-[14px] text-[#767676]">(최근1달내역)</span>
                    </div>

                    {/* 탭 */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-4 py-3 rounded-[4px] bg-[#0072DD] text-white text-[14px] font-medium">
                            주문내역조회 ({orderTabCount})
                        </span>
                        <Link
                            href="/mypage/returns"
                            className="px-4 py-3 rounded-[4px] border border-[#DDDDDD] text-[14px] font-medium text-[#000000] hover:bg-[#F6F7FB] transition"
                        >
                            취소/반품/교환내역 ({returnTabCount})
                        </Link>
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
                            <option value="PENDING_PAYMENT">결제대기</option>
                            <option value="PAID">결제완료</option>
                            <option value="PREPARING">배송준비중</option>
                            <option value="SHIPPING">배송중</option>
                            <option value="DELIVERED">배송완료</option>
                            <option value="CANCELED">취소완료</option>
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

                {/* 4) 주문 목록 */}
                <div className="border-t border-[#222222] flex flex-col">
                    {loading ? (
                        <p className="py-16 text-center text-[14px] text-[#767676]">불러오는 중...</p>
                    ) : filtered.length === 0 ? (
                        <p className="py-20 text-center text-[14px] text-[#767676]">주문 내역이 없습니다.</p>
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
 * 상태 칩 — Figma 매핑:
 *  - 배송완료(DELIVERED): bg #E6F3FE / text #0072DD / dot #0742AC
 *  - 주문접수·결제완료·배송준비·배송중(그 외 진행상태): bg #F6F7FB / text #767676 / dot #767676
 *  - 취소완료·취소(CANCELED/REFUNDED/EXCHANGED): bg #222222 / text white / dot white
 */
function StatusPill({ status }: { status: string }) {
    const label = STATUS_LABEL[status] ?? status;

    let pillClass: string;
    let dotClass: string;
    if (status === "DELIVERED") {
        pillClass = "bg-[#E6F3FE] text-[#0072DD]";
        dotClass = "bg-[#0742AC]";
    } else if (["CANCELED", "REFUNDED", "EXCHANGED"].includes(status)) {
        pillClass = "bg-[#222222] text-white";
        dotClass = "bg-white";
    } else {
        pillClass = "bg-[#F6F7FB] text-[#767676]";
        dotClass = "bg-[#767676]";
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
