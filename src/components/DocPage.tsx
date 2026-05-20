export function DocPage({ title, version, lastUpdated, children }: {
    title: string;
    version: string;
    lastUpdated: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <header className="mb-6 border-b border-[var(--color-border)] pb-3">
                <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-fg)]">{title}</h1>
                <p className="text-xs text-[var(--color-fg-muted)] mt-1">버전 {version} · 최종 수정 {lastUpdated}</p>
            </header>
            <article className="prose prose-sm max-w-none [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-[var(--color-fg)] [&_p]:leading-relaxed [&_p]:my-2 text-sm text-[var(--color-fg)]">
                {children}
            </article>
        </div>
    );
}
