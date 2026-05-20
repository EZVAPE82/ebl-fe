"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { validatePassword } from "@/lib/validation";
import { Button, Checkbox, Input } from "@/components/ui";

type Step = "agree" | "info" | "done";

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("agree");

    const [form, setForm] = useState({
        email: "",
        password: "",
        passwordConfirm: "",
        name: "",
        phone: "",
        birthDate: "",
        gender: "",
        memberType: "KOREAN" as "KOREAN" | "FOREIGN_RESIDENT" | "FOREIGN_OVERSEAS",
    });
    const [agree, setAgree] = useState({ tos: false, privacy: false, youth: false, marketing: false });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm(s => ({ ...s, [k]: v }));
    }

    function toggleAll(v: boolean) {
        setAgree({ tos: v, privacy: v, youth: v, marketing: v });
    }

    const allRequired = agree.tos && agree.privacy && agree.youth;

    function goNext() {
        setError(null);
        if (!allRequired) {
            setError("필수 약관에 모두 동의해주세요.");
            return;
        }
        setStep("info");
        window.scrollTo({ top: 0 });
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const pwError = validatePassword(form.password);
        if (pwError) { setError(pwError); return; }
        if (form.password !== form.passwordConfirm) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }
        setSubmitting(true);
        try {
            await api("/api/v1/auth/signup", {
                method: "POST",
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    phone: form.phone,
                    birthDate: form.birthDate,
                    gender: form.gender || null,
                    memberType: form.memberType,
                    joinChannel: typeof window !== "undefined" && window.innerWidth < 768 ? "MOBILE" : "PC",
                    marketingEmailAgreed: agree.marketing,
                    marketingSmsAgreed: agree.marketing,
                    tosAgreed: agree.tos,
                    privacyAgreed: agree.privacy,
                    youthAgreed: agree.youth,
                }),
            });
            setStep("done");
            window.scrollTo({ top: 0 });
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "회원가입에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    const selectClass =
        "block w-full bg-[var(--color-surface)] text-[var(--color-fg)] " +
        "border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3.5 text-sm " +
        "focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)] transition";

    return (
        <div className="mx-auto max-w-xl px-4 py-10">
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 text-[var(--color-fg)]">회원가입</h1>

            <Stepper current={step} />

            {step === "agree" && (
                <section className="mt-10 space-y-4">
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                        <Checkbox
                            label={<span className="font-semibold text-[var(--color-fg)]">전체 약관에 동의합니다</span>}
                            checked={agree.tos && agree.privacy && agree.youth && agree.marketing}
                            onChange={e => toggleAll(e.target.checked)}
                        />
                    </div>
                    <ul className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden">
                        <AgreeRow
                            label="(필수) 이용약관"
                            href="/terms"
                            checked={agree.tos}
                            onChange={v => setAgree(s => ({ ...s, tos: v }))}
                        />
                        <AgreeRow
                            label="(필수) 개인정보 처리방침"
                            href="/privacy"
                            checked={agree.privacy}
                            onChange={v => setAgree(s => ({ ...s, privacy: v }))}
                        />
                        <AgreeRow
                            label="(필수) 청소년 보호정책 — 만 19세 이상"
                            href="/youth"
                            checked={agree.youth}
                            onChange={v => setAgree(s => ({ ...s, youth: v }))}
                        />
                        <AgreeRow
                            label="(선택) 마케팅 정보 수신"
                            checked={agree.marketing}
                            onChange={v => setAgree(s => ({ ...s, marketing: v }))}
                        />
                    </ul>
                    {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
                    <Button onClick={goNext} size="lg" fullWidth disabled={!allRequired}>
                        다음 단계
                    </Button>
                </section>
            )}

            {step === "info" && (
                <form onSubmit={onSubmit} className="mt-10 space-y-3">
                    <Input type="email" required label="이메일"
                        value={form.email} onChange={e => update("email", e.target.value)} />
                    <Input type="password" required label="비밀번호"
                        helperText="10자 이상, 영문·숫자·특수문자 포함"
                        value={form.password} onChange={e => update("password", e.target.value)} />
                    <Input type="password" required label="비밀번호 확인"
                        value={form.passwordConfirm} onChange={e => update("passwordConfirm", e.target.value)} />
                    <Input type="text" required label="이름"
                        value={form.name} onChange={e => update("name", e.target.value)} />
                    <Input type="tel" required label="휴대폰 번호"
                        placeholder="010-1234-5678"
                        value={form.phone} onChange={e => update("phone", e.target.value)} />
                    <Input type="date" required label="생년월일"
                        value={form.birthDate} onChange={e => update("birthDate", e.target.value)} />

                    <label className="block">
                        <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1">회원 유형</span>
                        <select
                            value={form.memberType}
                            onChange={e => update("memberType", e.target.value as typeof form.memberType)}
                            className={selectClass}
                        >
                            <option value="KOREAN">내국인</option>
                            <option value="FOREIGN_RESIDENT">국내거주 외국인</option>
                            <option value="FOREIGN_OVERSEAS">해외거주 외국인</option>
                        </select>
                    </label>

                    {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="secondary" size="lg" fullWidth
                            onClick={() => { setError(null); setStep("agree"); window.scrollTo({ top: 0 }); }}>
                            이전
                        </Button>
                        <Button type="submit" loading={submitting} size="lg" fullWidth>
                            가입 완료
                        </Button>
                    </div>
                </form>
            )}

            {step === "done" && (
                <section className="mt-10 text-center space-y-6 py-8">
                    <div className="text-6xl">🎉</div>
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--color-fg)]">가입이 완료되었습니다</h2>
                        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
                            {form.name}님, 환영합니다.<br />
                            로그인 후 만 19세 PASS 본인인증을 완료하시면<br />
                            모든 상품을 결제하실 수 있습니다.
                        </p>
                    </div>
                    <div className="flex gap-2 max-w-sm mx-auto">
                        <Link href="/" className="flex-1">
                            <Button variant="secondary" fullWidth size="lg">홈으로</Button>
                        </Link>
                        <Link href="/login?redirect=/mypage" className="flex-1">
                            <Button fullWidth size="lg">로그인</Button>
                        </Link>
                    </div>
                </section>
            )}

            {step !== "done" && (
                <p className="mt-8 text-center text-sm text-[var(--color-fg-muted)]">
                    이미 계정이 있으신가요?{" "}
                    <Link href="/login" className="text-[var(--color-fg)] underline">로그인</Link>
                </p>
            )}
        </div>
    );
}

/* ============================================================
 * Stepper — 약관동의 → 정보입력 → 가입완료
 * ============================================================ */
function Stepper({ current }: { current: Step }) {
    const steps: { id: Step; label: string }[] = [
        { id: "agree", label: "약관동의" },
        { id: "info",  label: "정보입력" },
        { id: "done",  label: "가입완료" },
    ];
    const order = (s: Step) => steps.findIndex(x => x.id === s);
    const curIdx = order(current);

    return (
        <ol className="flex items-center justify-center gap-2 md:gap-4">
            {steps.map((s, i) => {
                const done = i < curIdx;
                const active = i === curIdx;
                const circleClass = done || active
                    ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)] border-[var(--color-brand)]"
                    : "bg-[var(--color-surface)] text-[var(--color-fg-subtle)] border-[var(--color-border-strong)]";
                const lineClass = i < curIdx ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]";

                return (
                    <li key={s.id} className="flex items-center gap-2 md:gap-4">
                        <div className="flex flex-col items-center gap-1.5">
                            <span className={`w-8 h-8 rounded-full border-2 ${circleClass} flex items-center justify-center text-xs font-bold transition`}>
                                {done ? "✓" : i + 1}
                            </span>
                            <span className={`text-[11px] md:text-xs ${active ? "text-[var(--color-fg)] font-semibold" : "text-[var(--color-fg-muted)]"}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <span className={`block h-0.5 w-12 md:w-20 ${lineClass} transition`} />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

/* ============================================================
 * AgreeRow — 약관 1행
 * ============================================================ */
function AgreeRow({ label, href, checked, onChange }: {
    label: string; href?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <li className="flex items-center gap-3 px-4 py-3.5">
            <Checkbox
                label={<span className="text-sm text-[var(--color-fg)]">{label}</span>}
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="flex-1"
            />
            {href && (
                <Link href={href} target="_blank" className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] underline">
                    내용보기
                </Link>
            )}
        </li>
    );
}
