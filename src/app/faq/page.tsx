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

async function fetchFaqs(): Promise<Faq[]> {
    try {
        return await api<Faq[]>("/api/v1/public/faqs", { cache: "no-store" });
    } catch {
        return [];
    }
}

export default async function FaqPage() {
    const faqs = await fetchFaqs();

    const groups = new Map<string, Faq[]>();
    for (const f of faqs) {
        const k = f.category ?? "기타";
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(f);
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--color-fg)]">자주 묻는 질문</h1>

            {faqs.length === 0 ? (
                <p className="text-sm text-[var(--color-fg-subtle)] text-center py-12">등록된 FAQ가 없습니다.</p>
            ) : (
                <div className="space-y-6">
                    {Array.from(groups.entries()).map(([cat, items]) => (
                        <section key={cat}>
                            <h2 className="text-base font-medium text-[var(--color-fg)] mb-2">{cat}</h2>
                            <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                                {items.map(f => (
                                    <details key={f.id} className="group">
                                        <summary className="cursor-pointer list-none px-4 py-3.5 flex items-center gap-2 hover:bg-[var(--color-bg-subtle)]">
                                            <span className="text-sm flex-1 text-[var(--color-fg)]">{f.question}</span>
                                            <span className="text-[var(--color-fg-subtle)] text-xs group-open:rotate-180 transition">▼</span>
                                        </summary>
                                        <div className="px-4 py-3.5 bg-[var(--color-bg-subtle)] text-sm text-[var(--color-fg)] whitespace-pre-line border-t border-[var(--color-border)]">
                                            {f.answer}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
