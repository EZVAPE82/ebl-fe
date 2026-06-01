"use client";

/**
 * 교환·반품·취소 내역 (Figma node 257:19883).
 *
 * 주문내역 페이지와 거의 동일하나:
 *  - 두 번째 탭이 active (검정 pill)
 *  - 상태 칩이 일부는 검정(처리완료) / 일부는 회색(접수/처리중) 두 톤 사용
 *
 * 반품 전용 API가 아직 없어 mock 데이터를 사용한다.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { MyPageSideNav } from "@/components/mypage/SideNav";

type ReturnRow = {
    id: number;
    orderNo: string;
    productName: string;
    productAmount: number;
    quantity: number;
    requestedAt: string;
    /** REQUESTED | IN_PROGRESS | COMPLETED | REJECTED */
    status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
    /** "교환" | "반품" | "취소" */
    kind: "교환" | "반품" | "취소";
};

// === Mock — 반품/교환 전용 API 부재 시 표시용 ===
const MOCK: ReturnRow[] = [
    { id: 1, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "COMPLETED", kind: "반품" },
    { id: 2, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "COMPLETED", kind: "취소" },
    { id: 3, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "COMPLETED", kind: "교환" },
    { id: 4, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "COMPLETED", kind: "반품" },
    { id: 5, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "IN_PROGRESS", kind: "반품" },
    { id: 6, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "IN_PROGRESS", kind: "취소" },
    { id: 7, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "REQUESTED", kind: "교환" },
    { id: 8, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "REQUESTED", kind: "반품" },
    { id: 9, orderNo: "2021156598898", productName: "상품아이템", productAmount: 25000, quantity: 1, requestedAt: "2025-02-26", status: "REQUESTED", kind: "반품" },
];

export default function MypageReturnsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [rows] = useState<ReturnRow[]>(MOCK);

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [periodFilter, setPeriodFilter] = useState("1M");
    const [startDate, setStartDate] = useState(defaultStart());
    const [endDate, setEndDate] = useState(defaultEnd());
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/login?redirect=/mypage/returns");
    }, [user, authLoading, router]);

    const filtered = useMemo(
        () => rows.filter(r => statusFilter === "ALL" || r.status === statusFilter),
        [rows, statusFilter]
    );

    const orderTabCount = 0; // 다른 페이지에서 채워지므로 0 표시
    const returnTabCount = rows.length;

    if (authLoading || !user) {
        return <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8 text-sm text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    return (
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            <MyPageSideNav />

            <div>
                <div className="flex items-baseline gap-2 mb-5">
                    <h1 className="text-2xl md:text-[26px] font-bold text-[var(--color-fg)]">교환/반품/취소 내역</h1>
                    <span className="text-xs text-[var(--color-fg-muted)]">(최근1달내역)</span>
                </div>

                <div className="flex items-center gap-2 mb-5">
                    <Tab label={`주문내역조회 (${orderTabCount})`} href="/mypage/orders" />
                    <Tab active label={`취소/반품/교환내역 (${returnTabCount})`} href="/mypage/returns" />
                </div>

                <div className="rounded-md bg-[var(--color-bg-subtle)] px-4 py-3 mb-2 flex flex-wrap items-center gap-2">
                    <Select value={statusFilter} onChange={setStatusFilter} className="min-w-[180px]">
                        <option value="ALL">전체 처리상태</option>
                        <option value="REQUESTED">신청접수</option>
                        <option value="IN_PROGRESS">처리중</option>
                        <option value="COMPLETED">처리완료</option>
                        <option value="REJECTED">반려</option>
                    </Select>
                    <Select value={periodFilter} onChange={setPeriodFilter} className="min-w-[90px]">
                        <option value="1M">1개월</option>
                        <option value="3M">3개월</option>
                        <option value="6M">6개월</option>
                    </Select>
                    <DateInput value={startDate} onChange={setStartDate} />
                    <DateInput value={endDate} onChange={setEndDate} />
                </div>

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

                <div className="border-t border-[var(--color-fg)]">
                    {filtered.length === 0 ? (
                        <p className="py-20 text-center text-sm text-[var(--color-fg-subtle)]">처리 내역이 없습니다.</p>
                    ) : (
                        <ul className="divide-y divide-[var(--color-border)]">
                            {filtered.map(r => (
                                <li key={r.id}>
                                    <Link
                                        href={`/orders/${r.id}`}
                                        className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[80px_1fr_110px_60px_100px_110px] items-center gap-4 px-2 py-4 hover:bg-[var(--color-bg-subtle)] transition"
                                    >
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded bg-[var(--color-bg-subtle)] flex items-center justify-center">
                                            <div className="w-10 h-12 bg-[var(--color-fg-subtle)]/30 rounded-sm" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--color-fg)] line-clamp-1">{r.productName}</p>
                                            <p className="text-xs text-[var(--color-fg-muted)] mt-1 font-mono">#{r.orderNo}</p>
                                            <p className="md:hidden text-xs text-[var(--color-fg-muted)] mt-1">
                                                <span className="text-[var(--color-fg)] font-semibold">{formatPrice(r.productAmount)}</span>
                                                <span className="mx-1.5">·</span>{r.quantity}개
                                                <span className="mx-1.5">·</span>{r.requestedAt}
                                            </p>
                                        </div>

                                        <div className="hidden md:block text-sm font-medium text-[var(--color-fg)] text-center">{formatPrice(r.productAmount)}</div>
                                        <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">{r.quantity}개</div>
                                        <div className="hidden md:block text-xs text-[var(--color-fg-muted)] text-center">{shortDate(r.requestedAt)}</div>

                                        <div className="text-right">
                                            <ReturnPill status={r.status} kind={r.kind} />
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
                    ? "bg-[#3b82f6] text-white"
                    : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}

function Select({ value, onChange, children, className }: {
    value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string;
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

/**
 * Figma 시안 매칭:
 *  - 취소완료(kind=취소): 검정 fill + 흰 텍스트, 도트 없음
 *  - 교환완료/반품완료(kind=교환/반품): 연회색 fill + 회색 도트 + 회색 텍스트
 *  - 진행중/접수/반려는 회색 톤 유지
 */
function ReturnPill({ status, kind }: { status: ReturnRow["status"]; kind: ReturnRow["kind"] }) {
    const label =
        status === "COMPLETED" ? `${kind}완료`
        : status === "IN_PROGRESS" ? `${kind}처리중`
        : status === "REJECTED" ? `${kind}반려`
        : `${kind}접수`;

    // 시안: 취소는 강한 검정, 교환/반품은 부드러운 회색 + 도트
    const isCancelDone = status === "COMPLETED" && kind === "취소";

    if (isCancelDone) {
        return (
            <span className="inline-flex items-center rounded-full text-xs font-medium px-3 py-1 bg-[var(--color-fg)] text-[var(--color-bg)]">
                {label}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium px-3 py-1 bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-fg-muted)]" />
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
function shortDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = String(d.getFullYear()).slice(2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
}
