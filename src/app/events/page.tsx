import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { safeImageUrl } from "@/lib/url";
import type { Page } from "@/types/api";

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
};

type Filter = "active" | "ended";

async function fetchEvents(): Promise<Event[]> {
    try {
        const p = await api<Page<Event>>("/api/v1/public/events?size=20", { cache: "no-store" });
        return p.content;
    } catch {
        return [];
    }
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ filter?: Filter }> }) {
    const sp = await searchParams;
    const filter: Filter = sp.filter === "ended" ? "ended" : "active";

    const all = await fetchEvents();
    // server component 라 요청마다 새 evaluation. impure 규칙 무해.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const events = all.filter(e => {
        const ended = e.endsAt && new Date(e.endsAt).getTime() < now;
        return filter === "ended" ? ended : !ended;
    });

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--color-fg)] tracking-tight">WE ARE EVENT</h1>

            {/* 토글 필터 */}
            <div className="flex gap-2 mb-8">
                <FilterTab href="/events?filter=active" label="진행중인 이벤트" active={filter === "active"} />
                <FilterTab href="/events?filter=ended"  label="종료된 이벤트"   active={filter === "ended"}  />
            </div>

            {events.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-16">
                    {filter === "active" ? "진행 중인 이벤트가 없습니다." : "종료된 이벤트가 없습니다."}
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {events.map(e => (
                        <Link
                            key={e.id}
                            href={`/events/${e.id}`}
                            className="block rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition group"
                        >
                            <div className="aspect-[16/9] bg-[var(--color-bg-subtle)] overflow-hidden">
                                {e.bannerUrl && safeImageUrl(e.bannerUrl) && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={safeImageUrl(e.bannerUrl)}
                                        alt={e.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                )}
                            </div>
                            <div className="p-5">
                                <h2 className="font-semibold text-base md:text-lg line-clamp-1 text-[var(--color-fg)]">{e.title}</h2>
                                {e.summary && <p className="text-sm text-[var(--color-fg-muted)] mt-1 line-clamp-2">{e.summary}</p>}
                                {e.endsAt && (
                                    <p className="text-xs text-[var(--color-fg-subtle)] mt-3">
                                        ~ {formatDate(e.endsAt)} 까지
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterTab({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition ${
                active
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}
