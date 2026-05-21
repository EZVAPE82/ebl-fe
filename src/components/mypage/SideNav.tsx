"use client";

/**
 * 마이페이지 좌측 사이드바 (시안 37:12411 / 37:12499 / 37:12534 공통).
 * /mypage, /mypage/settings, /mypage/addresses 등에서 재사용.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const GROUPS: { icon: string; title: string; items: { label: string; href: string }[] }[] = [
    {
        icon: "🛒",
        title: "나의 쇼핑정보",
        items: [
            { label: "주문 내역",           href: "/mypage" },
            { label: "교환·반품·취소 내역", href: "/mypage" },
        ],
    },
    {
        icon: "📋",
        title: "나의 참여내역",
        items: [
            { label: "1:1 문의",   href: "#" },
            { label: "상품 Q&A",  href: "#" },
            { label: "제품리뷰",   href: "/reviews/write" },
        ],
    },
    {
        icon: "🛡️",
        title: "나의 정보 관리",
        items: [
            { label: "회원정보 수정", href: "/mypage/settings" },
            { label: "적립금",        href: "/mypage" },
            { label: "쿠폰",          href: "/mypage" },
            { label: "배송지 관리",   href: "/mypage/addresses" },
            { label: "위시리스트",     href: "/mypage/wishlist" },
        ],
    },
];

export function MyPageSideNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    async function handleLogout() {
        await logout();
        router.replace("/");
    }

    return (
        <aside className="hidden md:block">
            <h1 className="text-2xl font-bold mb-6 text-[var(--color-fg)]">마이페이지</h1>
            <nav className="text-sm space-y-5">
                {GROUPS.map(g => (
                    <div key={g.title}>
                        <div className="flex items-center gap-2 text-[var(--color-fg)] font-medium pb-2 border-b border-[var(--color-border)]">
                            <span>{g.icon}</span>
                            <span>{g.title}</span>
                        </div>
                        <ul className="mt-2 space-y-1.5">
                            {g.items.map(it => {
                                const active = pathname === it.href;
                                return (
                                    <li key={it.label}>
                                        <Link
                                            href={it.href}
                                            className={`block px-2 py-1 text-xs rounded-[var(--radius-sm)] transition ${
                                                active
                                                    ? "text-[var(--color-fg)] font-semibold bg-[var(--color-bg-subtle)]"
                                                    : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
                                            }`}
                                        >
                                            {it.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] pt-2"
                >
                    로그아웃
                </button>
            </nav>
        </aside>
    );
}
