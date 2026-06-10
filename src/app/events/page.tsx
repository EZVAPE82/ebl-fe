import Link from "next/link";
import { api } from "@/lib/api";
import { safeImageUrl } from "@/lib/url";
import { GatedMedia } from "@/components/GatedMedia";
import type { Page } from "@/types/api";

export const dynamic = "force-dynamic";

/* Figma 이벤트리스트 — WE ARE EVENT (3 cols 그리드 + 진행중/종료 탭) */

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

// 목데이터 fallback — 10개 진행중 + 2개 종료
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

/** ISO/날짜 문자열 → "YYYY.MM.DD" (없으면 빈 문자열). */
function fmtDate(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
}

/** "YYYY.MM.DD ~ YYYY.MM.DD" — 한쪽만 있으면 그쪽만, 둘 다 없으면 빈 문자열. */
function fmtPeriod(start: string | null | undefined, end: string | null | undefined): string {
    const s = fmtDate(start);
    const e = fmtDate(end);
    if (s && e) return `${s} ~ ${e}`;
    return s || e || "";
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ filter?: Filter }> }) {
    const sp = await searchParams;
    const filter: Filter = sp.filter === "ended" ? "ended" : "active";

    const fetched = await fetchEvents();
    const isFallback = fetched.length === 0;
    const all = isFallback ? MOCK_EVENTS : fetched;

    // 진행중 vs 종료: endsAt 을 현재 시각과 비교 (endsAt 이 과거면 종료).
    const now = Date.now();
    const events = all.filter((e) => {
        const ended = !!(e.endsAt && new Date(e.endsAt).getTime() < now);
        return filter === "ended" ? ended : !ended;
    });

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col items-center gap-[60px]">
            <div className="w-full flex flex-col gap-7">
                {/* 헤더 블록 — 타이틀 + 탭 */}
                <div className="w-full flex flex-col gap-8">
                    <h1 className="text-[40px] md:text-[56px] font-bold leading-tight text-[#222222]">
                        WE ARE EVENT
                    </h1>

                    {/* 진행중 / 종료 탭 — filter state 로 토글 */}
                    <div className="flex items-center gap-3">
                        <FilterTab href="/events?filter=active" label="진행중인 이벤트" active={filter === "active"} />
                        <FilterTab href="/events?filter=ended" label="종료된 이벤트" active={filter === "ended"} />
                    </div>
                </div>

                {/* 이벤트 그리드 / 빈 상태 */}
                {events.length === 0 ? (
                    <p className="text-[14px] text-[#767676] text-center py-24">
                        {filter === "active" ? "진행 중인 이벤트가 없습니다." : "종료된 이벤트가 없습니다."}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12">
                        {events.map((e) => {
                            const img = e.bannerUrl ? safeImageUrl(e.bannerUrl) : "";
                            const period = fmtPeriod(e.startsAt, e.endsAt);
                            return (
                                <Link key={e.id} href={`/events/${e.id}`} className="group block">
                                    <GatedMedia className="w-full aspect-[508/248] rounded-[12px] overflow-hidden bg-[#D9D9D9]">
                                        {img && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={img}
                                                alt={e.title}
                                                className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                                            />
                                        )}
                                    </GatedMedia>
                                    <div className="mt-3 flex flex-col gap-1">
                                        <p className="text-[16px] font-medium text-[#000] line-clamp-1">{e.title}</p>
                                        {period && <p className="text-[14px] text-[#767676]">{period}</p>}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterTab({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`px-4 py-3 rounded-[4px] text-[14px] font-medium transition ${
                active
                    ? "bg-[#0072DD] text-white"
                    : "border border-[#DDDDDD] text-[#000] hover:bg-[#F6F7FB]"
            }`}
        >
            {label}
        </Link>
    );
}
