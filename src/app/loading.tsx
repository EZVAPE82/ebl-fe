/**
 * 기본 로딩 UI — 모든 server component fetch 동안 표시.
 * 시안의 spinner 톤. 페이지별 loading.tsx 가 있으면 그것이 우선.
 */
export default function Loading() {
    return (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
            <div className="inline-block w-10 h-10 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-fg)] animate-spin" />
            <p className="mt-4 text-sm text-[var(--color-fg-muted)]">불러오는 중...</p>
        </div>
    );
}
