import Link from "next/link";

export const metadata = { title: "결제완료" };

/**
 * 결제완료 페이지 — 시안 14:9283 통이미지.
 * 통이미지 + 하단 액션 버튼 (주문내역 보기 / 홈으로).
 * 쿼리 ?orderNo= 받으면 표시.
 */
export default async function CheckoutCompletePage({ searchParams }: { searchParams: Promise<{ orderNo?: string }> }) {
    const sp = await searchParams;
    const orderNo = sp.orderNo;
    return (
        <div className="bg-[var(--color-bg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/page-checkout-complete.png" alt="결제완료" className="w-full block" />
            <div className="mx-auto max-w-screen-2xl px-4 py-8">
                {orderNo && (
                    <p className="text-center text-sm text-[var(--color-fg-muted)] mb-4">
                        주문번호 <span className="font-mono text-[var(--color-fg)]">{orderNo}</span>
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/mypage"
                        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] px-6 py-3 text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
                    >
                        주문 내역 보기
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-fg)] text-[var(--color-bg)] px-6 py-3 text-sm font-medium hover:opacity-90"
                    >
                        쇼핑 계속하기
                    </Link>
                </div>
            </div>
        </div>
    );
}
