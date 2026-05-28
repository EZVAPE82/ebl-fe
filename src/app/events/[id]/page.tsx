import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { safeImageUrl } from "@/lib/url";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

async function fetchEvent(id: string): Promise<Event> {
    return api<Event>(`/api/v1/public/events/${id}`, { cache: "no-store" });
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let event: Event;
    try {
        event = await fetchEvent(id);
    } catch (e) {
        if (e instanceof ApiError && e.status === 404) notFound();
        throw e;
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--color-fg)] tracking-tight">WE ARE EVENT</h1>

            <article className="max-w-3xl mx-auto">
                {/* 제목 */}
                <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-fg)]">{event.title}</h2>

                {/* 메타 행 */}
                <div className="mt-4 pb-4 border-b border-[var(--color-fg)] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-fg-muted)]">
                    <span><span className="text-[var(--color-fg-subtle)]">작성자</span> 엘프바 코리아</span>
                    <span className="text-[var(--color-border-strong)]">|</span>
                    <span><span className="text-[var(--color-fg-subtle)]">게시일</span> {event.createdAt ? formatDate(event.createdAt) : "-"}</span>
                    {event.endsAt && (
                        <>
                            <span className="text-[var(--color-border-strong)]">|</span>
                            <span><span className="text-[var(--color-fg-subtle)]">종료</span> {formatDate(event.endsAt)}</span>
                        </>
                    )}
                    {typeof event.viewCount === "number" && (
                        <>
                            <span className="text-[var(--color-border-strong)]">|</span>
                            <span><span className="text-[var(--color-fg-subtle)]">조회수</span> {event.viewCount.toLocaleString()}</span>
                        </>
                    )}
                </div>

                {/* 배너 */}
                {event.bannerUrl && safeImageUrl(event.bannerUrl) && (
                    <div className="mt-8 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-bg-subtle)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={safeImageUrl(event.bannerUrl)}
                            alt={event.title}
                            className="w-full h-auto"
                        />
                    </div>
                )}

                {/* 내용 */}
                {event.content && (
                    <div className="mt-6 prose prose-sm max-w-none text-[var(--color-fg)] whitespace-pre-line leading-relaxed">
                        {event.content}
                    </div>
                )}

                {/* 요약을 내용 fallback 으로 */}
                {!event.content && event.summary && (
                    <p className="mt-6 text-sm text-[var(--color-fg)] whitespace-pre-line leading-relaxed">
                        {event.summary}
                    </p>
                )}

                {/* 자세히 보기 CTA */}
                <div className="mt-10 text-center">
                    <Link
                        href="/events"
                        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-fg)] px-6 py-3 text-sm font-medium hover:border-[var(--color-border-strong)]"
                    >
                        ← 이벤트 목록으로
                    </Link>
                </div>
            </article>
        </div>
    );
}
