import Link from "next/link";
import { api } from "@/lib/api";
import { safeImageUrl } from "@/lib/url";
import { GatedMedia } from "@/components/GatedMedia";
import type { Page } from "@/types/api";

export const dynamic = "force-dynamic";

/* 시안 252:10235 — WE ARE EVENT 페이지 (3 cols 그리드 + 진행중/종료 탭) */

type Event = {
    id: number;
    title: string;
    summary: string | null;
    content: string | null;
    bannerUrl: string | null;
    startsAt: string | null;
    endsAt: string | null;
    visible: boolean;
};

type Filter = "active" | "ended";

// 목데이터 fallback — 12개 진행중 + 일부 종료
const MOCK_EVENTS: Event[] = [
    { id: 9001, title: "포근한 겨울과 함께 찾아온 깜짝선물 이벤트", summary: "겨울 한정 깜짝 선물 증정", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-05-01", endsAt: "2026-06-30", visible: true },
    { id: 9002, title: "신규 회원 가입 적립금 3,000원 즉시 지급", summary: "가입 즉시 즉시 사용 가능", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-05-01", endsAt: "2026-12-31", visible: true },
    { id: 9003, title: "구매금액별 추가 사은품 증정 이벤트", summary: "5만원 이상 구매 시 추가 사은품", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-04-15", endsAt: "2026-07-15", visible: true },
    { id: 9004, title: "베스트 리뷰 작성 시 5,000원 적립", summary: "포토 리뷰 작성 시 2배 적립", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-04-01", endsAt: "2026-12-31", visible: true },
    { id: 9005, title: "친구 초대 이벤트 — 친구도 나도 적립금", summary: "초대 코드 입력 시 양쪽 모두 5,000원", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-03-15", endsAt: "2026-09-30", visible: true },
    { id: 9006, title: "ELFBAR BC10000 출시 기념 할인 이벤트", summary: "신상 BC10000 라인업 최대 20% 할인", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-05-15", endsAt: "2026-08-15", visible: true },
    { id: 9007, title: "DUKE 시그니처 시리즈 런칭 이벤트", summary: "DUKE 전 제품 사은품 증정", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-05-10", endsAt: "2026-07-10", visible: true },
    { id: 9008, title: "주말 한정 무료배송 이벤트", summary: "토·일 주문 건 무료배송", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-05-20", endsAt: "2026-06-30", visible: true },
    { id: 9009, title: "재구매 고객 감사 이벤트 — 10% 추가 할인", summary: "3회 이상 구매 고객 한정", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-04-20", endsAt: "2026-10-20", visible: true },
    { id: 9010, title: "여름 시즌 시원함 가득 이벤트", summary: "ICE 시리즈 전 제품 15% 할인", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-06-01", endsAt: "2026-08-31", visible: true },
    { id: 9011, title: "[종료] 봄맞이 신상 출시 기념 이벤트", summary: "신상 라인업 사전 예약 할인", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-02-01", endsAt: "2026-04-30", visible: true },
    { id: 9012, title: "[종료] 설 연휴 특별 할인 이벤트", summary: "설 연휴 한정 전 상품 10% 할인", content: null, bannerUrl: "/images/page-popup-event.png", startsAt: "2026-01-20", endsAt: "2026-02-15", visible: true },
];

async function fetchEvents(): Promise<Event[]> {
    try {
        const p = await api<Page<Event>>("/api/v1/public/events?size=24", { cache: "no-store" });
        return p.content;
    } catch {
        return [];
    }
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ filter?: Filter }> }) {
    const sp = await searchParams;
    const filter: Filter = sp.filter === "ended" ? "ended" : "active";

    const fetched = await fetchEvents();
    const isFallback = fetched.length === 0;
    const all = isFallback ? MOCK_EVENTS : fetched;

    const now = Date.now();
    const events = all.filter(e => {
        const ended = e.endsAt && new Date(e.endsAt).getTime() < now;
        return filter === "ended" ? ended : !ended;
    });

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
            {/* 큰 타이틀 */}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                WE ARE EVENT
            </h1>

            {/* 진행중 / 종료 탭 */}
            <div className="flex gap-2 mb-6 md:mb-10">
                <FilterTab href="/events?filter=active" label="진행중인 이벤트" active={filter === "active"} />
                <FilterTab href="/events?filter=ended"  label="종료된 이벤트"   active={filter === "ended"}  />
            </div>

            {events.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-16">
                    {filter === "active" ? "진행 중인 이벤트가 없습니다." : "종료된 이벤트가 없습니다."}
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {events.map(e => (
                        <Link
                            key={e.id}
                            href={`/events/${e.id}`}
                            className="block rounded-[18px] overflow-hidden bg-[var(--color-bg-subtle)] hover:opacity-95 transition group"
                        >
                            <GatedMedia className="aspect-[16/9] overflow-hidden">
                                {e.bannerUrl && safeImageUrl(e.bannerUrl) && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={safeImageUrl(e.bannerUrl)}
                                        alt={e.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                )}
                            </GatedMedia>
                        </Link>
                    ))}
                </div>
            )}

            {/* 페이지네이션 (시각 매칭) */}
            {events.length > 0 && (
                <div className="mt-10 md:mt-14 flex justify-center items-center gap-1.5 text-sm">
                    <span className="min-w-9 h-9 inline-flex items-center justify-center bg-[var(--color-accent)] text-white font-medium">1</span>
                    {[2, 3, 4, 5].map(p => (
                        <span key={p} className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)]">{p}</span>
                    ))}
                    <span className="px-2 text-[var(--color-fg-subtle)]">…</span>
                    <span className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)]">30</span>
                    <span className="min-w-9 h-9 inline-flex items-center justify-center text-[var(--color-fg-muted)]">›</span>
                </div>
            )}
        </div>
    );
}

function FilterTab({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center rounded-[10px] px-5 py-2.5 text-sm font-medium transition ${
                active
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}
