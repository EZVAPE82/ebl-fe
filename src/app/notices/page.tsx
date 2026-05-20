import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui";
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
            <h1 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--color-fg)]">공지사항</h1>

            {list.content.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-12">등록된 공지가 없습니다.</p>
            ) : (
                <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                    {list.content.map(n => (
                        <li key={n.id}>
                            <Link href={`/notices/${n.id}`} className="block px-4 py-3.5 hover:bg-[var(--color-bg-subtle)]">
                                <div className="flex items-start gap-2">
                                    {n.pinned && <Badge size="sm" tone="danger">필독</Badge>}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium line-clamp-1 text-[var(--color-fg)]">{n.title}</div>
                                        <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">{formatDate(n.createdAt)} · 조회 {n.viewCount}</div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {list.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-1.5 text-sm">
                    {Array.from({ length: list.totalPages }, (_, i) => i).map(i => {
                        const active = i === page;
                        return (
                            <Link
                                key={i}
                                href={`/notices?page=${i}`}
                                className={`min-w-9 text-center px-3 py-1.5 rounded-[var(--radius-sm)] border transition ${
                                    active
                                        ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)] border-[var(--color-brand)]"
                                        : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
                                }`}
                            >{i + 1}</Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
