import Link from "next/link";

export function Footer() {
    return (
        <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
            <div className="mx-auto max-w-screen-xl px-4 py-10 space-y-6 text-xs text-zinc-600">
                <nav className="flex flex-wrap gap-x-5 gap-y-2">
                    <Link href="/about" className="hover:text-black">회사소개</Link>
                    <Link href="/guide" className="hover:text-black">이용안내</Link>
                    <Link href="/privacy" className="hover:text-black font-medium text-zinc-800">개인정보처리방침</Link>
                    <Link href="/terms" className="hover:text-black">이용약관</Link>
                    <Link href="/youth" className="hover:text-black">청소년보호정책</Link>
                </nav>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 leading-relaxed">
                    <div><dt className="inline text-zinc-500">상호: </dt><dd className="inline">엘프바 라운지</dd></div>
                    <div><dt className="inline text-zinc-500">대표: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-zinc-500">주소: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-zinc-500">연락처: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-zinc-500">사업자등록번호: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-zinc-500">통신판매업신고번호: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-zinc-500">개인정보관리책임자: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-zinc-500">CS 운영시간: </dt><dd className="inline">평일 10:00-18:00</dd></div>
                </dl>
                <p className="text-zinc-400">© 엘프바 라운지. 본 사이트는 만 19세 이상 성인만 이용 가능합니다.</p>
            </div>
        </footer>
    );
}
