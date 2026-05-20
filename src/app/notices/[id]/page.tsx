import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui";
import type { Notice } from "@/types/api";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NoticeDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let n: Notice;
    try {
        n = await api<Notice>(`/api/v1/public/notices/${id}`, { cache: "no-store" });
    } catch (e) {
        if (e instanceof ApiError && e.status === 404) notFound();
        throw e;
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <Link href="/notices" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">← 공지사항 목록</Link>

            <article className="mt-3">
                <div className="flex items-start gap-2">
                    {n.pinned && <Badge size="sm" tone="danger">필독</Badge>}
                    <h1 className="text-xl md:text-2xl font-semibold flex-1 text-[var(--color-fg)]">{n.title}</h1>
                </div>
                <div className="text-xs text-[var(--color-fg-muted)] mt-2 mb-6 border-b border-[var(--color-border)] pb-3">
                    {formatDate(n.createdAt)} · 조회 {n.viewCount}
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-line text-[var(--color-fg)]">
                    {n.content}
                </div>
            </article>
        </div>
    );
}
