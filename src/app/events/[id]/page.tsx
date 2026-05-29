import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { safeImageUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

/* 시안 34:5599 — WE ARE EVENT 상세 페이지. */

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
            {/* 큰 타이틀 */}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                WE ARE EVENT
            </h1>

            {/* 굵은 구분선 */}
            <hr className="border-t-2 border-[var(--color-fg)] mb-6 md:mb-8" />

            {/* 제목 */}
            <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)] mb-3 md:mb-4 max-w-3xl mx-auto">
                {event.title}
            </h2>

            {/* 메타 — 작성자 / 게시일 / 종료일 / 조회수 */}
            <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-[var(--color-fg-muted)] pb-6 border-b border-[var(--color-border)]">
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

            {/* 큰 배너 + 자세히 보기 overlay 버튼 */}
            <div className="max-w-3xl mx-auto mt-8 md:mt-10">
                {event.bannerUrl && safeImageUrl(event.bannerUrl) && (
                    <div className="relative overflow-hidden rounded-[18px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={safeImageUrl(event.bannerUrl)}
                            alt={event.title}
                            className="w-full h-auto block"
                        />
                        {/* "자세히 보기" overlay 버튼 — 이미지 하단 가운데 */}
                        <div className="absolute left-0 right-0 bottom-6 md:bottom-10 flex justify-center">
                            <span className="inline-flex items-center justify-center bg-[#1a2a5e] text-white text-sm font-medium px-7 py-3">
                                자세히 보기
                            </span>
                        </div>
                    </div>
                )}

                {/* 본문 (옵션) */}
                {event.content && (
                    <div className="mt-8 md:mt-10 text-sm md:text-base text-[var(--color-fg)] leading-relaxed whitespace-pre-line">
                        {event.content}
                    </div>
                )}
            </div>

            {/* 하단 더 알아보기 / 목록 버튼 */}
            <div className="mt-10 md:mt-14 flex justify-center">
                <Link
                    href="/events"
                    className="inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] px-10 py-3 text-sm md:text-base text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                >
                    더 알아보기
                </Link>
            </div>
        </div>
    );
}
