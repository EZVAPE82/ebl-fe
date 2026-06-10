import Link from "next/link";
import { api } from "@/lib/api";
import type { Notice, Page } from "@/types/api";

export const dynamic = "force-dynamic";

/* ---- Figma NOTICE(공지사항) 목록 — 1920 컨테이너 / xl px-[170px]. 데이터·상세링크 보존, 레이아웃만 재구성. ---- */

// 백엔드 비어있을 때 시안에 보이는 형태로 렌더되는 fallback 목데이터.
const MOCK_NOTICES: Notice[] = [
    { id: 1001, title: "주문 폭주로 인한 출고 일정 순차 진행 안내", pinned: true, createdAt: "2026-05-22T10:00:00", viewCount: 245, content: "", visible: true },
    { id: 1002, title: "택배사 물량 증가로 인한 일부 지역 배송 지연 안내", pinned: false, createdAt: "2026-06-08T09:00:00", viewCount: 198, content: "", visible: true },
    { id: 1003, title: "리뷰 작성 적립금 지급 정책 변경 안내", pinned: false, createdAt: "2026-06-03T15:00:00", viewCount: 187, content: "", visible: true },
    { id: 1004, title: "주문 폭주로 인한 출고 일정 순차 진행 안내", pinned: false, createdAt: "2026-05-20T10:00:00", viewCount: 165, content: "", visible: true },
    { id: 1005, title: "무통장 입금 주문 건 확인 지연 관련 안내드립니다", pinned: false, createdAt: "2026-05-19T12:00:00", viewCount: 142, content: "", visible: true },
    { id: 1006, title: "카드사 및 간편결제 시스템 점검으로 인한 결제 제한 안내", pinned: false, createdAt: "2026-05-18T14:00:00", viewCount: 134, content: "", visible: true },
    { id: 1007, title: "환불 처리 절차 및 소요 기간에 대한 상세 안내", pinned: false, createdAt: "2026-05-17T11:00:00", viewCount: 121, content: "", visible: true },
    { id: 1008, title: "신규 회원 가입 시 제공되는 혜택 및 적립금 지급 안내", pinned: false, createdAt: "2026-05-16T10:00:00", viewCount: 110, content: "", visible: true },
    { id: 1009, title: "이벤트 참여 조건 및 혜택 지급 일정 안내드립니다", pinned: false, createdAt: "2026-05-15T16:00:00", viewCount: 98, content: "", visible: true },
];

async function fetchNotices(page: number): Promise<Page<Notice>> {
    try {
        return await api<Page<Notice>>(`/api/v1/public/notices?page=${page}&size=10`, { cache: "no-store" });
    } catch {
        return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10, first: true, last: true, empty: true };
    }
}

// 시안 날짜 포맷: YYYY.MM.DD
function dotDate(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso ?? "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
}

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; field?: string }> }) {
    const sp = await searchParams;
    const page = parseInt(sp.page ?? "0", 10);
    const q = (sp.q ?? "").trim();
    const list = await fetchNotices(page);

    // 백엔드 데이터 비어있으면 목데이터 fallback.
    const isFallback = list.content.length === 0;
    const source = isFallback ? MOCK_NOTICES : list.content;

    // 검색: 제목 기준 클라이언트 필터(백엔드 변경 없이). q 없으면 전체.
    const items = q ? source.filter((n) => n.title.toLowerCase().includes(q.toLowerCase())) : source;

    const total = q ? items.length : isFallback ? 52 : list.totalElements;
    const totalPages = isFallback ? 30 : list.totalPages;
    const pages = compactPagination(page, totalPages);

    const newCutoff = Date.now() - NEW_WINDOW_MS;

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col items-center gap-[60px]">
            <div className="w-full flex flex-col gap-10">
                {/* 1) 타이틀 */}
                <h1 className="text-[40px] md:text-[56px] font-bold leading-tight text-[#222222]">
                    NOTICE
                </h1>

                {/* 2) 리스트 그룹 */}
                <div className="w-full flex flex-col gap-4">
                    {/* 컨트롤 행 */}
                    <div className="flex justify-between items-end">
                        <p className="text-[18px]">
                            <span className="text-[#767676]">Total:</span>
                            <span className="text-[#0072DD]">{total}</span>
                        </p>

                        <form action="/notices" method="get" className="flex items-center gap-3">
                            {/* 드롭다운 shell (제목) */}
                            <div className="relative w-[150px]">
                                <select
                                    name="field"
                                    defaultValue={sp.field ?? "title"}
                                    aria-label="검색 대상"
                                    className="appearance-none w-full p-4 rounded-[4px] border border-[#DDDDDD] bg-white text-[14px] text-[#767676] cursor-pointer focus:outline-none"
                                >
                                    <option value="title">제목</option>
                                    <option value="content">내용</option>
                                </select>
                                <svg
                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#767676"
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>

                            {/* 검색 박스 */}
                            <div className="w-[260px] p-4 rounded-[4px] border border-[#DDDDDD] bg-white flex justify-between items-center">
                                <input
                                    type="search"
                                    name="q"
                                    defaultValue={q}
                                    placeholder="검색어를 입력해주세요"
                                    className="flex-1 min-w-0 bg-transparent text-[14px] text-[#767676] placeholder:text-[#767676] focus:outline-none"
                                />
                                <button type="submit" aria-label="검색" className="flex-shrink-0 ml-2 text-[#767676]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="11" cy="11" r="7" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* 리스트 */}
                    {items.length === 0 ? (
                        <div className="border-t border-[#222]">
                            <p className="text-[16px] text-[#767676] text-center py-20">등록된 공지사항이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="border-t border-[#222] flex flex-col">
                            {items.map((n) => {
                                const isNew = !n.pinned && new Date(n.createdAt).getTime() > newCutoff;
                                return (
                                    <Link
                                        key={n.id}
                                        href={`/notices/${n.id}`}
                                        className={
                                            n.pinned
                                                ? "bg-[#F6F7FB] px-4 py-9 border-b border-[#E5E5EC] flex justify-between items-center"
                                                : "py-7 border-b border-[#E5E5EC] flex justify-between items-center"
                                        }
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {n.pinned ? (
                                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="필독 공지" className="flex-shrink-0">
                                                    <path d="M12 17v5" />
                                                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                                                </svg>
                                            ) : isNew ? (
                                                <span className="flex-shrink-0 px-4 py-3 bg-[#0072DD] rounded-[4px] text-white text-[14px] font-medium leading-none">
                                                    새로운 소식
                                                </span>
                                            ) : null}
                                            <span className="text-[20px] font-medium text-[#000] truncate">{n.title}</span>
                                        </div>
                                        <span className="flex-shrink-0 ml-4 text-[16px] text-[#767676] tabular-nums">{dotDate(n.createdAt)}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 3) 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    {pages.map((p, idx) =>
                        p === "..." ? (
                            <span key={`gap-${idx}`} className="w-8 h-8 inline-flex items-center justify-center text-[14px] text-[#767676]">…</span>
                        ) : (
                            <PageBtn key={p} target={p} label={String(p + 1)} active={p === page} />
                        )
                    )}
                    {page < totalPages - 1 && (
                        <Link
                            href={`/notices?page=${page + 1}`}
                            aria-label="다음 페이지"
                            className="w-8 h-8 rounded-[4px] inline-flex items-center justify-center bg-white text-[#767676] hover:bg-[#F6F7FB]"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

function PageBtn({ target, label, active }: { target: number; label: string; active?: boolean }) {
    return (
        <Link
            href={`/notices?page=${target}`}
            aria-current={active ? "page" : undefined}
            className={`w-8 h-8 rounded-[4px] inline-flex items-center justify-center text-[14px] font-medium ${
                active ? "bg-[#0072DD] text-white" : "bg-white text-[#767676] hover:bg-[#F6F7FB]"
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
