import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { safeImageUrl } from "@/lib/url";
import { cleanHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/* Figma 이벤트 디테일 — WE ARE EVENT (가운데 정렬 본문 + 메타 + 이미지/본문) */

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

/** ISO/날짜 문자열 → "YY.MM.DD" (없으면 빈 문자열). */
function fmtYYMMDD(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = String(d.getFullYear()).slice(-2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
}

/** 본문이 HTML 태그를 포함하는지 (대략) — 태그가 있으면 dangerouslySetInnerHTML 로 렌더. */
function looksLikeHtml(s: string): boolean {
    return /<[a-z][\s\S]*>/i.test(s);
}

function MetaItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#000]">{label}</span>
            <span className="w-px h-3 bg-[#E5E5EC]" />
            <span className="text-[14px] text-[#767676]">{value}</span>
        </div>
    );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await fetchEvent(id);

    const img = event.bannerUrl ? safeImageUrl(event.bannerUrl) : "";
    const body = event.content?.trim() ?? "";
    const dateText = fmtYYMMDD(event.createdAt ?? event.startsAt);
    const views = (event.viewCount ?? 0).toLocaleString();

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20">
            <div className="flex flex-col gap-8">
                {/* 1) 큰 타이틀 */}
                <h1 className="text-[40px] md:text-[56px] font-bold leading-tight text-[#222222]">
                    WE ARE EVENT
                </h1>

                {/* 2) 본문 컬럼 — 가운데 정렬 */}
                <div className="flex flex-col items-center gap-[60px]">
                    {/* a) 메타 + 이미지 그룹 */}
                    <div className="w-full flex flex-col">
                        {/* 메타 블록 */}
                        <div className="border-t border-[#222] pt-6 pb-6 flex flex-col gap-3">
                            <h2 className="text-[24px] font-medium text-[#222222]">{event.title}</h2>
                            <div className="flex flex-wrap items-center gap-4">
                                <MetaItem label="작성자" value="엘프바 코리아" />
                                <MetaItem label="게시일" value={dateText || "-"} />
                                <MetaItem label="조회수" value={views} />
                            </div>
                        </div>

                        {/* 이미지 / 본문 블록 */}
                        <div className="border-y border-[#E5E5EC] py-10 flex justify-center">
                            {img ? (
                                <div className="w-full max-w-[860px]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={img}
                                        alt={event.title}
                                        className="w-full max-w-[860px] h-auto object-contain"
                                    />
                                </div>
                            ) : body ? (
                                <div className="w-full max-w-[860px] text-[15px] leading-7 text-[#333] whitespace-pre-line">
                                    {looksLikeHtml(body) ? (
                                        <div dangerouslySetInnerHTML={{ __html: cleanHtml(body) }} />
                                    ) : (
                                        body
                                    )}
                                </div>
                            ) : (
                                <div className="w-full max-w-[860px] aspect-[860/480] bg-[#D9D9D9]" />
                            )}
                        </div>
                    </div>

                    {/* b) 더 알아보기 버튼 */}
                    <Link
                        href="/events"
                        className="w-[160px] p-4 rounded-[4px] border border-[#DDDDDD] text-center text-[14px] font-medium text-[#000]"
                    >
                        더 알아보기
                    </Link>
                </div>
            </div>
        </div>
    );
}
