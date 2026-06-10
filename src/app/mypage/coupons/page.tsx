"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";

/**
 * 쿠폰 — Figma 시안 매칭.
 *  - 쿠폰등록: 회색 라운드 패널(#F6F7FB) 안에 코드 입력 + 파란 등록 버튼(#0072DD) + 안내문
 *  - 쿠폰리스트: 탭(보유쿠폰/사용쿠폰) + 회색 라운드 패널 안에 2열 쿠폰 카드(티켓 그라데이션 컷)
 *
 * 데이터/인증 보존:
 *  - 조회: GET /api/v1/members/me/coupons?size=50 (auth)
 *  - 등록: POST /api/v1/members/me/coupons/register { code } (auth)
 *  - 미인증 시 /login?redirect 로 이동
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

const COUPONS_ENDPOINT = "/api/v1/members/me/coupons?size=50";

function formatExpiry(iso: string): string {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
}

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
                const res = await api<{ content: CouponView[] }>(COUPONS_ENDPOINT, {
                    auth: true,
                });
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
            const res = await api<{ content: CouponView[] }>(COUPONS_ENDPOINT, {
                auth: true,
            });
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
            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 text-[#767676]">
                불러오는 중...
            </div>
        );
    }

    const visible = coupons.filter((c) =>
        tab === "available" ? !c.usedAt : !!c.usedAt
    );

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row gap-20">
            <MyPageSideNav />

            <main className="flex-1 lg:w-[1000px] flex flex-col gap-[60px]">
                {/* 1) 쿠폰등록 */}
                <section className="flex flex-col gap-5">
                    <h2 className="h-11 flex items-end text-[32px] font-bold text-[#000]">
                        쿠폰등록
                    </h2>
                    <div className="p-6 bg-[#F6F7FB] rounded-[10px] flex flex-col items-center gap-3">
                        <form onSubmit={register} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="쿠폰을 등록해주새요"
                                className="w-[480px] max-w-full p-4 bg-white rounded-[4px] border border-[#DDDDDD] text-[14px] outline-none placeholder:text-[#767676]"
                            />
                            <button
                                type="submit"
                                disabled={busy || !code.trim()}
                                className="w-[140px] p-4 bg-[#0072DD] rounded-[4px] text-center text-white text-[14px] font-medium disabled:opacity-40"
                            >
                                쿠폰등록
                            </button>
                        </form>
                        <p className="text-[14px] font-light text-[#767676] text-center">
                            반드시 쇼핑몰에서 발행한 쿠폰번호만 입력헤주세요(10~35자 일렬번호 &ldquo;~&rdquo;제외)
                        </p>
                    </div>
                </section>

                {/* 2) 쿠폰리스트 */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-[32px] font-bold text-[#000]">쿠폰리스트</h2>

                    {/* 탭 */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setTab("available")}
                            className={
                                tab === "available"
                                    ? "px-4 py-3 rounded-[4px] bg-[#0072DD] text-white text-[14px] font-medium"
                                    : "px-4 py-3 rounded-[4px] border border-[#DDDDDD] text-[14px] font-medium text-[#000]"
                            }
                        >
                            보유쿠폰
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("used")}
                            className={
                                tab === "used"
                                    ? "px-4 py-3 rounded-[4px] bg-[#0072DD] text-white text-[14px] font-medium"
                                    : "px-4 py-3 rounded-[4px] border border-[#DDDDDD] text-[14px] font-medium text-[#000]"
                            }
                        >
                            사용쿠폰
                        </button>
                    </div>

                    {/* 쿠폰 패널 */}
                    <div className="w-full p-[60px] bg-[#F6F7FB] rounded-[10px] flex flex-col items-center gap-12">
                        {visible.length === 0 ? (
                            <p className="text-[14px] text-[#767676] text-center">
                                {tab === "available"
                                    ? "보유한 쿠폰이 없습니다."
                                    : "사용한 쿠폰이 없습니다."}
                            </p>
                        ) : (
                            <div className="flex flex-wrap justify-center gap-x-[60px] gap-y-12">
                                {visible.map((c) => (
                                    <CouponCard
                                        key={c.memberCouponId}
                                        coupon={c}
                                        used={tab === "used"}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

function CouponCard({ coupon, used }: { coupon: CouponView; used: boolean }) {
    const amount =
        coupon.discountType === "PERCENT"
            ? `${coupon.discountValue}%`
            : `${coupon.discountValue.toLocaleString()}원`;

    return (
        <div className={`flex flex-col gap-3 ${used ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-[11px]">
                <div className="w-[182px] flex flex-col gap-10">
                    <div className="flex flex-col gap-1">
                        <p className="text-[16px] font-semibold text-[#000]">
                            {coupon.name}
                        </p>
                        <p className="text-[10px] text-[#767676]">
                            사용기한: {formatExpiry(coupon.expiresAt)}
                        </p>
                    </div>
                    <p className="text-[36px] font-bold leading-[46px] text-[#000]">
                        {amount}
                    </p>
                </div>
                <div
                    className="w-[60px] h-[152px] bg-[linear-gradient(131deg,#8CC9FF_0%,#31A2FF_50%,#0461CB_100%)]"
                    aria-hidden="true"
                />
            </div>
            {coupon.minOrderAmount > 0 && (
                <p className="text-[14px] font-light text-[#767676]">
                    *총 주문금액{coupon.minOrderAmount.toLocaleString()}원 초과 구매 시 사용가능
                </p>
            )}
        </div>
    );
}
