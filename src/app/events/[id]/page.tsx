import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { safeImageUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

/* 시안 34:5599 — WE ARE EVENT 상세 페이지 (가운데 정렬 + 이미지 모달 스타일) */

type Event = {
    id: number;
    title: string;
    summary: string | null;
    content: string | null;
    bannerUrl: string | null;
    startsAt: string | null;
    endsAt: string | null;
    visible: boolean;
    viewCount?: number;
    createdAt?: string;
};

const MOCK_EVENT: Event = {
    id: 9001,
    title: "포근한 겨울과 함께 찾아온 깜짝선물 이벤트",
    summary: "겨울 한정 깜짝 선물 증정 이벤트입니다.",
    content: "이번 겨울, 엘프바와 함께 따뜻하고 풍성한 연말 보내세요.\n\n• 기간: 2026-05-01 ~ 2026-06-30\n• 대상: 전 회원\n• 혜택: 구매 금액별 깜짝 사은품 증정",
    bannerUrl: "/images/page-popup-event.png",
    startsAt: "2026-05-01",
    endsAt: "2026-06-30",
    visible: true,
    viewCount: 1247,
    createdAt: "2026-05-22T10:00:00",
};

async function fetchEvent(id: string): Promise<Event> {
    try {
        return await api<Event>(`/api/v1/public/events/${id}`, { cache: "no-store" });
    } catch (e) {
        if (e instanceof ApiError) return MOCK_EVENT;
        return MOCK_EVENT;
    }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await fetchEvent(id);

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
            {/* 큰 타이틀 (좌측 정렬) */}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                WE ARE EVENT
            </h1>

            {/* 굵은 구분선 (전체 가로) */}
            <hr className="border-t-2 border-[var(--color-fg)] mb-8 md:mb-12" />

            {/* 가운데 정렬 컨텐츠 컨테이너 */}
            <article className="max-w-2xl mx-auto">
                {/* 제목 (가운데) */}
                <h2 className="text-base md:text-xl font-bold text-[var(--color-fg)] mb-3 md:mb-4 text-center">
                    {event.title}
                </h2>

                {/* 메타 — 작성자 / 게시일 / 종료 / 조회수 (가운데) */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--color-fg-muted)] pb-6 border-b border-[var(--color-border)]">
                    <span><span className="font-medium text-[var(--color-fg)]">작성자</span> <span className="ml-2">엘프바 코리아</span></span>
                    <span className="text-[var(--color-fg-subtle)]">|</span>
                    <span><span className="font-medium text-[var(--color-fg)]">게시일</span> <span className="ml-2 tabular-nums">{event.createdAt ? formatDate(event.createdAt) : "-"}</span></span>
                    {event.endsAt && (
                        <>
                            <span className="text-[var(--color-fg-subtle)]">|</span>
                            <span><span className="font-medium text-[var(--color-fg)]">종료</span> <span className="ml-2 tabular-nums">{formatDate(event.endsAt)}</span></span>
                        </>
                    )}
                    {typeof event.viewCount === "number" && (
                        <>
                            <span className="text-[var(--color-fg-subtle)]">|</span>
                            <span><span className="font-medium text-[var(--color-fg)]">조회수</span> <span className="ml-2 tabular-nums">{event.viewCount.toLocaleString()}</span></span>
                        </>
                    )}
                </div>

                {/* 큰 이미지 + 하단 가운데 "자세히 보기" overlay 버튼 */}
                <div className="relative mt-8 md:mt-10 rounded-[18px] overflow-hidden">
                    {event.bannerUrl && safeImageUrl(event.bannerUrl) && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={safeImageUrl(event.bannerUrl)}
                            alt={event.title}
                            className="w-full h-auto block"
                        />
                    )}
                    {/* "자세히 보기" overlay 버튼 — 이미지 하단 가운데 (시안 어두운 파랑) */}
                    <div className="absolute left-0 right-0 bottom-6 md:bottom-10 flex justify-center">
                        <Link
                            href="#detail"
                            className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#1a2a5e] text-white text-sm md:text-base font-medium px-7 py-3 hover:opacity-90 transition"
                        >
                            <span>자세히 보기</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* 이미지 좌/우 하단 옵션 — "오늘 하루 보지않기" / "닫기" (시안 매칭, 모달 느낌) */}
                <div className="mt-3 flex items-center justify-between text-xs md:text-sm text-[var(--color-fg-muted)]">
                    <button type="button" className="hover:text-[var(--color-fg)] transition">
                        오늘 하루 보지않기
                    </button>
                    <Link href="/events" className="hover:text-[var(--color-fg)] transition">
                        닫기
                    </Link>
                </div>

                {/* 본문 — 기간/대상/혜택 */}
                {event.content && (
                    <div id="detail" className="mt-10 md:mt-12 text-sm md:text-base text-[var(--color-fg)] leading-relaxed whitespace-pre-line">
                        {event.content}
                    </div>
                )}
            </article>

            {/* 하단 "더 알아보기" 버튼 (가운데, 라운딩) */}
            <div className="mt-10 md:mt-14 flex justify-center">
                <Link
                    href="/events"
                    className="inline-flex items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-10 py-3 text-sm md:text-base text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                >
                    더 알아보기
                </Link>
            </div>
        </div>
    );
}
