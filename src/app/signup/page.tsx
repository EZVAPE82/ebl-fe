"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

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
            // 가입 후 자동 로그인 페이지로
            router.replace("/login?redirect=/mypage");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "회원가입에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-md px-4 py-10">
            <h1 className="text-2xl font-bold mb-6">회원가입</h1>

            <form onSubmit={onSubmit} className="space-y-3">
                <Field label="이메일">
                    <input type="email" required value={form.email} onChange={e => update("email", e.target.value)} className={inputClass} />
                </Field>
                <Field label="비밀번호 (10자 이상, 영문/숫자/특수문자)">
                    <input type="password" required value={form.password} onChange={e => update("password", e.target.value)} className={inputClass} />
                </Field>
                <Field label="비밀번호 확인">
                    <input type="password" required value={form.passwordConfirm} onChange={e => update("passwordConfirm", e.target.value)} className={inputClass} />
                </Field>
                <Field label="이름">
                    <input type="text" required value={form.name} onChange={e => update("name", e.target.value)} className={inputClass} />
                </Field>
                <Field label="휴대폰 번호">
                    <input type="tel" required placeholder="010-1234-5678" value={form.phone} onChange={e => update("phone", e.target.value)} className={inputClass} />
                </Field>
                <Field label="생년월일">
                    <input type="date" required value={form.birthDate} onChange={e => update("birthDate", e.target.value)} className={inputClass} />
                </Field>
                <Field label="회원 유형">
                    <select value={form.memberType} onChange={e => update("memberType", e.target.value as typeof form.memberType)} className={inputClass}>
                        <option value="KOREAN">내국인</option>
                        <option value="FOREIGN_RESIDENT">국내거주 외국인</option>
                        <option value="FOREIGN_OVERSEAS">해외거주 외국인</option>
                    </select>
                </Field>

                <fieldset className="space-y-1.5 rounded-md border border-zinc-200 p-3 text-sm">
                    <legend className="px-1 text-zinc-500 text-xs">약관 동의</legend>
                    <Check label="(필수) 이용약관" checked={agree.tos} onChange={v => setAgree(s => ({...s, tos: v}))} />
                    <Check label="(필수) 개인정보 처리방침" checked={agree.privacy} onChange={v => setAgree(s => ({...s, privacy: v}))} />
                    <Check label="(필수) 청소년 보호정책 — 만 19세 이상" checked={agree.youth} onChange={v => setAgree(s => ({...s, youth: v}))} />
                    <Check label="(선택) 마케팅 정보 수신" checked={agree.marketing} onChange={v => setAgree(s => ({...s, marketing: v}))} />
                </fieldset>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-md bg-zinc-900 text-white py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
                >
                    {submitting ? "가입 중..." : "가입하기"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-zinc-900 underline">로그인</Link>
            </p>
            <p className="mt-4 text-xs text-zinc-400 leading-relaxed">
                * 가입 후 PASS 본인인증을 완료해야 구매가 가능합니다.<br />
                * 해외거주 외국인은 어드민의 여권 서류 승인 후 활성화됩니다.
            </p>
        </div>
    );
}

const inputClass = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-sm text-zinc-600">{label}</span>
            {children}
        </label>
    );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span>{label}</span>
        </label>
    );
}
