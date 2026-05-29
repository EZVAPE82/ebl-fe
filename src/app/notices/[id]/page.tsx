import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Notice } from "@/types/api";

export const dynamic = "force-dynamic";

/* 시안 34:9462 매칭 — NOTICE 상세 페이지. */

const MOCK_DETAIL: Notice = {
    id: 1001,
    title: "설 연휴 물류 일정 조정으로 인한 배송 지연 안내드립니다",
    pinned: true,
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
} as unknown as Notice;

export default async function NoticeDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let n: Notice;
    try {
        n = await api<Notice>(`/api/v1/public/notices/${id}`, { cache: "no-store" });
    } catch (e) {
        // 404 또는 fetch 실패 시 목데이터 fallback
        if (e instanceof ApiError) {
            n = MOCK_DETAIL;
        } else {
            n = MOCK_DETAIL;
        }
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
            {/* 큰 타이틀 */}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                NOTICE
            </h1>

            {/* 굵은 구분선 */}
            <hr className="border-t-2 border-[var(--color-fg)] mb-6 md:mb-8" />

            {/* 제목 */}
            <h2 className="text-lg md:text-2xl font-bold text-[var(--color-fg)] mb-3 md:mb-4">
                {n.title}
            </h2>

            {/* 메타: 작성자 / 게시일 / 조회수 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-[var(--color-fg-muted)] pb-6 border-b border-[var(--color-border)]">
                <span><span className="font-medium text-[var(--color-fg)]">작성자</span> <span className="ml-2">시그널디코드</span></span>
                <span className="text-[var(--color-fg-subtle)]">|</span>
                <span><span className="font-medium text-[var(--color-fg)]">게시일</span> <span className="ml-2 tabular-nums">{formatDate(n.createdAt)}</span></span>
                <span className="text-[var(--color-fg-subtle)]">|</span>
                <span><span className="font-medium text-[var(--color-fg)]">조회수</span> <span className="ml-2 tabular-nums">{n.viewCount}</span></span>
            </div>

            {/* 본문 */}
            <article className="py-8 md:py-12">
                <div className="text-sm md:text-base text-[var(--color-fg)] leading-relaxed whitespace-pre-line max-w-4xl">
                    {n.content}
                </div>
            </article>

            {/* 구분선 + 목록으로 버튼 */}
            <hr className="border-t border-[var(--color-border)] mb-8 md:mb-10" />
            <div className="flex justify-center">
                <Link
                    href="/notices"
                    className="inline-flex items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-10 py-3 text-sm md:text-base text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                >
                    목록으로
                </Link>
            </div>
        </div>
    );
}
