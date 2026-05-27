"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useRouter, usePathname } from "next/navigation";

const NAV: { href: string; label: string }[] = [
    { href: "/c/best",       label: "전체상품" },
    { href: "/c/disposable", label: "일회용기기" },
    { href: "/c/liquid",     label: "액상" },
    { href: "/c/devices",    label: "기기" },
    { href: "/c/accessory",  label: "맛·카트리지" },
    { href: "/c/accessory",  label: "악세사리" },
    { href: "/events",       label: "기획전" },
];

export function Header({ transparent = false }: { transparent?: boolean }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    // 경로 바뀌면 모바일 메뉴 자동 닫기 (Drawer 내 Link 클릭 후 새 페이지 진입 시
    // overlay 가 남는 버그 방지). setState in effect 규칙은 의도적으로 우회.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setMenuOpen(false); }, [pathname]);

    // 메뉴 열린 동안 body scroll lock
    useEffect(() => {
        if (menuOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    async function handleLogout() {
        await logout();
        setMenuOpen(false);
        router.push("/");
    }

    // 투명 모드 (홈 + 스크롤 top): 배경/보더 제거, 텍스트 화이트.
    // 솔리드 모드: 기존 흰 배경 + 보더.
    const headerCls = transparent
        ? "relative z-30 bg-transparent text-white"
        : "relative z-30 bg-[var(--color-surface)]/95 backdrop-blur border-b border-[var(--color-border)] text-[var(--color-fg)]";

    // 투명 모드에서는 내비/링크 톤도 화이트 기반으로 조정
    const navTone = transparent ? "text-white/80 hover:text-white" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]";
    const actionTone = transparent ? "text-white/80" : "text-[var(--color-fg-muted)]";
    const logoTone = transparent ? "text-white" : "text-[var(--color-fg)]";
    const searchBg = transparent
        ? "bg-white/10 border border-white/30 placeholder:text-white/60 text-white focus:bg-white/15"
        : "bg-[var(--color-bg-subtle)] border border-[var(--color-border)] placeholder:text-[var(--color-fg-subtle)] text-[var(--color-fg)]";

    return (
        <>
            <header className={headerCls}>
                <div className="mx-auto max-w-screen-xl flex items-center gap-3 md:gap-4 px-4 h-14">
                    {/* 햄버거 */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="메뉴 열기"
                        className={`${transparent ? "text-white" : "text-[var(--color-fg)]"} hover:opacity-70 -ml-1 p-1`}
                    >
                        <span className="block w-5 leading-none">
                            <span className="block h-0.5 bg-current mb-1.5" />
                            <span className="block h-0.5 bg-current mb-1.5" />
                            <span className="block h-0.5 bg-current" />
                        </span>
                    </button>

                    {/* 로고 */}
                    <Link href="/" className={`font-bold text-base md:text-lg tracking-[0.15em] ${logoTone}`}>
                        ELFBAR
                    </Link>

                    {/* PC 카테고리 메뉴 */}
                    <nav className={`hidden lg:flex items-center gap-5 text-sm ml-2 ${navTone}`}>
                        {NAV.map(n => (
                            <Link key={n.label} href={n.href} className="hover:opacity-100">
                                {n.label}
                            </Link>
                        ))}
                    </nav>

                    {/* 검색 (PC) */}
                    <form method="GET" action="/search" className="hidden md:flex items-center ml-auto">
                        <input
                            name="q"
                            type="search"
                            placeholder="검색"
                            aria-label="상품 검색"
                            className={`w-40 lg:w-56 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] ${searchBg}`}
                        />
                    </form>

                    {/* 우측 액션 (테마·검색·계정·장바구니) */}
                    <div className={`md:ml-2 ml-auto flex items-center gap-3 ${actionTone}`}>
                        <ThemeToggle />
                        <Link href="/search" aria-label="검색" className="md:hidden hover:opacity-100">🔍</Link>
                        {loading ? (
                            <span className="opacity-60">···</span>
                        ) : user ? (
                            <>
                                <Link href="/mypage" aria-label="마이페이지" className="hover:opacity-100">👤</Link>
                                <CartIcon />
                            </>
                        ) : (
                            <>
                                <Link href="/login" aria-label="로그인" className="hover:opacity-100">👤</Link>
                                <CartIcon />
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* 모바일·PC 공용 슬라이드 메뉴 (햄버거 클릭 시) */}
            {menuOpen && (
                <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-[var(--color-overlay)]"
                        onClick={() => setMenuOpen(false)}
                    />
                    {/* drawer */}
                    <aside className="absolute inset-y-0 left-0 w-72 bg-[var(--color-surface)] shadow-xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                            <span className="font-bold tracking-[0.15em] text-[var(--color-fg)]">ELFBAR</span>
                            <button
                                onClick={() => setMenuOpen(false)}
                                aria-label="메뉴 닫기"
                                className="text-2xl leading-none text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                            >×</button>
                        </div>

                        <nav className="flex-1 overflow-y-auto py-2">
                            <p className="px-5 pt-3 pb-2 text-[11px] uppercase tracking-widest text-[var(--color-fg-subtle)]">카테고리</p>
                            {NAV.map(n => (
                                <Link
                                    key={n.label}
                                    href={n.href}
                                    className="block px-5 py-3 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
                                >
                                    {n.label}
                                </Link>
                            ))}
                            <div className="my-3 border-t border-[var(--color-border)]" />
                            <p className="px-5 pt-1 pb-2 text-[11px] uppercase tracking-widest text-[var(--color-fg-subtle)]">고객지원</p>
                            <Link href="/notices" className="block px-5 py-3 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]">공지사항</Link>
                            <Link href="/faq" className="block px-5 py-3 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]">FAQ</Link>
                            <Link href="/guide" className="block px-5 py-3 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]">이용안내</Link>
                        </nav>

                        <div className="border-t border-[var(--color-border)] p-5 space-y-2 text-sm">
                            {user ? (
                                <>
                                    <Link href="/mypage" className="block text-[var(--color-fg)] hover:text-[var(--color-accent)]">{user.name} 님</Link>
                                    <button onClick={handleLogout} className="block text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]">로그아웃</button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="block text-[var(--color-fg)] hover:text-[var(--color-accent)]">로그인</Link>
                                    <Link href="/signup" className="block text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">회원가입</Link>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}

function ThemeToggle() {
    const { resolved, setTheme } = useTheme();
    // 단순 토글: 현재 dark 면 light 로, 그 외엔 dark 로 (system 은 자동으로 light/dark 해석됨)
    const next = resolved === "dark" ? "light" : "dark";
    return (
        <button
            type="button"
            onClick={() => setTheme(next)}
            aria-label={`${next === "dark" ? "다크" : "라이트"} 모드로 전환`}
            title={`현재: ${resolved === "dark" ? "다크" : "라이트"} (클릭하면 ${next === "dark" ? "다크" : "라이트"})`}
            className="hover:text-[var(--color-fg)] text-sm leading-none"
        >
            {resolved === "dark" ? "☀️" : "🌙"}
        </button>
    );
}

function CartIcon() {
    // 카트 카운트는 백엔드 호출 비용·CORS 고려해 미연결. 시각 자리만 (시안 12 뱃지 위치 매칭)
    return (
        <Link href="/cart" aria-label="장바구니" className="relative hover:text-[var(--color-fg)]">
            🛒
        </Link>
    );
}
