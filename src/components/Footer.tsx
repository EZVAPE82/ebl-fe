import Link from "next/link";

export function Footer() {
    return (
        <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <div className="mx-auto max-w-screen-2xl px-4 py-10 grid gap-8 md:grid-cols-[1fr_auto]">
                {/* 좌측: 회사정보 */}
                <div className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
                    <p className="font-bold tracking-[0.15em] text-[var(--color-fg)] mb-4">ELFBAR</p>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                        <div><dt className="inline text-[var(--color-fg-subtle)]">상호: </dt><dd className="inline">유한회사 전담이지</dd></div>
                        <div><dt className="inline text-[var(--color-fg-subtle)]">대표: </dt><dd className="inline">이상헌</dd></div>
                        <div className="md:col-span-2"><dt className="inline text-[var(--color-fg-subtle)]">주소: </dt><dd className="inline">서울특별시 중구 명동8길 22-4, 1003호 (명동2가, 대한빌딩)</dd></div>
                        <div><dt className="inline text-[var(--color-fg-subtle)]">사업자등록번호: </dt><dd className="inline tabular-nums">419-86-03748</dd></div>
                        <div><dt className="inline text-[var(--color-fg-subtle)]">개업일: </dt><dd className="inline">2025년 7월 1일</dd></div>
                        <div><dt className="inline text-[var(--color-fg-subtle)]">전화번호: </dt><dd className="inline">02-773-4114</dd></div>
                        <div><dt className="inline text-[var(--color-fg-subtle)]">이메일: </dt><dd className="inline">elfbar@naver.com</dd></div>
                        <div><dt className="inline text-[var(--color-fg-subtle)]">개인정보관리책임자: </dt><dd className="inline">이상헌</dd></div>
                        <div><dt className="inline text-[var(--color-fg-subtle)]">배송사: </dt><dd className="inline">로젠택배</dd></div>
                    </dl>

                    <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <Link href="/about" className="hover:text-[var(--color-fg)]">회사소개</Link>
                        <Link href="/guide" className="hover:text-[var(--color-fg)]">이용안내</Link>
                        <Link href="/privacy" className="font-semibold text-[var(--color-fg)] hover:text-[var(--color-accent)]">개인정보처리방침</Link>
                        <Link href="/terms" className="hover:text-[var(--color-fg)]">이용약관</Link>
                        <Link href="/youth" className="hover:text-[var(--color-fg)]">청소년보호정책</Link>
                    </nav>

                    <p className="mt-4 text-[11px] text-[var(--color-fg-subtle)]">
                        © {new Date().getFullYear()} 유한회사 전담이지 ALL RIGHTS RESERVED. 본 사이트는 만 19세 이상 성인만 이용 가능합니다.
                    </p>
                </div>

                {/* 우측: 고객센터 + SNS */}
                <div className="md:text-right">
                    <p className="text-xs text-[var(--color-fg-muted)] mb-1">고객센터</p>
                    <p className="text-xl md:text-2xl font-bold text-[var(--color-fg)] tracking-tight">02-773-4114</p>
                    <dl className="mt-2 text-[11px] text-[var(--color-fg-muted)] space-y-0.5">
                        <div className="flex md:justify-end gap-1">
                            <dt className="text-[var(--color-fg-subtle)]">평일</dt>
                            <dd>10:00 - 18:00</dd>
                        </div>
                        <div className="flex md:justify-end gap-1">
                            <dt className="text-[var(--color-fg-subtle)]">점심</dt>
                            <dd>13:00 - 14:00</dd>
                        </div>
                    </dl>

                    <ul className="mt-5 flex md:justify-end gap-2">
                        <SocialLink label="YouTube" href="#" icon={<YouTubeIcon />} />
                        <SocialLink label="Instagram" href="#" icon={<InstagramIcon />} />
                        <SocialLink label="X" href="#" icon={<XIcon />} />
                    </ul>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
    return (
        <li>
            <Link
                href={href}
                aria-label={label}
                className="inline-flex w-8 h-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-fg)] hover:text-[var(--color-fg)] transition"
            >
                {icon}
            </Link>
        </li>
    );
}

/* SVG 인라인 아이콘 (외부 라이브러리 없음 + currentColor 로 토큰 호환) */
function YouTubeIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.8 3.5 12 3.5 12 3.5s-7.8 0-9.5.6c-1 .3-1.8 1-2 2.1C0 7.9 0 12 0 12s0 4.1.5 5.8c.2 1 1 1.8 2 2.1 1.7.6 9.5.6 9.5.6s7.8 0 9.5-.6c1-.3 1.8-1 2-2.1.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
        </svg>
    );
}
function InstagramIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
    );
}
function XIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2H21.5l-7.5 8.57L23 22h-7l-5.4-7.04L4.5 22H1.244l8.07-9.22L1 2h7.2l4.86 6.43L18.244 2zm-1.18 18h1.78L6.92 4H5.04l12.024 16z" />
        </svg>
    );
}
