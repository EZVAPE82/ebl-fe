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

async function fetchEvents(): Promise<Event[]> {
    try {
        const p = await api<Page<Event>>("/api/v1/public/events?size=20", { cache: "no-store" });
        return p.content;
    } catch {
        return [];
    }
}

export default async function EventsPage() {
    const events = await fetchEvents();

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-8">
            <h1 className="text-xl md:text-2xl font-bold mb-6">이벤트</h1>

            {events.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-12">진행 중인 이벤트가 없습니다.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map(e => (
                        <Link key={e.id} href="#" className="rounded-md overflow-hidden border border-zinc-200 hover:border-zinc-400">
                            <div className="aspect-[16/7] bg-zinc-100">
                                {e.bannerUrl && safeImageUrl(e.bannerUrl) && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={safeImageUrl(e.bannerUrl)} alt={e.title} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="p-4">
                                <h2 className="font-semibold text-base line-clamp-1">{e.title}</h2>
                                {e.summary && <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{e.summary}</p>}
                                {e.endsAt && (
                                    <p className="text-xs text-zinc-500 mt-2">
                                        ~{formatDate(e.endsAt)} 까지
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
