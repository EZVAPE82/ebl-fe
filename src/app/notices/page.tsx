import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Notice, Page } from "@/types/api";

export const dynamic = "force-dynamic";

async function fetchNotices(page: number): Promise<Page<Notice>> {
    try {
        return await api<Page<Notice>>(`/api/v1/public/notices?page=${page}&size=20`, { cache: "no-store" });
    } catch {
        return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, empty: true };
    }
}

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const sp = await searchParams;
    const page = parseInt(sp.page ?? "0", 10);
    const list = await fetchNotices(page);

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-xl md:text-2xl font-bold mb-6">공지사항</h1>

            {list.content.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-12">등록된 공지가 없습니다.</p>
            ) : (
                <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
                    {list.content.map(n => (
                        <li key={n.id}>
                            <Link href={`/notices/${n.id}`} className="block px-4 py-3 hover:bg-zinc-50">
                                <div className="flex items-start gap-2">
                                    {n.pinned && (
                                        <span className="rounded bg-rose-100 text-rose-700 px-1.5 py-0.5 text-[10px] font-medium">필독</span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium line-clamp-1">{n.title}</div>
                                        <div className="text-xs text-zinc-500 mt-0.5">{formatDate(n.createdAt)} · 조회 {n.viewCount}</div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {list.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-1 text-sm">
                    {Array.from({ length: list.totalPages }, (_, i) => i).map(i => (
                        <Link
                            key={i}
                            href={`/notices?page=${i}`}
                            className={`px-3 py-1 rounded border ${
                                i === page ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300"
                            }`}
                        >{i + 1}</Link>
                    ))}
                </div>
            )}
        </div>
    );
}
