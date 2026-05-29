"use client";

/**
 * 마이페이지 좌측 사이드바 (Figma 37:12411 / 37:12499 / 37:12534).
 *
 * 디자인 노트:
 * - 그룹 헤더: 아이콘(라인 스타일) + 제목 + 우측 chevron(▾)
 * - 그룹 헤더 하단 라인(border-bottom)으로 구분
 * - 항목들은 들여쓰기, 활성 항목은 옅은 회색 배경
 * - radius: 항목은 매우 작게(square 느낌) — Tailwind rounded-sm
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

type Group = {
    iconPath: string; // svg path d 값 또는 emoji 대신 일관된 라인 아이콘
    title: string;
    items: { label: string; href: string }[];
};

const GROUPS: Group[] = [
    {
        iconPath: "shopping",
        title: "나의 쇼핑정보",
        items: [
            { label: "나의 주문 내역", href: "/mypage/orders" },
            { label: "교환/반품/취소 내역", href: "/mypage/returns" },
        ],
    },
    {
        iconPath: "support",
        title: "고객센터",
        items: [
            { label: "공지사항", href: "#" },
            { label: "문의하기", href: "#" },
            { label: "자주묻는질문", href: "#" },
        ],
    },
    {
        iconPath: "shield",
        title: "나의 정보 관리",
        items: [
            { label: "회원정보 수정", href: "/mypage/settings" },
            { label: "배송지 관리", href: "/mypage/addresses" },
            { label: "적립금", href: "/mypage" },
            { label: "쿠폰", href: "/mypage/coupons" },
            { label: "위시리스트", href: "/mypage/wishlist" },
            { label: "회원등급", href: "/mypage/grade" },
        ],
    },
];

function GroupIcon({ name }: { name: string }) {
    // 라인 스타일 아이콘 (Figma 시안과 가까운 단순 형태)
    const common = "w-4 h-4 stroke-[var(--color-fg)] fill-none";
    if (name === "shopping") {
        return (
            <svg viewBox="0 0 24 24" className={common} strokeWidth="1.5">
                <path d="M3 6h2l2.4 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
                <circle cx="9" cy="20" r="1.2" />
                <circle cx="18" cy="20" r="1.2" />
            </svg>
        );
    }
    if (name === "support") {
        return (
            <svg viewBox="0 0 24 24" className={common} strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="1" />
                <path d="M3 9h18" />
                <path d="M8 13h5" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" className={common} strokeWidth="1.5">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
        </svg>
    );
}

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
            <nav className="text-sm">
                {GROUPS.map((g) => (
                    <div key={g.title} className="mb-5">
                        <div className="flex items-center justify-between text-[var(--color-fg)] font-medium pb-2.5 border-b border-[var(--color-border)]">
                            <span className="flex items-center gap-2">
                                <GroupIcon name={g.iconPath} />
                                <span className="text-sm">{g.title}</span>
                            </span>
                            <span className="text-[var(--color-fg-subtle)] text-xs">▾</span>
                        </div>
                        <ul className="mt-2.5 space-y-0.5">
                            {g.items.map((it) => {
                                const active = pathname === it.href && it.href !== "#";
                                return (
                                    <li key={it.label}>
                                        <Link
                                            href={it.href}
                                            className={`block pl-6 pr-2 py-1.5 text-[13px] rounded-sm transition ${
                                                active
                                                    ? "text-[var(--color-fg)] font-medium bg-[var(--color-bg-subtle)]"
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
