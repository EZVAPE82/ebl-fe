import Link from "next/link";

export function Footer() {
    return (
        <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <div className="mx-auto max-w-screen-xl px-4 py-10 space-y-6 text-xs text-[var(--color-fg-muted)]">
                <nav className="flex flex-wrap gap-x-5 gap-y-2">
                    <Link href="/about" className="hover:text-[var(--color-fg)]">회사소개</Link>
                    <Link href="/guide" className="hover:text-[var(--color-fg)]">이용안내</Link>
                    <Link href="/privacy" className="hover:text-[var(--color-fg)] font-medium text-[var(--color-fg)]">개인정보처리방침</Link>
                    <Link href="/terms" className="hover:text-[var(--color-fg)]">이용약관</Link>
                    <Link href="/youth" className="hover:text-[var(--color-fg)]">청소년보호정책</Link>
                </nav>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 leading-relaxed">
                    <div><dt className="inline text-[var(--color-fg-subtle)]">상호: </dt><dd className="inline">엘프바 라운지</dd></div>
                    <div><dt className="inline text-[var(--color-fg-subtle)]">대표: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-[var(--color-fg-subtle)]">주소: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-[var(--color-fg-subtle)]">연락처: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-[var(--color-fg-subtle)]">사업자등록번호: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-[var(--color-fg-subtle)]">통신판매업신고번호: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-[var(--color-fg-subtle)]">개인정보관리책임자: </dt><dd className="inline">—</dd></div>
                    <div><dt className="inline text-[var(--color-fg-subtle)]">CS 운영시간: </dt><dd className="inline">평일 10:00-18:00</dd></div>
                </dl>
                <p className="text-[var(--color-fg-subtle)]">© 엘프바 라운지. 본 사이트는 만 19세 이상 성인만 이용 가능합니다.</p>
            </div>
        </footer>
    );
}
