"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui";

type Tab = "orders" | "points" | "coupons" | "reviews";

type Order = {
    id: number; orderNo: string; status: string;
    paidAmount: number; orderedAt: string;
    items: { id: number; productName: string; quantity: number }[];
};

type PointTx = {
    id: number; type: string; amount: number; balanceAfter: number;
    memo: string | null; createdAt: string; expiresAt: string | null;
};

type CouponItem = {
    memberCouponId: number; name: string; discountType: string; discountValue: number;
    expiresAt: string; usedAt: string | null;
};

type Review = {
    id: number; productId: number; rating: number; content: string | null;
    hasPhoto: boolean; pointRewarded: boolean; createdAt: string;
};

export default function MyPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("orders");
    const [orders, setOrders] = useState<Order[]>([]);
    const [points, setPoints] = useState<PointTx[]>([]);
    const [balance, setBalance] = useState(0);
    const [coupons, setCoupons] = useState<CouponItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/mypage");
            return;
        }
        if (!user) return;
        (async () => {
            try {
                const [o, p, b, c, r] = await Promise.all([
                    api<{ content: Order[] }>("/api/v1/orders?size=10", { auth: true }),
                    api<{ content: PointTx[] }>("/api/v1/members/me/points?size=10", { auth: true }),
                    api<{ balance: number }>("/api/v1/members/me/points/balance", { auth: true }),
                    api<{ content: CouponItem[] }>("/api/v1/members/me/coupons?size=20", { auth: true }),
                    api<{ content: Review[] }>("/api/v1/members/me/reviews?size=10", { auth: true }),
                ]);
                setOrders(o.content);
                setPoints(p.content);
                setBalance(b.balance);
                setCoupons(c.content);
                setReviews(r.content);
            } catch { /* ignore */ }
        })();
    }, [user, authLoading, router]);

    if (authLoading || !user) return <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-fg)]">마이페이지</h1>
                    <p className="text-sm text-[var(--color-fg-muted)] mt-1">{user.name} 님 · {user.email}</p>
                </div>
                <button onClick={async () => { await logout(); router.replace("/"); }} className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]">
                    로그아웃
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                <Stat label="보유 적립금" value={formatPrice(balance)} />
                <Stat label="쿠폰" value={`${coupons.filter(c => !c.usedAt && new Date(c.expiresAt) > new Date()).length}장`} />
                <Stat label="주문" value={`${orders.length}건`} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6 text-center text-xs">
                <Link href="/mypage/wishlist" className="rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2.5 text-[var(--color-fg)] hover:border-[var(--color-border-strong)]">위시리스트</Link>
                <Link href="/mypage/addresses" className="rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2.5 text-[var(--color-fg)] hover:border-[var(--color-border-strong)]">배송지 관리</Link>
                <Link href="/mypage/settings" className="rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2.5 text-[var(--color-fg)] hover:border-[var(--color-border-strong)]">계정 설정</Link>
            </div>

            <div className="border-b border-[var(--color-border)] mb-4 flex gap-1 text-sm overflow-x-auto">
                <TabBtn k="orders" cur={tab} setTab={setTab}>주문내역</TabBtn>
                <TabBtn k="points" cur={tab} setTab={setTab}>적립금</TabBtn>
                <TabBtn k="coupons" cur={tab} setTab={setTab}>쿠폰</TabBtn>
                <TabBtn k="reviews" cur={tab} setTab={setTab}>내 리뷰</TabBtn>
            </div>

            {tab === "orders" && (
                <Section empty={orders.length === 0} emptyText="주문 내역이 없습니다.">
                    {orders.map(o => (
                        <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-border-strong)]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-[var(--color-fg-muted)]">{o.orderNo}</div>
                                    <div className="text-sm font-medium mt-0.5 text-[var(--color-fg)]">
                                        {o.items[0]?.productName ?? "-"} {o.items.length > 1 && `외 ${o.items.length - 1}건`}
                                    </div>
                                    <div className="text-xs text-[var(--color-fg-muted)] mt-1">{formatDate(o.orderedAt)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-[var(--color-fg)]">{formatPrice(o.paidAmount)}</div>
                                    <Badge size="sm" tone="neutral" className="mt-1">{o.status}</Badge>
                                </div>
                            </div>
                        </Link>
                    ))}
                </Section>
            )}

            {tab === "points" && (
                <Section empty={points.length === 0} emptyText="적립금 내역이 없습니다.">
                    {points.map(p => (
                        <div key={p.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex justify-between text-sm">
                            <div>
                                <div className="font-medium text-[var(--color-fg)]">{p.memo ?? p.type}</div>
                                <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">{formatDate(p.createdAt)}</div>
                            </div>
                            <div className="text-right">
                                <div className={p.amount > 0 ? "text-[var(--color-success)] font-semibold" : "text-[var(--color-fg)]"}>
                                    {p.amount > 0 ? "+" : ""}{formatPrice(p.amount)}
                                </div>
                                <div className="text-xs text-[var(--color-fg-subtle)]">잔액 {formatPrice(p.balanceAfter)}</div>
                            </div>
                        </div>
                    ))}
                </Section>
            )}

            {tab === "coupons" && (
                <Section empty={coupons.length === 0} emptyText="보유 쿠폰이 없습니다.">
                    {coupons.map(c => {
                        const expired = new Date(c.expiresAt) <= new Date();
                        const used = !!c.usedAt;
                        const dimmed = expired || used;
                        return (
                            <div key={c.memberCouponId} className={`rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-4 flex justify-between ${dimmed ? "border-[var(--color-border)] opacity-60" : "border-[var(--color-border-strong)]"}`}>
                                <div>
                                    <div className="font-medium text-sm text-[var(--color-fg)]">{c.name}</div>
                                    <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                                        ~{formatDate(c.expiresAt)} {used && "· 사용함"} {expired && !used && "· 만료"}
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-[var(--color-fg)]">
                                    {c.discountType === "AMOUNT" ? formatPrice(c.discountValue) : `${c.discountValue}%`}
                                </div>
                            </div>
                        );
                    })}
                </Section>
            )}

            {tab === "reviews" && (
                <Section empty={reviews.length === 0} emptyText="작성한 리뷰가 없습니다.">
                    {reviews.map(r => (
                        <Link key={r.id} href={`/p/${r.productId}`} className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-border-strong)]">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--color-fg)]">★ {r.rating}</span>
                                <span className="text-xs text-[var(--color-fg-muted)]">{formatDate(r.createdAt)}</span>
                            </div>
                            {r.content && <p className="mt-1 text-sm text-[var(--color-fg)] line-clamp-2">{r.content}</p>}
                            <div className="mt-1 flex gap-2 text-[11px] text-[var(--color-fg-muted)]">
                                {r.hasPhoto && <span>📷 포토</span>}
                                {r.pointRewarded && <span className="text-[var(--color-success)]">적립 완료</span>}
                            </div>
                        </Link>
                    ))}
                </Section>
            )}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] py-4 px-3">
            <div className="text-xs text-[var(--color-fg-muted)]">{label}</div>
            <div className="text-sm md:text-base font-bold mt-0.5 text-[var(--color-fg)]">{value}</div>
        </div>
    );
}

function TabBtn({ k, cur, setTab, children }: { k: Tab; cur: Tab; setTab: (t: Tab) => void; children: React.ReactNode }) {
    const active = k === cur;
    return (
        <button
            onClick={() => setTab(k)}
            className={`px-3 py-2 border-b-2 whitespace-nowrap transition ${
                active
                    ? "border-[var(--color-fg)] text-[var(--color-fg)] font-semibold"
                    : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
        >{children}</button>
    );
}

function Section({ empty, emptyText, children }: { empty: boolean; emptyText: string; children: React.ReactNode }) {
    if (empty) return <p className="text-sm text-[var(--color-fg-subtle)] text-center py-12">{emptyText}</p>;
    return <div className="space-y-2">{children}</div>;
}
