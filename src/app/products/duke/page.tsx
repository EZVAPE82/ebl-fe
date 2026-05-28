import Link from "next/link";

export const metadata = { title: "ELFBAR DUKE 시그니처" };

/**
 * DUKE 시리즈 상세 페이지 — 시안 96:11673 통이미지.
 * 통이미지 자체에 모든 정보(제품/스펙/사용법 등) 베이크.
 * 인터랙티브 영역만 별도 overlay 필요 시 추가.
 */
export default function DukeProductPage() {
    return (
        <div className="bg-[var(--color-bg)]">
            <Link href="/c/disposable" className="block mx-auto max-w-screen-2xl px-4 py-3 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                ← 일회용 카테고리
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/page-duke.png" alt="ELFBAR DUKE 시그니처" className="w-full block" />
            <div className="mx-auto max-w-screen-2xl px-4 py-8 flex justify-center">
                <Link
                    href="/c/disposable"
                    className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-brand-hover)]"
                >
                    구매하러 가기
                </Link>
            </div>
        </div>
    );
}
