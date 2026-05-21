import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
    return (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
            <div className="text-7xl md:text-8xl font-bold text-[var(--color-fg-subtle)] mb-2 tracking-tight">404</div>
            <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-fg)]">
                페이지를 찾을 수 없습니다
            </h1>
            <p className="mt-3 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                주소가 잘못되었거나 페이지가 삭제·이동되었을 수 있어요.<br />
                홈으로 돌아가서 다시 시도해주세요.
            </p>
            <div className="mt-8 flex gap-2 justify-center">
                <Link href="/"><Button size="lg">홈으로</Button></Link>
                <Link href="/notices"><Button variant="secondary" size="lg">공지사항</Button></Link>
            </div>
        </div>
    );
}
