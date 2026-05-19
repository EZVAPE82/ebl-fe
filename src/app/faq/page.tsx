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

    // 카테고리별 그룹핑
    const groups = new Map<string, Faq[]>();
    for (const f of faqs) {
        const k = f.category ?? "기타";
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(f);
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-xl md:text-2xl font-bold mb-6">자주 묻는 질문</h1>

            {faqs.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-12">등록된 FAQ가 없습니다.</p>
            ) : (
                <div className="space-y-6">
                    {Array.from(groups.entries()).map(([cat, items]) => (
                        <section key={cat}>
                            <h2 className="text-sm font-semibold text-zinc-700 mb-2">{cat}</h2>
                            <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
                                {items.map(f => (
                                    <details key={f.id} className="group">
                                        <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 hover:bg-zinc-50">
                                            <span className="text-sm flex-1">{f.question}</span>
                                            <span className="text-zinc-400 text-xs group-open:rotate-180 transition">▼</span>
                                        </summary>
                                        <div className="px-4 py-3 bg-zinc-50 text-sm text-zinc-700 whitespace-pre-line border-t border-zinc-200">
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
