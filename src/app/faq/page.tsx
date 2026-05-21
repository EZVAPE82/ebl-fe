import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

type Faq = {
    id: number;
    category: string | null;
    question: string;
    answer: string;
    sortOrder: number;
    visible: boolean;
};

type Sort = "newest" | "rating" | "recommended";

async function fetchFaqs(): Promise<Faq[]> {
    try {
        return await api<Faq[]>("/api/v1/public/faqs", { cache: "no-store" });
    } catch {
        return [];
    }
}

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ sort?: Sort }> }) {
    const sp = await searchParams;
    const sort: Sort = sp.sort === "rating" ? "rating" : sp.sort === "recommended" ? "recommended" : "newest";

    const faqs = await fetchFaqs();
    // 정렬 표시는 시각만 — 백엔드에 평점·추천 메타 없어서 newest 외 동일 결과
    const sorted = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--color-fg)] tracking-tight">FAQ</h1>

            {/* 정렬 토글 */}
            <div className="flex gap-2 mb-6">
                <SortTab href="/faq?sort=newest"      label="최신순"  active={sort === "newest"} />
                <SortTab href="/faq?sort=rating"      label="별점순"  active={sort === "rating"} />
                <SortTab href="/faq?sort=recommended" label="추천순"  active={sort === "recommended"} />
            </div>

            <hr className="border-[var(--color-fg)] mb-1" />

            {sorted.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-16">등록된 FAQ가 없습니다.</p>
            ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                    {sorted.map((f, i) => (
                        <li key={f.id}>
                            <details className="group" {...(i === 0 ? { open: true } : {})}>
                                <summary className="cursor-pointer list-none px-1 py-4 flex items-start gap-3 hover:bg-[var(--color-bg-subtle)] transition">
                                    <span className="text-[var(--color-accent)] font-bold flex-shrink-0">Q.</span>
                                    <span className="flex-1 text-sm md:text-base text-[var(--color-accent)] line-clamp-2">{f.question}</span>
                                    <span className="text-[var(--color-fg-subtle)] text-sm group-open:rotate-180 transition flex-shrink-0">⌃</span>
                                </summary>
                                <div className="px-1 py-4 bg-[var(--color-bg-subtle)] flex items-start gap-3 border-l-2 border-[var(--color-accent)]">
                                    <span className="text-[var(--color-fg-muted)] font-bold flex-shrink-0 pl-3">A.</span>
                                    <p className="flex-1 pr-3 text-sm text-[var(--color-fg)] whitespace-pre-line">{f.answer}</p>
                                </div>
                            </details>
                        </li>
                    ))}
                </ul>
            )}

            {/* 페이지네이션 (현재 시드 5개라 표시 의미 없지만 시각 톤 일치) */}
            {sorted.length > 0 && (
                <div className="mt-10 flex justify-center items-center gap-1.5 text-sm">
                    <span className="min-w-8 h-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] border border-[var(--color-brand)]">1</span>
                </div>
            )}
        </div>
    );
}

function SortTab({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center rounded-[var(--radius-sm)] px-4 py-1.5 text-sm transition ${
                active
                    ? "bg-[var(--color-accent)] text-white font-medium"
                    : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
            }`}
        >
            {label}
        </Link>
    );
}
