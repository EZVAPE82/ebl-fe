"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";

export default function FindEmailPage() {
    const [phone, setPhone] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [found, setFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setResult(null); setError(null); setSubmitting(true);
        try {
            const r = await api<{ found: boolean; emailMasked?: string }>("/api/v1/auth/find-email", {
                method: "POST", body: JSON.stringify({ phone }),
            });
            setFound(r.found);
            setResult(r.emailMasked ?? "");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "조회 실패");
        } finally { setSubmitting(false); }
    }

    return (
        <div className="mx-auto max-w-sm px-4 py-12">
            <h1 className="text-2xl font-semibold mb-6 text-[var(--color-fg)]">아이디(이메일) 찾기</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <Input
                    type="tel"
                    required
                    label="가입 시 등록한 휴대폰 번호"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    error={error}
                />
                <Button type="submit" loading={submitting} size="lg" fullWidth>
                    조회
                </Button>
            </form>

            {result !== null && (
                <Card tone="subtle" className="mt-5 text-sm">
                    {found ? (
                        <>가입된 이메일: <span className="font-mono text-[var(--color-fg)]">{result}</span></>
                    ) : (
                        <span className="text-[var(--color-fg-muted)]">일치하는 회원을 찾을 수 없습니다.</span>
                    )}
                </Card>
            )}

            <div className="mt-6 text-center text-sm">
                <Link href="/login" className="text-[var(--color-fg-muted)] underline hover:text-[var(--color-fg)]">로그인 페이지로</Link>
                <span className="mx-2 text-[var(--color-fg-subtle)]">·</span>
                <Link href="/password-reset" className="text-[var(--color-fg-muted)] underline hover:text-[var(--color-fg)]">비밀번호 재설정</Link>
            </div>
        </div>
    );
}
