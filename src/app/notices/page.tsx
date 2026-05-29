import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Notice, Page } from "@/types/api";

export const dynamic = "force-dynamic";

/* ---- 시안 34:9437 매칭 — Figma export 한 NOTICE 목록 페이지. ---- */

// 목데이터 fallback — 백엔드 데이터 비어있을 때 시안에 보이는 형태로 렌더.
const MOCK_NOTICES: Notice[] = [
    { id: 1001, title: "주문 폭주로 인한 출고 일정 순차 진행 안내", pinned: true,  createdAt: "2026-05-22T10:00:00", viewCount: 245, content: "" },
    { id: 1002, title: "공지사항 임시텍스트입니다.",                  pinned: false, createdAt: "2026-05-22T09:00:00", viewCount: 198, content: "" },
    { id: 1003, title: "공지사항 임시텍스트입니다.",                  pinned: false, createdAt: "2026-05-21T15:00:00", viewCount: 187, content: "" },
    { id: 1004, title: "주문 폭주로 인한 출고 일정 순차 진행 안내",    pinned: false, createdAt: "2026-05-20T10:00:00", viewCount: 165, content: "" },
    { id: 1005, title: "무통장 입금 주문 건 확인 지연 관련 안내드립니다",pinned: false, createdAt: "2026-05-19T12:00:00", viewCount: 142, content: "" },
    { id: 1006, title: "카드사 및 간편결제 시스템 점검으로 인한 결제 제한 안내", pinned: false, createdAt: "2026-05-18T14:00:00", viewCount: 134, content: "" },
    { id: 1007, title: "환불 처리 절차 및 소요 기간에 대한 상세 안내",   pinned: false, createdAt: "2026-05-17T11:00:00", viewCount: 121, content: "" },
    { id: 1008, title: "신규 회원 가입 시 제공되는 혜택 및 적립금 지급 안내", pinned: false, createdAt: "2026-05-16T10:00:00", viewCount: 110, content: "" },
    { id: 1009, title: "이벤트 참여 조건 및 혜택 지급 일정 안내드립니다", pinned: false, createdAt: "2026-05-15T16:00:00", viewCount: 98,  content: "" },
] as unknown as Notice[];

async function fetchNotices(page: number): Promise<Page<Notice>> {
    try {
        return await api<Page<Notice>>(`/api/v1/public/notices?page=${page}&size=10`, { cache: "no-store" });
    } catch {
        return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10, first: true, last: true, empty: true };
    }
}

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
    const sp = await searchParams;
    const page = parseInt(sp.page ?? "0", 10);
    const list = await fetchNotices(page);

    // 백엔드 데이터 비어있으면 목데이터 fallback
    const isFallback = list.content.length === 0;
    const items = isFallback ? MOCK_NOTICES : list.content;
    const total = isFallback ? 52 : list.totalElements;
    const totalPages = isFallback ? 30 : list.totalPages;
    const pages = compactPagination(page, totalPages);

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
            {/* 큰 타이틀 */}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                NOTICE
            </h1>

            {/* Total + 우측 검색 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b-2 border-[var(--color-fg)]">
                <p className="text-sm text-[var(--color-fg-muted)]">
                    Total: <span className="text-[var(--color-accent)] font-bold">{total}</span>
                </p>
                <form action="/notices" method="get" className="flex items-center gap-2">
                    {/* 커스텀 select — 기본 화살표 숨김(appearance-none) + 우측에 SVG chevron. */}
                    <div className="relative">
                        <select
                            name="field"
                            className="appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] pl-3 pr-8 py-2 text-sm text-[var(--color-fg)] cursor-pointer focus:outline-none focus:border-[var(--color-fg)]"
                            defaultValue="title"
                        >
                            <option value="title">제목</option>
                            <option value="content">내용</option>
                        </select>
                        <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] pointer-events-none"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                    <div className="relative">
                        <input
                            type="search"
                            name="q"
                            placeholder="검색어를 입력해주세요"
                            defaultValue={sp.q ?? ""}
                            className="w-48 md:w-64 bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 pr-10 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg)]"
                        />
                        <button type="submit" aria-label="검색" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-16">등록된 공지가 없습니다.</p>
            ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                    {items.map((n, i) => {
                        // mock fallback 모드일 때: 시안 매칭 — index 1, 2 (핀 다음 두 row) 강제 NEW.
                        // 실데이터: createdAt 기준 7일 이내면 NEW.
                        const isNew = isFallback
                            ? (i === 1 || i === 2)
                            : new Date(n.createdAt).getTime() > sevenDaysAgo;
                        return (
                            <li key={n.id}>
                                <Link
                                    href={`/notices/${n.id}`}
                                    className={`flex items-center gap-3 md:gap-4 px-3 md:px-4 py-5 hover:bg-[var(--color-bg-subtle)] transition ${n.pinned ? "bg-[var(--color-bg-subtle)]" : ""}`}
                                >
                                    {/* 좌측 영역: 핀 아이콘 또는 "새로운 소식" 뱃지 (시안 매칭, 라운딩 X) */}
                                    {n.pinned ? (
                                        <span aria-label="필독 공지" className="text-xl flex-shrink-0">📌</span>
                                    ) : isNew ? (
                                        <span className="inline-flex items-center justify-center bg-[var(--color-accent)] text-white text-xs font-medium px-3 py-1.5 flex-shrink-0">
                                            새로운 소식
                                        </span>
                                    ) : null}
                                    {/* 제목 */}
                                    <span className="flex-1 min-w-0 text-sm md:text-base text-[var(--color-fg)] line-clamp-1">
                                        {n.title}
                                    </span>
                                    {/* 날짜 */}
                                    <span className="text-xs md:text-sm text-[var(--color-fg-muted)] flex-shrink-0 tabular-nums">
                                        {formatDate(n.createdAt)}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="mt-10 md:mt-14 flex justify-center items-center gap-1.5 text-sm">
                    {pages.map((p, idx) =>
                        p === "..." ? (
                            <span key={`gap-${idx}`} className="px-2 text-[var(--color-fg-subtle)]">…</span>
                        ) : (
                            <PageBtn key={p} target={p} label={String(p + 1)} active={p === page} />
                        )
                    )}
                    {page < totalPages - 1 && <PageBtn target={page + 1} label="›" />}
                </div>
            )}
        </div>
    );
}

function PageBtn({ target, label, active }: { target: number; label: string; active?: boolean }) {
    return (
        <Link
            href={`/notices?page=${target}`}
            className={`min-w-9 h-9 inline-flex items-center justify-center rounded-[10px] text-sm transition ${
                active
                    ? "bg-[var(--color-accent)] text-white font-medium"
                    : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}

function compactPagination(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const out: (number | "...")[] = [];
    for (let i = 0; i < 5; i++) out.push(i);
    out.push("...");
    out.push(total - 1);
    return out;
}
