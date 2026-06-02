import Link from "next/link";

export function Footer() {
    return (
        <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <div className="mx-auto max-w-screen-2xl px-4 py-10 grid gap-8 md:grid-cols-[1fr_auto]">
                {/* 좌측: 회사정보 — 시안 276:10555 폰트 13px(#767676), 라벨 w400 / 값 w500 */}
                <div className="text-[13px] text-[#767676] leading-relaxed">
                    {/* 로고 이미지 (시안 127x38) — 텍스트 ELFBAR 대신 컬러 로고 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/logo-elfbar-color.png" alt="ELFBAR" className="h-9 w-auto mb-5" />
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                        <div><dt className="inline text-[#767676]">상호 </dt><dd className="inline font-medium text-[#767676]">유한회사 전담이지</dd></div>
                        <div><dt className="inline text-[#767676]">대표 </dt><dd className="inline font-medium text-[#767676]">이상헌</dd></div>
                        <div className="md:col-span-2"><dt className="inline text-[#767676]">주소 </dt><dd className="inline font-medium text-[#767676]">서울특별시 중구 명동8길 22-4, 1003호 (명동2가, 대한빌딩)</dd></div>
                        <div><dt className="inline text-[#767676]">사업자등록번호 </dt><dd className="inline font-medium text-[#767676] tabular-nums">419-86-03748</dd></div>
                        <div><dt className="inline text-[#767676]">개업일 </dt><dd className="inline font-medium text-[#767676]">2025년 7월 1일</dd></div>
                        <div><dt className="inline text-[#767676]">전화번호 </dt><dd className="inline font-medium text-[#767676]">02-773-4114</dd></div>
                        <div><dt className="inline text-[#767676]">이메일 </dt><dd className="inline font-medium text-[#767676]">elfbar@naver.com</dd></div>
                        <div><dt className="inline text-[#767676]">개인정보관리책임자 </dt><dd className="inline font-medium text-[#767676]">이상헌</dd></div>
                        <div><dt className="inline text-[#767676]">배송사 </dt><dd className="inline font-medium text-[#767676]">로젠택배</dd></div>
                    </dl>

                    {/* 푸터 nav — 시안 13px, 개인정보처리방침만 w500 black */}
                    <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                        <Link href="/about" className="text-[#767676] hover:text-[var(--color-fg)]">회사소개</Link>
                        <Link href="/guide" className="text-[#767676] hover:text-[var(--color-fg)]">이용안내</Link>
                        <Link href="/privacy" className="font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)]">개인정보처리방침</Link>
                        <Link href="/terms" className="text-[#767676] hover:text-[var(--color-fg)]">이용약관</Link>
                        <Link href="/youth" className="text-[#767676] hover:text-[var(--color-fg)]">청소년보호정책</Link>
                    </nav>

                    {/* 카피라이트 — 시안 14px #767676 */}
                    <p className="mt-4 text-[13px] text-[#767676]">
                        © {new Date().getFullYear()} 유한회사 전담이지 ALL RIGHTS RESERVED. 본 사이트는 만 19세 이상 성인만 이용 가능합니다.
                    </p>
                </div>

                {/* 우측: 고객센터 + SNS — 시안 고객센터 16px w500 black */}
                <div className="md:text-right">
                    <div className="flex items-center md:justify-end gap-2">
                        <span className="text-base font-medium text-[var(--color-fg)]">고객센터</span>
                        <span className="text-base font-medium text-[var(--color-fg)] tabular-nums">02-773-4114</span>
                    </div>
                    <dl className="mt-2 text-[13px] text-[#767676] space-y-0.5">
                        <div className="flex md:justify-end gap-1">
                            <dt className="text-[#767676]">평일:</dt>
                            <dd>10:00 ~ 18:00</dd>
                        </div>
                        <div className="flex md:justify-end gap-1">
                            <dt className="text-[#767676]">점심:</dt>
                            <dd>13:00 ~ 14:00</dd>
                        </div>
                    </dl>

                    <ul className="mt-5 flex md:justify-end gap-2">
                        <SocialLink label="카카오톡 문의" href="#" icon={<ChatBubbleIcon />} />
                        <SocialLink label="Instagram" href="#" icon={<InstagramIcon />} />
                        <SocialLink label="WeChat" href="#" icon={<WeChatIcon />} />
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

/* SVG 인라인 아이콘 — 시안 (말풍선/Instagram/WeChat) */
function ChatBubbleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3C6.5 3 2 6.6 2 11c0 2.6 1.6 4.9 4 6.4V21l3.7-2.4c.7.1 1.5.2 2.3.2 5.5 0 10-3.6 10-8s-4.5-7.8-10-7.8z" />
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
function WeChatIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8.7 4C4.5 4 1 6.9 1 10.5c0 1.9 1 3.6 2.6 4.7l-.6 2.1 2.4-1.2c.7.2 1.5.3 2.3.3.3 0 .6 0 .8-.1-.2-.5-.3-1.1-.3-1.7 0-3.3 3.1-5.9 6.9-5.9.3 0 .5 0 .8.1C15.2 6 12.3 4 8.7 4zm-2.5 3.4c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zm5 0c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9z M22.9 14.5c0-3-2.9-5.4-6.4-5.4-3.6 0-6.4 2.4-6.4 5.4S12.9 20 16.5 20c.7 0 1.4-.1 2-.3l1.9 1-.5-1.7c1.6-.9 2.5-2.3 2.5-3.9zm-8.4-1.4c-.4 0-.8-.3-.8-.8s.3-.8.8-.8.8.3.8.8-.4.8-.8.8zm4.3 0c-.4 0-.8-.3-.8-.8s.3-.8.8-.8.8.3.8.8-.4.8-.8.8z" />
        </svg>
    );
}
