import Link from "next/link";

/**
 * Footer — 시안 402:11964. width 1580 · padding 48px 0 · col · gap 12.
 *  로고 → [사업자정보(label|value 인라인) ↔ 고객센터 24/500] → [링크|구분+저작권 ↔ SNS 44×44]
 *  내용(사업자정보·연락처·링크)은 실제 값 유지, 스타일만 시안 매칭.
 */
const INFO: { label: string; value: string }[] = [
    { label: "상호명", value: "유한회사 전담이지" },
    { label: "대표", value: "이상헌" },
    { label: "주소", value: "서울특별시 중구 명동8길 22-4, 1003호 (명동2가, 대한빌딩)" },
    { label: "전화번호", value: "02-773-4114" },
    { label: "개인정보관리책임자", value: "이종훈" },
    { label: "사업자등록번호", value: "419-86-03748" },
    { label: "이메일", value: "elfbar@naver.com" },
    { label: "배송사", value: "로젠택배" },
];

const LINKS: { href: string; label: string; strong?: boolean }[] = [
    { href: "/about", label: "회사소개" },
    { href: "/guide", label: "이용안내" },
    { href: "/privacy", label: "개인정보처리방침", strong: true },
    { href: "/terms", label: "이용약관" },
    { href: "/youth", label: "청소년보호정책" },
];

export function Footer() {
    return (
        <footer className="border-t border-[var(--color-border)] bg-white">
            {/* 시안 CSS: width 1580 · padding 48px 0 · col · align-start · gap 12 */}
            <div className="mx-auto flex max-w-[1920px] flex-col items-start gap-3 px-4 py-12 xl:px-[170px]">
                {/* 로고 127×38 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo-elfbar-color.png" alt="ELFBAR" className="h-[38px] w-auto" />

                {/* 콘텐츠 gap 28 */}
                <div className="flex w-full flex-col gap-7">
                    {/* 사업자정보(좌) ↔ 고객센터(우) */}
                    <div className="flex w-full flex-col justify-between gap-6 md:flex-row">
                        {/* 사업자정보 — label | value 인라인, 줄바꿈 */}
                        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] leading-relaxed text-[#767676]">
                            {INFO.map((it) => (
                                <div key={it.label} className="flex items-center gap-2">
                                    <dt>{it.label}</dt>
                                    <span aria-hidden="true" className="text-[#D9D9D9]">|</span>
                                    <dd className="text-[#555]">{it.value}</dd>
                                </div>
                            ))}
                        </dl>

                        {/* 고객센터 — 24/500 */}
                        <div className="flex-shrink-0 md:text-right">
                            <div className="flex items-center gap-2 md:justify-end">
                                <span className="text-[24px] font-medium leading-none text-[#000]">고객센터</span>
                                <span className="text-[24px] font-medium leading-none text-[#000] tabular-nums">010-8662-8575</span>
                            </div>
                            <dl className="mt-2.5 space-y-1 text-[14px] text-[#767676]">
                                <div className="flex gap-1 md:justify-end"><dt>평일:</dt><dd>10:00 ~ 18:00</dd></div>
                                <div className="flex gap-1 md:justify-end"><dt>점심:</dt><dd>13:00 ~ 14:00</dd></div>
                            </dl>
                        </div>
                    </div>

                    {/* 링크+저작권(좌) ↔ SNS(우) */}
                    <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div className="flex flex-col gap-2 text-[14px] text-[#767676]">
                            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                {LINKS.map((l, i) => (
                                    <span key={l.href} className="flex items-center gap-x-3">
                                        {i > 0 && <span aria-hidden="true" className="text-[#D9D9D9]">|</span>}
                                        <Link
                                            href={l.href}
                                            className={l.strong ? "font-medium text-[#000] hover:text-[var(--color-accent)]" : "hover:text-[var(--color-fg)]"}
                                        >
                                            {l.label}
                                        </Link>
                                    </span>
                                ))}
                            </nav>
                            <p>© {new Date().getFullYear()} 유한회사 전담이지 ALL RIGHTS RESERVED. 본 사이트는 만 19세 이상 성인만 이용 가능합니다.</p>
                        </div>

                        {/* SNS — 44×44 원형 */}
                        <ul className="flex flex-shrink-0 gap-3">
                            <SocialLink label="카카오톡 문의" href="#" icon={<ChatBubbleIcon />} />
                            <SocialLink label="Instagram" href="#" icon={<InstagramIcon />} />
                            <SocialLink label="WeChat" href="#" icon={<WeChatIcon />} />
                        </ul>
                    </div>
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] transition hover:bg-[var(--color-border)] hover:text-[var(--color-fg)]"
            >
                {icon}
            </Link>
        </li>
    );
}

/* SVG 인라인 아이콘 — 시안 (말풍선/Instagram/WeChat) */
function ChatBubbleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3C6.5 3 2 6.6 2 11c0 2.6 1.6 4.9 4 6.4V21l3.7-2.4c.7.1 1.5.2 2.3.2 5.5 0 10-3.6 10-8s-4.5-7.8-10-7.8z" />
        </svg>
    );
}
function InstagramIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
    );
}
function WeChatIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8.7 4C4.5 4 1 6.9 1 10.5c0 1.9 1 3.6 2.6 4.7l-.6 2.1 2.4-1.2c.7.2 1.5.3 2.3.3.3 0 .6 0 .8-.1-.2-.5-.3-1.1-.3-1.7 0-3.3 3.1-5.9 6.9-5.9.3 0 .5 0 .8.1C15.2 6 12.3 4 8.7 4zm-2.5 3.4c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zm5 0c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9z M22.9 14.5c0-3-2.9-5.4-6.4-5.4-3.6 0-6.4 2.4-6.4 5.4S12.9 20 16.5 20c.7 0 1.4-.1 2-.3l1.9 1-.5-1.7c1.6-.9 2.5-2.3 2.5-3.9zm-8.4-1.4c-.4 0-.8-.3-.8-.8s.3-.8.8-.8.8.3.8.8-.4.8-.8.8zm4.3 0c-.4 0-.8-.3-.8-.8s.3-.8.8-.8.8.3.8.8-.4.8-.8.8z" />
        </svg>
    );
}
