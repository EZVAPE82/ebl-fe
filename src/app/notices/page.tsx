import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui";
import type { Notice, Page } from "@/types/api";

export const dynamic = "force-dynamic";

async function fetchNotices(page: number): Promise<Page<Notice>> {
    try {
        return await api<Page<Notice>>(`/api/v1/public/notices?page=${page}&size=10`, { cache: "no-store" });
    } catch {
        return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10, first: true, last: true, empty: true };
    }
}

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const sp = await searchParams;
    const page = parseInt(sp.page ?? "0", 10);
    const list = await fetchNotices(page);
    const pages = compactPagination(page, list.totalPages);

    // 최근 7일 이내 공지 = "새로운 소식" 뱃지. server component 라 요청마다
    // 새 evaluation 이므로 impure 규칙은 무해.
    // eslint-disable-next-line react-hooks/purity
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--color-fg)] tracking-tight">NOTICE</h1>

            {/* 카운트 + 검색 (시각 placeholder) */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--color-fg)]">
                <p className="text-sm text-[var(--color-fg-muted)]">
                    Total: <span className="text-[var(--color-accent)] font-semibold">{list.totalElements}</span>
                </p>
                <div className="hidden md:flex items-center gap-2">
                    <select className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-xs text-[var(--color-fg)]">
                        <option>제목</option>
                        <option>내용</option>
                    </select>
                    <div className="relative">
                        <input
                            type="search"
                            placeholder="검색어를 입력해주세요"
                            className="w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-xs text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]">🔍</span>
                    </div>
                </div>
            </div>

            {list.content.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-16">등록된 공지가 없습니다.</p>
            ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                    {list.content.map(n => {
                        const isNew = new Date(n.createdAt).getTime() > sevenDaysAgo;
                        return (
                            <li key={n.id}>
                                <Link href={`/notices/${n.id}`} className="flex items-center gap-3 px-1 py-4 hover:bg-[var(--color-bg-subtle)] transition">
                                    <span className="w-24 flex-shrink-0">
                                        {n.pinned && <Badge size="sm" tone="danger">필독</Badge>}
                                        {!n.pinned && isNew && <Badge size="sm" tone="info">새로운 소식</Badge>}
                                    </span>
                                    <span className="flex-1 min-w-0 text-sm text-[var(--color-fg)] line-clamp-1">{n.title}</span>
                                    <span className="text-xs text-[var(--color-fg-muted)] flex-shrink-0">
                                        {formatDate(n.createdAt)}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* 페이지네이션 */}
            {list.totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center gap-1.5 text-sm">
                    {page > 0 && <PageBtn target={page - 1} label="‹" />}
                    {pages.map((p, idx) =>
                        p === "..." ? (
                            <span key={`gap-${idx}`} className="px-2 text-[var(--color-fg-subtle)]">…</span>
                        ) : (
                            <PageBtn key={p} target={p} label={String(p + 1)} active={p === page} />
                        )
                    )}
                    {page < list.totalPages - 1 && <PageBtn target={page + 1} label="›" />}
                </div>
            )}
        </div>
    );
}

function PageBtn({ target, label, active }: { target: number; label: string; active?: boolean }) {
    return (
        <Link
            href={`/notices?page=${target}`}
            className={`min-w-8 h-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] border text-sm transition ${
                active
                    ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)] border-[var(--color-brand)]"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}

function compactPagination(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const out: (number | "...")[] = [];
    out.push(0);
    if (current > 3) out.push("...");
    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);
    for (let i = start; i <= end; i++) out.push(i);
    if (current < total - 4) out.push("...");
    out.push(total - 1);
    return out;
}
