"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // 운영 시 외부 모니터링(Sentry 등)으로 전송 자리
        console.error("[error.tsx]", error);
    }, [error]);

    return (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
            <div className="text-6xl md:text-7xl mb-4">⚠️</div>
            <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-fg)]">
                예상치 못한 오류가 발생했습니다
            </h1>
            <p className="mt-3 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                잠시 후 다시 시도해주세요. 문제가 계속되면<br />
                고객센터 02-773-4114 로 문의해주세요.
            </p>
            {error.digest && (
                <p className="mt-2 text-[11px] text-[var(--color-fg-subtle)] font-mono">
                    오류 ID: {error.digest}
                </p>
            )}
            <div className="mt-8 flex gap-2 justify-center">
                <Button onClick={reset} size="lg">다시 시도</Button>
                <Link href="/"><Button variant="secondary" size="lg">홈으로</Button></Link>
            </div>
        </div>
    );
}
