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
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-200">
            <div className="mx-auto max-w-screen-xl flex items-center gap-4 px-4 h-14">
                <Link href="/" className="font-bold text-lg tracking-tight">
                    엘프바 라운지
                </Link>
                <nav className="hidden md:flex items-center gap-5 text-sm text-zinc-700">
                    <Link href="/c/best" className="hover:text-black">BEST</Link>
                    <Link href="/c/new" className="hover:text-black">NEW</Link>
                    <Link href="/c/disposable" className="hover:text-black">일회용</Link>
                    <Link href="/c/liquid" className="hover:text-black">액상</Link>
                    <Link href="/events" className="hover:text-black">이벤트</Link>
                    <Link href="/notices" className="hover:text-black">공지</Link>
                </nav>
                <div className="ml-auto flex items-center gap-3 text-sm">
                    {loading ? (
                        <span className="text-zinc-400">···</span>
                    ) : user ? (
                        <>
                            <Link href="/mypage" className="text-zinc-700 hover:text-black">
                                {user.name} 님
                            </Link>
                            <Link href="/cart" className="text-zinc-700 hover:text-black">장바구니</Link>
                            <button onClick={handleLogout} className="text-zinc-500 hover:text-black">
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-zinc-700 hover:text-black">로그인</Link>
                            <Link href="/signup" className="text-zinc-700 hover:text-black">회원가입</Link>
                            <Link href="/cart" className="text-zinc-700 hover:text-black">장바구니</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
