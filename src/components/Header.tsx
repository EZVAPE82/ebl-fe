"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function Header() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    async function handleLogout() {
        await logout();
        router.push("/");
    }

    return (
        <header className="sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur border-b border-[var(--color-border)]">
            <div className="mx-auto max-w-screen-xl flex items-center gap-4 px-4 h-14">
                <Link href="/" className="font-bold text-lg tracking-tight text-[var(--color-fg)]">
                    엘프바 라운지
                </Link>
                <nav className="hidden md:flex items-center gap-5 text-sm text-[var(--color-fg-muted)]">
                    <Link href="/c/best" className="hover:text-[var(--color-fg)]">BEST</Link>
                    <Link href="/c/new" className="hover:text-[var(--color-fg)]">NEW</Link>
                    <Link href="/c/disposable" className="hover:text-[var(--color-fg)]">일회용</Link>
                    <Link href="/c/liquid" className="hover:text-[var(--color-fg)]">액상</Link>
                    <Link href="/events" className="hover:text-[var(--color-fg)]">이벤트</Link>
                    <Link href="/notices" className="hover:text-[var(--color-fg)]">공지</Link>
                </nav>
                <div className="ml-auto flex items-center gap-3 text-sm">
                    {loading ? (
                        <span className="text-[var(--color-fg-subtle)]">···</span>
                    ) : user ? (
                        <>
                            <Link href="/mypage" className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                                {user.name} 님
                            </Link>
                            <Link href="/cart" className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">장바구니</Link>
                            <button onClick={handleLogout} className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">로그인</Link>
                            <Link href="/signup" className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">회원가입</Link>
                            <Link href="/cart" className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">장바구니</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
