import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

/* 시안 34:9497 매칭 — FAQ 페이지 (아코디언 + 정렬 탭 + 페이지네이션). */

type Faq = {
    id: number;
    category: string | null;
    question: string;
    answer: string;
    sortOrder: number;
    visible: boolean;
};

type Sort = "newest" | "rating" | "recommended";

// 목데이터 fallback
const MOCK_FAQS: Faq[] = [
    {
        id: 1,
        category: "주문/결제",
        question: "주문 후 결제 방법을 변경할 수 있나요?",
        answer: "결제 완료 전이라면 마이페이지 > 주문내역에서 결제 수단을 변경할 수 있습니다. 이미 결제가 완료된 주문은 변경이 어려우며, 주문 취소 후 재주문이 필요합니다.",
        sortOrder: 1,
        visible: true,
    },
    {
        id: 2,
        category: "배송",
        question: "배송은 얼마나 걸리나요?",
        answer: "평일 오후 2시 이전에 결제 완료된 주문 건은 당일 출고되며, 일반적으로 1~2일 이내에 수령 가능합니다. 도서산간 지역은 추가 1~2일 소요될 수 있습니다.",
        sortOrder: 2,
        visible: true,
    },
    {
        id: 3,
        category: "배송",
        question: "배송 조회는 어디서 하나요?",
        answer: "마이페이지 > 주문내역에서 송장번호 확인이 가능하며, 송장번호 클릭 시 택배사 홈페이지로 이동하여 실시간 배송 조회가 가능합니다.",
        sortOrder: 3,
        visible: true,
    },
    {
        id: 4,
        category: "교환/반품",
        question: "교환·반품은 어떻게 신청하나요?",
        answer: "상품 수령 후 7일 이내 마이페이지 > 주문내역 > 교환/반품 신청 버튼을 통해 신청 가능합니다. 단순 변심의 경우 왕복 택배비가 차감됩니다.",
        sortOrder: 4,
        visible: true,
    },
    {
        id: 5,
        category: "회원",
        question: "성인 인증은 어떻게 하나요?",
        answer: "회원가입 후 마이페이지 > 회원정보 > 성인 인증에서 휴대폰 본인 인증 또는 신분증 인증으로 진행 가능합니다. 만 19세 이상만 인증 가능합니다.",
        sortOrder: 5,
        visible: true,
    },
    {
        id: 6,
        category: "적립금/쿠폰",
        question: "적립금은 언제 지급되나요?",
        answer: "구매 적립금은 배송 완료 후 7일이 지난 시점에 자동 지급됩니다. 리뷰 적립금은 리뷰 작성 즉시 지급되며, 포토 리뷰는 일반 리뷰의 2배가 지급됩니다.",
        sortOrder: 6,
        visible: true,
    },
    {
        id: 7,
        category: "적립금/쿠폰",
        question: "쿠폰은 중복 사용 가능한가요?",
        answer: "쿠폰별로 중복 사용 정책이 다릅니다. 일반적으로 할인 쿠폰은 1개만 사용 가능하며, 배송비 쿠폰과 할인 쿠폰은 함께 사용 가능합니다.",
        sortOrder: 7,
        visible: true,
    },
    {
        id: 8,
        category: "기타",
        question: "정품 여부는 어떻게 확인하나요?",
        answer: "엘프바 라운지는 공식 인증 판매처로서 100% 정품만 취급합니다. 모든 상품에는 정품 인증 스티커가 부착되어 있으며, 제조사 홈페이지에서 시리얼 넘버로 정품 인증이 가능합니다.",
        sortOrder: 8,
        visible: true,
    },
];

async function fetchFaqs(): Promise<Faq[]> {
    try {
        return await api<Faq[]>("/api/v1/public/faqs", { cache: "no-store" });
    } catch {
        return [];
    }
}

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ sort?: Sort; open?: string }> }) {
    const sp = await searchParams;
    const sort: Sort = sp.sort === "rating" ? "rating" : sp.sort === "recommended" ? "recommended" : "newest";
    const openId = sp.open ? parseInt(sp.open, 10) : null;

    const fetched = await fetchFaqs();
    const isFallback = fetched.length === 0;
    const faqs = isFallback ? MOCK_FAQS : fetched;
    const sorted = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
            {/* 큰 타이틀 */}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-10 text-[var(--color-fg)] tracking-tight">
                FAQ
            </h1>

            {/* 정렬 탭 */}
            <div className="flex gap-2 mb-6 md:mb-8">
                <SortTab href="/faq?sort=newest"      label="최신순"  active={sort === "newest"} />
                <SortTab href="/faq?sort=rating"      label="별점순"  active={sort === "rating"} />
                <SortTab href="/faq?sort=recommended" label="추천순"  active={sort === "recommended"} />
            </div>

            {/* 굵은 구분선 */}
            <hr className="border-t-2 border-[var(--color-fg)] mb-1" />

            {sorted.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-16">등록된 FAQ가 없습니다.</p>
            ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                    {sorted.map((f, i) => {
                        // 기본: 첫 번째 항목 펼침. ?open=id 로 명시되면 해당 항목.
                        const isOpen = openId !== null ? openId === f.id : i === 0;
                        return (
                            <li key={f.id}>
                                <details open={isOpen} className="group">
                                    <summary className="cursor-pointer list-none px-4 md:px-6 py-5 md:py-6 flex items-start gap-3 md:gap-4 hover:bg-[var(--color-bg-subtle)] transition">
                                        <span className="text-[var(--color-accent)] font-bold text-sm md:text-base flex-shrink-0">Q.</span>
                                        <span className="flex-1 text-sm md:text-base text-[var(--color-accent)] font-medium line-clamp-2">{f.question}</span>
                                        <span className="text-[var(--color-fg-muted)] flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </span>
                                    </summary>
                                    {/* 답변 — 펼쳐졌을 때만 표시. 회색 배경 + A. 라벨 (시안: 사각형, 라운딩 X) */}
                                    <div className="mx-4 md:mx-6 mb-4 md:mb-5 px-4 md:px-6 py-5 md:py-6 bg-[var(--color-bg-subtle)] flex items-start gap-3 md:gap-4">
                                        <span className="text-[var(--color-fg-muted)] font-bold text-sm md:text-base flex-shrink-0">A.</span>
                                        <p className="flex-1 text-sm md:text-base text-[var(--color-fg)] whitespace-pre-line leading-relaxed">
                                            {f.answer}
                                        </p>
                                    </div>
                                </details>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* 페이지네이션 (시안 매칭, 단일 페이지지만 시각 톤 유지) */}
            {sorted.length > 0 && (
                <div className="mt-10 md:mt-14 flex justify-center items-center gap-1.5 text-sm">
                    <span className="min-w-9 h-9 inline-flex items-center justify-center rounded-[10px] bg-[var(--color-accent)] text-white font-medium">1</span>
                    {[2, 3, 4, 5].map(p => (
                        <span key={p} className="min-w-9 h-9 inline-flex items-center justify-center rounded-[10px] text-[var(--color-fg-muted)]">{p}</span>
                    ))}
                    <span className="px-2 text-[var(--color-fg-subtle)]">…</span>
                    <span className="min-w-9 h-9 inline-flex items-center justify-center rounded-[10px] text-[var(--color-fg-muted)]">30</span>
                    <span className="min-w-9 h-9 inline-flex items-center justify-center rounded-[10px] text-[var(--color-fg-muted)]">›</span>
                </div>
            )}
        </div>
    );
}

function SortTab({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center rounded-[18px] px-5 py-2 text-sm transition ${
                active
                    ? "bg-[var(--color-accent)] text-white font-medium"
                    : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}
