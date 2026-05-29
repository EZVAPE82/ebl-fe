"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";

/**
 * 쿠폰 페이지 — 시안 37:12625 매칭.
 * 시안: 좌측 SideNav + 우측 쿠폰 검색 + 쿠폰 리스트 (2 컬럼) + 페이지네이션.
 * MVP: 백엔드 /api/v1/members/me/coupons 호출 (이미 존재). placeholder 목데이터 + 시안 통이미지 fallback.
 */
type Coupon = {
    id: number;
    name: string;
    discountType: "PERCENT" | "FIXED";
    discountValue: number;
    minOrderAmount: number;
    expiresAt: string;
    status: "USABLE" | "USED" | "EXPIRED";
};

const MOCK_COUPONS: Coupon[] = [
    { id: 1, name: "신규 가입 축하 5,000원", discountType: "FIXED", discountValue: 5000, minOrderAmount: 30000, expiresAt: "2026-08-31T23:59:59", status: "USABLE" },
    { id: 2, name: "5월 정기 10% 할인", discountType: "PERCENT", discountValue: 10, minOrderAmount: 50000, expiresAt: "2026-05-31T23:59:59", status: "USABLE" },
    { id: 3, name: "ELFLIQ 액상 3,000원", discountType: "FIXED", discountValue: 3000, minOrderAmount: 20000, expiresAt: "2026-06-30T23:59:59", status: "USABLE" },
    { id: 4, name: "VIP 등급 전용 15%", discountType: "PERCENT", discountValue: 15, minOrderAmount: 100000, expiresAt: "2026-12-31T23:59:59", status: "USABLE" },
];

export default function CouponsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<Coupon[]>(MOCK_COUPONS);
    void setItems;

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!loading && !user) router.replace("/login?redirect=/mypage/coupons");
    }, [user, loading, router]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (loading || !user) {
        return <div className="mx-auto max-w-screen-2xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 md:py-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 md:gap-12">
            <MyPageSideNav />

            <section>
                <h2 className="text-xl md:text-2xl font-bold mb-6 text-[var(--color-fg)]">쿠폰</h2>

                <div className="flex items-center gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="쿠폰코드를 입력해주세요"
                        className="flex-1 px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
                    />
                    <button
                        type="button"
                        className="px-5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-fg)] text-[var(--color-bg)] text-sm font-medium hover:opacity-90"
                    >
                        쿠폰등록
                    </button>
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {items.map(c => (
                        <li key={c.id} className="relative rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-surface)] p-5">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 text-center pr-4 border-r border-dashed border-[var(--color-border-strong)]">
                                    <p className="text-2xl md:text-3xl font-bold text-[var(--color-accent)] tabular-nums">
                                        {c.discountType === "PERCENT" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}원`}
                                    </p>
                                    <p className="text-[10px] text-[var(--color-fg-muted)] mt-1">할인</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--color-fg)] line-clamp-2">{c.name}</p>
                                    <p className="text-xs text-[var(--color-fg-muted)] mt-1.5">최소 주문 {c.minOrderAmount.toLocaleString()}원</p>
                                    <p className="text-[11px] text-[var(--color-fg-subtle)] mt-1">~ {new Date(c.expiresAt).toLocaleDateString("ko-KR")}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                {items.length === 0 && (
                    <div className="rounded-[var(--radius-lg)] px-4 py-16 text-center">
                        <p className="text-sm text-[var(--color-fg-subtle)] mb-4">사용 가능한 쿠폰이 없습니다.</p>
                        <Link href="/" className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-5 py-3 text-sm font-medium hover:bg-[var(--color-brand-hover)]">쇼핑하러 가기</Link>
                    </div>
                )}

                {/* 페이지네이션 (MVP: 단일 페이지) */}
                {items.length > 0 && (
                    <div className="mt-6 flex items-center justify-center gap-1 text-xs text-[var(--color-fg-muted)]">
                        <span className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white font-medium">1</span>
                    </div>
                )}
            </section>
        </div>
    );
}
