import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Notice } from "@/types/api";

export const dynamic = "force-dynamic";

/* Figma 공지사항 상세 — NOTICE (가운데 정렬 본문 + 메타 + 텍스트 본문) */

const MOCK_DETAIL: Notice = {
    id: 1001,
    title: "설 연휴 물류 일정 조정으로 인한 배송 지연 안내드립니다",
    pinned: true,
    visible: true,
    createdAt: "2026-05-22T10:00:00",
    viewCount: 128,
    content:
`안녕하세요. 항상 저희 쇼핑몰을 이용해 주시는 고객님께 진심으로 감사드립니다.
다가오는 설 연휴 기간 동안 택배사 휴무 및 전국적인 물류 물량 증가로 인해 일부 주문 건의 출고 및 배송이 평소보다 지연될 수 있어 사전 안내드립니다.

고객님께 불편을 드리지 않기 위해 미리 안내드리오니, 주문 전 아래 내용을 꼭 참고해 주시기 바랍니다.

설 연휴 기간 동안 원활한 배송 서비스를 제공하지 못해 대단히 죄송합니다. 저희는 연휴 이후 최대한 신속하게 출고 및 배송이 이루어질 수 있도록 물류 및 고객 응대에 최선을 다하겠습니다.

설 연휴 기간에도 상품 주문 및 결제는 정상적으로 이용 가능합니다. 다만, 연휴 기간 동안 접수된 주문 건은 연휴 종료 후 순차적으로 출고되오니 배송 일정에 여유를 두고 주문해 주시기 바랍니다.
빠른 수령이 필요하신 경우, 연휴 이전 주문을 권장드립니다.

설 연휴 기간 동안 고객센터 운영이 제한되며, 전화 상담은 운영되지 않을 수 있습니다.
1:1 문의 및 게시판 상담은 접수만 가능하며, 연휴 이후 순차적으로 답변드릴 예정입니다.

고객님의 너그러운 양해를 부탁드리며, 가족과 함께 따뜻하고 행복한 설 연휴 보내시길 바랍니다.

감사합니다.`,
};

async function fetchNotice(id: string): Promise<Notice> {
    try {
        return await api<Notice>(`/api/v1/public/notices/${id}`, { cache: "no-store" });
    } catch (e) {
        // 404 또는 fetch 실패 시 목데이터 fallback
        if (e instanceof ApiError) return MOCK_DETAIL;
        return MOCK_DETAIL;
    }
}

/** ISO/날짜 문자열 → "YY.MM.DD" (없으면 "-"). */
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

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const notice = await fetchNotice(id);

    const body = notice.content?.trim() ?? "";
    const isHtml = looksLikeHtml(body);
    // 평문은 빈 줄 기준 문단 분리.
    const paragraphs = isHtml ? [] : body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const dateText = fmtYYMMDD(notice.createdAt);
    const views = (notice.viewCount ?? 0).toLocaleString();

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20">
            <div className="flex flex-col items-center gap-[60px]">
                {/* 1) 타이틀 + 메타 + 본문 */}
                <div className="w-full flex flex-col gap-8">
                    {/* 큰 타이틀 */}
                    <h1 className="text-[40px] md:text-[56px] font-bold leading-tight text-[#222222]">
                        NOTICE
                    </h1>

                    <div className="w-full flex flex-col">
                        {/* 메타 블록 */}
                        <div className="border-t border-[#222] pt-6 pb-6 flex flex-col gap-3">
                            <h2 className="text-[24px] font-medium text-[#000]">{notice.title}</h2>
                            <div className="flex flex-wrap items-center gap-4">
                                <MetaItem label="작성자" value="엘프바 코리아" />
                                <MetaItem label="게시일" value={dateText || "-"} />
                                <MetaItem label="조회수" value={views} />
                            </div>
                        </div>

                        {/* 본문 블록 */}
                        <div className="border-y border-[#DDDDDD] py-10 flex flex-col gap-6">
                            {isHtml ? (
                                <div
                                    className="text-[16px] text-[#767676] leading-6 [&_p]:mb-4 [&_a]:underline"
                                    dangerouslySetInnerHTML={{ __html: body }}
                                />
                            ) : paragraphs.length > 0 ? (
                                paragraphs.map((p, i) => (
                                    <p
                                        key={i}
                                        className="text-[16px] text-[#767676] leading-6 whitespace-pre-line"
                                    >
                                        {p}
                                    </p>
                                ))
                            ) : (
                                <p className="text-[16px] text-[#767676] leading-6">
                                    등록된 내용이 없습니다.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2) 목록으로 버튼 — 본문 좌측 정렬 */}
                <div className="w-full flex justify-start">
                    <Link
                        href="/notices"
                        className="w-[160px] p-4 rounded-[4px] border border-[#DDDDDD] text-center text-[14px] font-medium text-[#000]"
                    >
                        목록으로
                    </Link>
                </div>
            </div>
        </div>
    );
}
