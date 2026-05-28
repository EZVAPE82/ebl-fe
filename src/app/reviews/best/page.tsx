import Link from "next/link";

export const metadata = { title: "베스트 리뷰" };

/**
 * BEST REVIEWER 페이지 — 시안 34:5856 통이미지.
 */
export default function BestReviewerPage() {
    return (
        <div className="bg-[var(--color-bg)]">
            <Link href="/" className="block mx-auto max-w-screen-2xl px-4 py-3 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                ← 홈으로
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/page-best-reviewer.png" alt="베스트 리뷰" className="w-full block" />
        </div>
    );
}
