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

    // 투명 모드 (홈 only): hero 그라데이션 그대로 비치고 텍스트만 흰색. 보더 X, 배경 X.
    // 솔리드 모드: 기존 흰 배경 + 보더.
    const headerCls = transparent
        ? "relative z-30 bg-transparent text-white"
        : "relative z-30 bg-[var(--color-surface)]/95 backdrop-blur border-b border-[var(--color-border)] text-[var(--color-fg)]";

    // 투명 모드에서는 내비/링크 톤도 화이트 기반으로 조정
    const navTone = transparent ? "text-white/90 hover:text-white" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]";
    const actionTone = transparent ? "text-white" : "text-[var(--color-fg-muted)]";
    const logoTone = transparent ? "text-white" : "text-[var(--color-fg)]";

    return (
        <>
            <header className={headerCls}>
                <div className="mx-auto max-w-screen-2xl flex items-center gap-3 md:gap-4 px-4 h-14">
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

                    {/* PC 카테고리 메뉴 — 가운데 정렬 (시안 매칭) */}
                    <nav className={`hidden lg:flex flex-1 items-center justify-center gap-5 text-sm ${navTone}`}>
                        {NAV.map(n => (
                            <Link key={n.label} href={n.href} className="hover:opacity-100">
                                {n.label}
                            </Link>
                        ))}
                    </nav>

                    {/* 우측 액션 — 시안 매칭: 🔍 검색 / 👤 계정 / 🛍️ 카트(뱃지)
                        검색은 input 박스 대신 아이콘 → /search 로 이동 (시안 11:797 매칭).
                        다크 토글은 사이드 메뉴 안으로 이동 (시안 헤더엔 없음). */}
                    <div className={`ml-auto flex items-center gap-3.5 md:gap-4 ${actionTone}`}>
                        <SearchIcon transparent={transparent} />
                        {loading ? (
                            <span className="opacity-60">···</span>
                        ) : user ? (
                            <>
                                <UserIcon transparent={transparent} href="/mypage" label="마이페이지" />
                                <CartIcon transparent={transparent} />
                            </>
                        ) : (
                            <>
                                <UserIcon transparent={transparent} href="/login" label="로그인" />
                                <CartIcon transparent={transparent} />
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
                            <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
                                <DrawerThemeToggle />
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}

/* ===== Drawer 내부 다크/라이트 토글 (시안 헤더엔 없으니 메뉴 안으로) ===== */
function DrawerThemeToggle() {
    const { resolved, setTheme } = useTheme();
    const next = resolved === "dark" ? "light" : "dark";
    return (
        <button
            type="button"
            onClick={() => setTheme(next)}
            aria-label={`${next === "dark" ? "다크" : "라이트"} 모드로 전환`}
            className="w-full flex items-center justify-between text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
        >
            <span>{resolved === "dark" ? "라이트 모드" : "다크 모드"}</span>
            <span aria-hidden="true">{resolved === "dark" ? "☀️" : "🌙"}</span>
        </button>
    );
}

/* ===== 헤더 우측 아이콘들 — SVG (시안 11:797 매칭) ===== */
function SearchIcon({ transparent }: { transparent?: boolean }) {
    return (
        <Link
            href="/search"
            aria-label="검색"
            className={`hover:opacity-100 ${transparent ? "text-white" : "text-[var(--color-fg)]"} hover:opacity-80 transition`}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        </Link>
    );
}

function UserIcon({ transparent, href, label }: { transparent?: boolean; href: string; label: string }) {
    return (
        <Link
            href={href}
            aria-label={label}
            className={`${transparent ? "text-white" : "text-[var(--color-fg)]"} hover:opacity-80 transition`}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
        </Link>
    );
}

/* 시안 매칭: 카트 아이콘 + 우측 상단 빨간 동그라미 12 뱃지 (placeholder).
   실제 카운트는 향후 cart API 연동 시 useCart() 같은 hook 으로 교체. */
function CartIcon({ transparent }: { transparent?: boolean }) {
    const count = 12; // TODO: cart API 연결 시 실제 개수로 교체
    return (
        <Link
            href="/cart"
            aria-label={`장바구니 (${count}개)`}
            className={`relative ${transparent ? "text-white" : "text-[var(--color-fg)]"} hover:opacity-80 transition`}
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {count > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-danger,#e23744)] text-white text-[10px] font-semibold flex items-center justify-center leading-none"
                >
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
}
