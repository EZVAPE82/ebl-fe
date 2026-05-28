import Link from "next/link";

export const metadata = { title: "ICE KIM PRO" };

/**
 * 아이스킴프로 제품 페이지 — 시안 96:11284 통이미지.
 * Figma 에 variant 4종 (96:11284, 120:10196, 120:10686, 122:7999) 있어 추후 ?variant=a/b/c/d 분기 가능.
 */
export default function IcekimProPage() {
    return (
        <div className="bg-[var(--color-bg)]">
            <Link href="/c/disposable" className="block mx-auto max-w-screen-2xl px-4 py-3 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                ← 일회용 카테고리
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/page-icekim-pro.png" alt="ICE KIM PRO" className="w-full block" />
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
