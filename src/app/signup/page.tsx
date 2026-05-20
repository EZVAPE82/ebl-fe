"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { validatePassword } from "@/lib/validation";
import { Button, Checkbox, Input } from "@/components/ui";

export default function SignupPage() {
    const router = useRouter();

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

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const pwError = validatePassword(form.password);
        if (pwError) {
            setError(pwError);
            return;
        }
        if (form.password !== form.passwordConfirm) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (!agree.tos || !agree.privacy || !agree.youth) {
            setError("필수 약관에 모두 동의해주세요.");
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
            router.replace("/login?redirect=/mypage");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "회원가입에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    // Input과 동일 톤의 select className (Input.tsx base 참조)
    const selectClass =
        "block w-full bg-[var(--color-surface)] text-[var(--color-fg)] " +
        "border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3.5 text-sm " +
        "focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)] transition";

    return (
        <div className="mx-auto max-w-md px-4 py-10">
            <h1 className="text-2xl font-semibold mb-6 text-[var(--color-fg)]">회원가입</h1>

            <form onSubmit={onSubmit} className="space-y-3">
                <Input type="email" required label="이메일"
                    value={form.email} onChange={e => update("email", e.target.value)} />
                <Input type="password" required
                    label="비밀번호"
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

                <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 text-sm">
                    <legend className="px-1 text-[var(--color-fg-muted)] text-xs">약관 동의</legend>
                    <Checkbox label="(필수) 이용약관" checked={agree.tos}
                        onChange={e => setAgree(s => ({ ...s, tos: e.target.checked }))} />
                    <Checkbox label="(필수) 개인정보 처리방침" checked={agree.privacy}
                        onChange={e => setAgree(s => ({ ...s, privacy: e.target.checked }))} />
                    <Checkbox label="(필수) 청소년 보호정책 — 만 19세 이상" checked={agree.youth}
                        onChange={e => setAgree(s => ({ ...s, youth: e.target.checked }))} />
                    <Checkbox label="(선택) 마케팅 정보 수신" checked={agree.marketing}
                        onChange={e => setAgree(s => ({ ...s, marketing: e.target.checked }))} />
                </fieldset>

                {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

                <Button type="submit" loading={submitting} size="lg" fullWidth>
                    가입하기
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-[var(--color-fg)] underline">로그인</Link>
            </p>
            <p className="mt-4 text-xs text-[var(--color-fg-subtle)] leading-relaxed">
                * 가입 후 PASS 본인인증을 완료해야 구매가 가능합니다.<br />
                * 해외거주 외국인은 어드민의 여권 서류 승인 후 활성화됩니다.
            </p>
        </div>
    );
}
