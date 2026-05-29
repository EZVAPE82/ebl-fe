import Link from "next/link";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "결제완료" };

/* 시안 14:9283 매칭 — 가운데 정렬 + 체크 아이콘 + 주문번호 박스 + 결제금액/구매상품/배송지/결제수단 섹션 */

export default async function CheckoutCompletePage({ searchParams }: { searchParams: Promise<{ orderNo?: string }> }) {
    const sp = await searchParams;
    const orderNo = sp.orderNo ?? "2015854548-5995121212";

    // 시안 정합 mock 데이터
    const data = {
        amounts: { product: 200000, discount: 1000, shipping: 3000, total: 240000 },
        items: [
            { id: 1, name: "상품타이틀", orderNo: "#2021156599898", price: 25000, qty: 1, img: "/images/elfbar-product-1.png" },
            { id: 2, name: "상품타이틀", orderNo: "#2021156599898", price: 25000, qty: 1, img: "/images/elfbar-product-1.png" },
        ],
        address: { name: "엘프바 코리아", addr: "서울특별시 마포구 서교동 잔다로 센터원빌딩 9층", phone: "010-1234-5678", memo: "조심히 와주세요" },
        payment: "계좌이체",
    };

    return (
        <div className="mx-auto max-w-3xl px-4 md:px-8 py-10 md:py-16">
            {/* 체크 아이콘 + 주문완료 타이틀 (가운데) */}
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#3b82f6] flex items-center justify-center mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] mb-2">주문완료</h1>
                <p className="text-sm text-[var(--color-fg-muted)]">주문이 정상적으로 완료되었습니다.</p>
            </div>

            {/* 주문번호 박스 (회색 배경 + 라운딩) */}
            <div className="mt-8 rounded-[12px] bg-[var(--color-bg-subtle)] px-5 py-7 text-center">
                <p className="text-xs text-[var(--color-fg-muted)] mb-1">고객님의 주문번호는</p>
                <p className="text-base md:text-lg font-bold text-[#3b82f6] tabular-nums">{orderNo}</p>
            </div>

            {/* 결제금액 섹션 */}
            <section className="mt-10">
                <h2 className="text-base font-bold text-[var(--color-fg)] pb-3 border-b border-[var(--color-border)]">결제금액</h2>
                <dl className="mt-5 space-y-2.5 text-sm">
                    <div className="flex justify-between"><dt className="text-[var(--color-fg-muted)]">주문금액</dt><dd className="text-[var(--color-fg)] tabular-nums">{formatPrice(data.amounts.product)}</dd></div>
                    <div className="flex justify-between"><dt className="text-[var(--color-fg-muted)]">할인혜택</dt><dd className="text-[var(--color-fg)] tabular-nums">{formatPrice(data.amounts.discount)}</dd></div>
                    <div className="flex justify-between"><dt className="text-[var(--color-fg-muted)]">배송비</dt><dd className="text-[var(--color-fg)] tabular-nums">{formatPrice(data.amounts.shipping)}</dd></div>
                </dl>
                <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-fg)]">결제 예정 금액</span>
                    <span className="text-xl font-bold text-[#3b82f6] tabular-nums">{formatPrice(data.amounts.total)}</span>
                </div>
            </section>

            {/* 구매상품 섹션 */}
            <section className="mt-10">
                <h2 className="text-base font-bold text-[var(--color-fg)] pb-3 border-b border-[var(--color-border)]">구매상품</h2>
                <ul className="mt-2 divide-y divide-[var(--color-border)]">
                    {data.items.map(it => (
                        <li key={it.id} className="flex items-center gap-3 py-4">
                            {/* 사각 thumbnail (라운딩 없음) */}
                            <div className="w-14 h-14 bg-[var(--color-bg-subtle)] flex-shrink-0 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={it.img} alt={it.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--color-fg)] line-clamp-1">{it.name}</p>
                                <p className="text-xs text-[var(--color-fg-muted)] tabular-nums">{it.orderNo}</p>
                            </div>
                            <span className="text-sm text-[var(--color-fg)] tabular-nums">{formatPrice(it.price)}</span>
                            <span className="text-sm text-[var(--color-fg-muted)] tabular-nums w-8 text-right">{it.qty}개</span>
                            <span className="w-6 h-6 flex items-center justify-center text-[var(--color-fg-muted)]">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* 배송지 정보 */}
            <section className="mt-10">
                <h2 className="text-base font-bold text-[var(--color-fg)] pb-3 border-b border-[var(--color-border)]">배송지 정보</h2>
                <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex"><dt className="w-20 text-[var(--color-fg-muted)]">이름</dt><dd className="text-[var(--color-fg)]">{data.address.name}</dd></div>
                    <div className="flex"><dt className="w-20 text-[var(--color-fg-muted)]">주소</dt><dd className="text-[var(--color-fg)]">{data.address.addr}</dd></div>
                    <div className="flex"><dt className="w-20 text-[var(--color-fg-muted)]">전화번호</dt><dd className="text-[var(--color-fg)] tabular-nums">{data.address.phone}</dd></div>
                    <div className="flex"><dt className="w-20 text-[var(--color-fg-muted)]">배송 메시지</dt><dd className="text-[var(--color-fg)]">{data.address.memo}</dd></div>
                </dl>
            </section>

            {/* 결제수단 */}
            <section className="mt-10">
                <h2 className="text-base font-bold text-[var(--color-fg)] pb-3 border-b border-[var(--color-border)]">결제수단</h2>
                <dl className="mt-5 text-sm">
                    <div className="flex"><dt className="w-20 text-[var(--color-fg-muted)]">결제수단</dt><dd className="text-[var(--color-fg)]">{data.payment}</dd></div>
                </dl>
            </section>

            {/* 하단 액션 버튼 — 시안 직사각형 (라운딩 없음) */}
            <div className="mt-12 flex items-center justify-center gap-3">
                <Link
                    href="/mypage"
                    className="inline-flex items-center justify-center bg-[var(--color-bg-subtle)] text-[var(--color-fg)] px-8 py-3 text-sm hover:opacity-90 transition"
                >
                    지금주문하기
                </Link>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center bg-[var(--color-fg)] text-[var(--color-bg)] px-8 py-3 text-sm font-medium hover:opacity-90 transition"
                >
                    쇼핑계속하기
                </Link>
            </div>
        </div>
    );
}
