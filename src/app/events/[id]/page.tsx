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
    title: "임시텍스트",
    summary: null,
    content: null,
    bannerUrl: "/images/event-winter-cart.png",
    startsAt: "2026-05-01",
    endsAt: "2026-06-30",
    visible: true,
    viewCount: 128,
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

            {/* 시안 매칭: 타이틀 + 메타 좌측 정렬, 배너 이미지 가운데 */}
            <article>
                {/* 제목 (좌측 정렬) */}
                <h2 className="text-base md:text-xl font-bold text-[var(--color-fg)] mb-3 md:mb-4">
                    {event.title}
                </h2>

                {/* 메타 — 작성자 / 게시일 / 조회수 (좌측 정렬, 종료 필드 없음) */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-fg-muted)] pb-6 border-b border-[var(--color-border)]">
                    <span><span className="font-medium text-[var(--color-fg)]">작성자</span> <span className="ml-2">엘프바 코리아</span></span>
                    <span className="text-[var(--color-fg-subtle)]">|</span>
                    <span><span className="font-medium text-[var(--color-fg)]">게시일</span> <span className="ml-2 tabular-nums">{event.createdAt ? formatDate(event.createdAt) : "-"}</span></span>
                    {typeof event.viewCount === "number" && (
                        <>
                            <span className="text-[var(--color-fg-subtle)]">|</span>
                            <span><span className="font-medium text-[var(--color-fg)]">조회수</span> <span className="ml-2 tabular-nums">{event.viewCount.toLocaleString()}</span></span>
                        </>
                    )}
                </div>

                {/* 배너 이미지 — 가운데 정렬, 자세히 보기 버튼은 이미지에 포함 */}
                <div className="mt-8 md:mt-10 flex justify-center">
                    {event.bannerUrl && safeImageUrl(event.bannerUrl) && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={safeImageUrl(event.bannerUrl)}
                            alt={event.title}
                            className="max-w-md w-full h-auto block rounded-[18px]"
                        />
                    )}
                </div>
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
