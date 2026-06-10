"use client";

/**
 * 마이페이지 좌측 사이드바 — Figma 마이페이지 spec.
 *
 * 레이아웃:
 * - 컨테이너: w-full lg:w-[260px] shrink-0 flex flex-col gap-5
 * - "마이페이지" 28px medium
 * - 3 nav 그룹 (container flex flex-col gap-7): 각 그룹 헤더(아이콘 24px + 라벨 + chevron 22px) + 서브 Link들
 * - 서브 항목: px-2 py-3 rounded-[4px] text-[14px] text-[#767676] hover:bg-[#F6F7FB] hover:text-[#222]
 *
 * 데이터 보존: useAuth/logout 유지(모바일 로그아웃). 라우트는 실제 존재하는 경로로 연결.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

type Group = {
    icon: "bag" | "headset" | "person";
    title: string;
    items: { label: string; href: string }[];
};

const GROUPS: Group[] = [
    {
        icon: "bag",
        title: "나의 쇼핑정보",
        items: [
            { label: "나의 주문 내역", href: "/mypage/orders" },
            { label: "교환/반품/취소 내역", href: "/mypage/returns" },
        ],
    },
    {
        icon: "headset",
        title: "고객센터",
        items: [
            { label: "공지사항", href: "/notices" },
            { label: "문의하기", href: "/faq" },
            { label: "자주묻는질문", href: "/faq" },
        ],
    },
    {
        icon: "person",
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

/** 24px 라인 아이콘 (stroke #222) */
function GroupIcon({ name }: { name: Group["icon"] }) {
    const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none" as const, "aria-hidden": true };
    if (name === "bag") {
        return (
            <svg {...common}>
                <path d="M6 7h12l-1 13H7L6 7Z" stroke="#222222" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="#222222" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        );
    }
    if (name === "headset") {
        return (
            <svg {...common}>
                <path d="M5 13v-1a7 7 0 0 1 14 0v1" stroke="#222222" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="3.5" y="12.5" width="3.5" height="6" rx="1.5" stroke="#222222" strokeWidth="1.5" />
                <rect x="17" y="12.5" width="3.5" height="6" rx="1.5" stroke="#222222" strokeWidth="1.5" />
                <path d="M19 18.5v.5a3 3 0 0 1-3 3h-2.5" stroke="#222222" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        );
    }
    return (
        <svg {...common}>
            <circle cx="12" cy="8" r="3.5" stroke="#222222" strokeWidth="1.5" />
            <path d="M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5" stroke="#222222" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/** 22px chevron-down */
function ChevronDown() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 10l5 5 5-5" stroke="#222222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function MyPageSideNav() {
    const pathname = usePathname();

    return (
        <aside className="w-full lg:w-[260px] shrink-0 flex flex-col gap-5">
            <h1 className="text-[28px] font-medium text-[#222222]">마이페이지</h1>

            <nav className="flex flex-col gap-7">
                {GROUPS.map((g) => (
                    <div key={g.title} className="flex flex-col gap-2">
                        <div className="py-3 flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <GroupIcon name={g.icon} />
                                <span className="text-[16px] font-medium text-[#000000]">{g.title}</span>
                            </span>
                            <ChevronDown />
                        </div>
                        {g.items.map((it) => {
                            const active = pathname === it.href;
                            return (
                                <Link
                                    key={it.label}
                                    href={it.href}
                                    className={`px-2 py-3 rounded-[4px] text-[14px] hover:bg-[#F6F7FB] hover:text-[#222222] ${
                                        active ? "bg-[#F6F7FB] text-[#222222]" : "text-[#767676]"
                                    }`}
                                >
                                    {it.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
