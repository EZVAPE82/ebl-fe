"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";

/**
 * 쿠폰 — Figma 시안 매칭.
 *  - 상단: "쿠폰등록" — 회색 라운드 패널 안에 코드 입력 + 파란 등록 버튼 + 안내문
 *  - 하단: "쿠폰리스트" — 회색 라운드 패널 안에 탭(보유쿠폰/사용쿠폰) + 2열 카드 그리드
 *  - 카드: 흰색 라운드, 우측에 파란 톱니(티켓 컷) 장식
 */

type CouponView = {
    memberCouponId: number;
    couponId: number;
    name: string;
    discountType: "AMOUNT" | "PERCENT";
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number;
    expiresAt: string;
    usedAt: string | null;
};

export default function CouponsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [coupons, setCoupons] = useState<CouponView[]>([]);
    const [tab, setTab] = useState<"available" | "used">("available");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/mypage/coupons");
            return;
        }
        if (!user) return;
        (async () => {
            try {
                const res = await api<{ content: CouponView[] }>(
                    "/api/v1/members/me/coupons?size=50",
                    { auth: true }
                );
                setCoupons(res.content ?? []);
            } catch {
                setCoupons([]);
            }
        })();
    }, [user, authLoading, router]);

    async function register(e: React.FormEvent) {
        e.preventDefault();
        if (!code.trim()) return;
        setBusy(true);
        try {
            await api("/api/v1/members/me/coupons/register", {
                method: "POST",
                auth: true,
                body: JSON.stringify({ code }),
            });
            setCode("");
            const res = await api<{ content: CouponView[] }>(
                "/api/v1/members/me/coupons?size=50",
                { auth: true }
            );
            setCoupons(res.content ?? []);
            alert("쿠폰이 등록되었습니다.");
        } catch {
            alert("쿠폰 등록에 실패했습니다. 코드를 확인해주세요.");
        } finally {
            setBusy(false);
        }
    }

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-10 text-[var(--color-fg-subtle)]">
                불러오는 중...
            </div>
        );
    }

    const visible = coupons.filter(c =>
        tab === "available" ? !c.usedAt : !!c.usedAt
    );

    return (
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            <MyPageSideNav />

            <div className="space-y-10">
                {/* 쿠폰등록 */}
                <section>
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-fg)] mb-4">
                        쿠폰등록
                    </h2>
                    <div className="rounded-xl bg-[var(--color-bg-subtle)] px-6 py-7">
                        <form onSubmit={register} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="쿠폰을 등록해주세요"
                                className="flex-1 px-4 py-2.5 rounded-md bg-white border border-transparent text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[#3b82f6]"
                            />
                            <button
                                type="submit"
                                disabled={busy || !code.trim()}
                                className="px-6 py-2.5 rounded-md bg-[#3b82f6] text-white text-sm font-medium hover:bg-[#2563eb] disabled:opacity-40 whitespace-nowrap"
                            >
                                쿠폰등록
                            </button>
                        </form>
                        <p className="mt-3 text-center text-xs text-[var(--color-fg-muted)]">
                            반드시 쇼핑몰에서 발행한 쿠폰번호 입력해주세요(10~35자 일렬번호 &quot;-&quot;제외)
                        </p>
                    </div>
                </section>

                {/* 쿠폰리스트 */}
                <section>
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-fg)] mb-4">
                        쿠폰리스트
                    </h2>

                    {/* 탭 */}
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setTab("available")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                                tab === "available"
                                    ? "bg-[#3b82f6] text-white"
                                    : "bg-white border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                            }`}
                        >
                            보유쿠폰
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("used")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                                tab === "used"
                                    ? "bg-[#3b82f6] text-white"
                                    : "bg-white border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                            }`}
                        >
                            사용쿠폰
                        </button>
                    </div>

                    {/* 카드 그리드 */}
                    <div className="rounded-xl bg-[var(--color-bg-subtle)] px-6 py-7">
                        {visible.length === 0 ? (
                            <p className="text-center text-sm text-[var(--color-fg-subtle)] py-12">
                                {tab === "available" ? "보유한 쿠폰이 없습니다." : "사용한 쿠폰이 없습니다."}
                            </p>
                        ) : (
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {visible.map(c => (
                                    <CouponCard key={c.memberCouponId} coupon={c} />
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* 페이지네이션 */}
                {visible.length > 0 && (
                    <nav className="flex items-center justify-center gap-1 text-sm text-[var(--color-fg-muted)]">
                        <button
                            className="w-8 h-8 rounded-md bg-[#3b82f6] text-white font-medium"
                            aria-current="page"
                        >
                            1
                        </button>
                        {[2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                className="w-8 h-8 rounded-md hover:bg-[var(--color-bg-subtle)]"
                            >
                                {n}
                            </button>
                        ))}
                        <span className="px-1">...</span>
                        <button className="w-8 h-8 rounded-md hover:bg-[var(--color-bg-subtle)]">
                            30
                        </button>
                        <button className="w-8 h-8 rounded-md hover:bg-[var(--color-bg-subtle)]">
                            &gt;
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
}

function CouponCard({ coupon }: { coupon: CouponView }) {
    const value =
        coupon.discountType === "PERCENT"
            ? `${coupon.discountValue}%`
            : `${coupon.discountValue.toLocaleString()}원`;
    return (
        <li className="relative rounded-lg bg-white overflow-hidden">
            {/* 우측 톱니 장식 (티켓 컷) */}
            <div
                className="absolute right-0 top-0 bottom-0 w-3 bg-[#3b82f6]"
                style={{
                    maskImage:
                        "radial-gradient(circle at 0 6px, transparent 4px, black 4.5px)",
                    maskSize: "100% 12px",
                    maskRepeat: "repeat-y",
                    WebkitMaskImage:
                        "radial-gradient(circle at 0 6px, transparent 4px, black 4.5px)",
                    WebkitMaskSize: "100% 12px",
                    WebkitMaskRepeat: "repeat-y",
                }}
                aria-hidden="true"
            />
            <div className="pr-8 pl-6 py-6 text-center">
                <p className="text-sm font-medium text-[var(--color-fg)] truncate">
                    {coupon.name || "회원가입시 3천원 쿠폰"}
                </p>
                <p className="mt-1 text-[11px] text-[var(--color-fg-muted)]">
                    사용기한: 발급일로부터 7일 이내
                </p>
                <p className="mt-5 text-3xl md:text-4xl font-bold text-[var(--color-fg)] tabular-nums">
                    {value}
                </p>
                <p className="mt-5 text-[11px] text-[var(--color-fg-subtle)]">
                    *총 주문금액
                    {coupon.minOrderAmount > 0
                        ? `${coupon.minOrderAmount.toLocaleString()}원`
                        : "50,000원"}{" "}
                    초과 구매 시 사용가능
                </p>
            </div>
        </li>
    );
}
