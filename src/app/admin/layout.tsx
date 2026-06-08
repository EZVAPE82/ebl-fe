"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { adminLogout, verifyAdminSession } from "@/lib/admin";

const NAV: { href: string; label: string }[] = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/products", label: "상품" },
    { href: "/admin/orders", label: "주문" },
    { href: "/admin/promotions", label: "프로모션" },
    { href: "/admin/campaigns", label: "캠페인" },
    { href: "/admin/coupons", label: "쿠폰" },
    { href: "/admin/referral", label: "추천인 보상" },
    { href: "/admin/legacy", label: "기존 회원" },
    { href: "/admin/foreign-verifications", label: "외국인 승인" },
    { href: "/admin/content", label: "콘텐츠" },
    { href: "/admin/settings", label: "정책 설정" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authed, setAuthed] = useState<boolean | null>(null);

    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (isLoginPage) {
            setAuthed(true); // 로그인 페이지는 게이팅 불필요
            return;
        }
        let cancelled = false;
        // 쿠키 기반 세션 확인 (GET /api/v1/admin/me) — 토큰을 JS 에 보관하지 않음.
        verifyAdminSession().then(ok => {
            if (cancelled) return;
            setAuthed(ok);
            if (!ok) router.replace("/admin/login");
        });
        return () => { cancelled = true; };
    }, [pathname, isLoginPage, router]);

    function logout() {
        void adminLogout();
    }

    if (isLoginPage) {
        return <div className="min-h-screen bg-[var(--color-bg-subtle)]">{children}</div>;
    }
    if (authed === null) {
        return <div className="min-h-screen flex items-center justify-center text-[var(--color-fg-muted)]">확인 중...</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-subtle)] flex">
            {/* Sidebar */}
            <aside className="w-56 bg-[var(--color-brand)] text-white flex flex-col">
                <div className="px-4 py-5 border-b border-white/10">
                    <Link href="/admin" className="font-bold text-base">엘프바 어드민</Link>
                </div>
                <nav className="flex-1 py-3">
                    {NAV.map(n => {
                        const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                className={`block px-4 py-2 text-sm transition ${
                                    active ? "bg-white/10 text-white border-l-2 border-[var(--color-danger)] font-medium"
                                          : "text-white/60 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                {n.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-3 border-t border-white/10">
                    <button onClick={logout} className="w-full text-xs text-white/60 hover:text-white py-1">로그아웃</button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-x-auto">
                <div className="px-6 py-5">{children}</div>
            </main>
        </div>
    );
}
