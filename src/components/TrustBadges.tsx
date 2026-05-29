/**
 * TrustBadges — Hero 바로 아래 다크 보라 그라데이션 영역 5 카드
 * 시안 214:17932 매칭 (1600x122)
 *
 *  - 오늘출발 (트럭)        : 평일 오후 2시 이전 주문건
 *  - 신규가입 혜택 (선물)   : 가입 즉시 적립금 3,000원
 *  - 구매적립 (코인)        : 구매 금액 최대 2% 적립
 *  - 정품보장 (배지)        : 엘프바 공식 인증 판매처
 *  - 멤버십혜택 (배지)      : 엘프바 공식 인증 판매처
 *
 * Hero 의 그라데이션 톤을 그대로 연장해서 자연스럽게 연결.
 */
export function TrustBadges() {
    const items = [
        { Icon: TruckIcon,  title: "오늘출발",       desc: "평일 오후 2시 이전 주문건" },
        { Icon: GiftIcon,   title: "신규가입 혜택",  desc: "가입 즉시 적립금 3,000원" },
        { Icon: CoinIcon,   title: "구매적립",       desc: "구매 금액 최대 2% 적립" },
        { Icon: BadgeIcon,  title: "정품보장",       desc: "엘프바 공식 인증 판매처" },
        { Icon: BadgeIcon,  title: "멤버십혜택",     desc: "엘프바 공식 인증 판매처" },
    ] as const;

    return (
        <section
            aria-label="혜택 안내"
            className="bg-gradient-to-b from-[#1a0f3d] via-[#221248] to-[#1a0f3d]"
        >
            <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-5 md:py-7 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-4">
                {items.map(it => (
                    <div key={it.title} className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <it.Icon />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm md:text-base font-semibold text-white whitespace-nowrap">
                                {it.title}
                            </p>
                            <p className="text-[11px] md:text-xs text-white/60 mt-0.5">
                                {it.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* SVG outline icons — currentColor (text-white 상속) */
function TruckIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="1" y="6" width="13" height="10" rx="1" />
            <path d="M14 9h4l3 3v4h-7V9z" />
            <circle cx="5.5" cy="18" r="1.7" />
            <circle cx="17" cy="18" r="1.7" />
        </svg>
    );
}
function GiftIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M5 12v9h14v-9" />
            <line x1="12" y1="8" x2="12" y2="21" />
            <path d="M12 8s-2-4-5-4a2 2 0 1 0 0 4h5z" />
            <path d="M12 8s2-4 5-4a2 2 0 1 1 0 4h-5z" />
        </svg>
    );
}
function CoinIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <ellipse cx="12" cy="6" rx="8" ry="3" />
            <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
            <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
    );
}
function BadgeIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l2.8 1.8 3.3-.4 1 3.2 2.7 2-1.4 3 .8 3.3-3 1.5-1.5 3-3.3-.4L12 22l-2.4-2-3.3.4-1.5-3-3-1.5.8-3.3-1.4-3 2.7-2 1-3.2 3.3.4z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    );
}
