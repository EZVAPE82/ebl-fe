import Link from "next/link";

export const metadata = { title: "ICE KING" };

/**
 * 아이스킹 제품 페이지 — 시안 14:4126 통이미지.
 */
export default function IceKingPage() {
    return (
        <div className="bg-[var(--color-bg)]">
            <Link href="/c/disposable" className="block mx-auto max-w-screen-2xl px-4 py-3 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                ← 일회용 카테고리
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/page-iceking.png" alt="ICE KING" className="w-full block" />
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
