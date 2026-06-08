"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui";

type ClaimResult = { granted: boolean; earned: number; balance: number };

/**
 * 코드 수령 페이지 — 리뉴얼 단체문자 링크 등(/claim/RENEWAL2026).
 * 미로그인 시 로그인으로 보낸 뒤 복귀, 로그인 상태면 1회 POST 로 수령한다(서버가 멱등 보장).
 */
export default function ClaimPage() {
    const { code } = useParams<{ code: string }>();
    const router = useRouter();
    const { user, loading } = useAuth();
    const [state, setState] = useState<"init" | "processing" | "done" | "error">("init");
    const [result, setResult] = useState<ClaimResult | null>(null);
    const [msg, setMsg] = useState("");
    const ran = useRef(false);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace(`/login?redirect=${encodeURIComponent(`/claim/${code}`)}`);
            return;
        }
        if (ran.current) return;
        ran.current = true;
        setState("processing");
        api<ClaimResult>(`/api/v1/members/me/claims/${encodeURIComponent(code)}`, { method: "POST", auth: true })
            .then((r) => { setResult(r); setState("done"); })
            .catch((e) => { setMsg(e instanceof ApiError ? e.message : "수령 처리에 실패했습니다."); setState("error"); });
    }, [loading, user, code, router]);

    return (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
            {(state === "init" || state === "processing") && (
                <>
                    <div className="text-5xl mb-4">🎁</div>
                    <p className="text-[var(--color-fg-muted)]">수령 처리 중...</p>
                </>
            )}

            {state === "done" && result?.granted && (
                <>
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-xl md:text-2xl font-bold text-[var(--color-fg)]">
                        {result.earned.toLocaleString()}원 적립 완료!
                    </h1>
                    <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
                        현재 적립금 잔액 <b className="text-[var(--color-accent)]">{result.balance.toLocaleString()}원</b>
                    </p>
                    <div className="mt-8 flex gap-2 justify-center">
                        <Link href="/mypage"><Button size="lg">내 적립금 보기</Button></Link>
                        <Link href="/"><Button variant="secondary" size="lg">쇼핑하러 가기</Button></Link>
                    </div>
                </>
            )}

            {state === "done" && !result?.granted && (
                <>
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-lg md:text-xl font-semibold text-[var(--color-fg)]">
                        이미 수령했거나 수령 대상이 아닙니다.
                    </h1>
                    <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
                        적립금은 마이페이지에서 확인할 수 있습니다.
                    </p>
                    <div className="mt-8 flex gap-2 justify-center">
                        <Link href="/mypage"><Button size="lg">마이페이지</Button></Link>
                        <Link href="/"><Button variant="secondary" size="lg">홈으로</Button></Link>
                    </div>
                </>
            )}

            {state === "error" && (
                <>
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-lg md:text-xl font-semibold text-[var(--color-fg)]">수령에 실패했습니다</h1>
                    <p className="mt-3 text-sm text-[var(--color-fg-muted)]">{msg}</p>
                    <div className="mt-8 flex gap-2 justify-center">
                        <Link href="/"><Button variant="secondary" size="lg">홈으로</Button></Link>
                    </div>
                </>
            )}
        </div>
    );
}
