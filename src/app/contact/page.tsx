"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
    const [form, setForm] = useState({
        category: "주문/결제",
        name: "",
        email: "",
        phone: "",
        title: "",
        content: "",
        agree: false,
    });
    const [submitted, setSubmitted] = useState(false);

    function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.agree) {
            alert("개인정보 수집·이용에 동의해주세요.");
            return;
        }
        // 실제 API 연동 전 — 임시 처리
        setSubmitted(true);
    }

    if (submitted) {
        return (
            <div className="mx-auto max-w-2xl px-4 md:px-8 py-16 md:py-24 text-center">
                <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--color-fg)] tracking-tight">
                    INQUIRY
                </h1>
                <div className="mt-10 md:mt-14">
                    <p className="text-lg md:text-xl font-semibold text-[var(--color-fg)]">
                        문의가 정상적으로 접수되었습니다.
                    </p>
                    <p className="mt-3 text-sm md:text-base text-[var(--color-fg-muted)]">
                        영업일 기준 1~2일 이내 답변드리겠습니다.<br />
                        남겨주신 이메일로 회신드릴 예정입니다.
                    </p>
                </div>
                <div className="mt-10 flex justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-3 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                    >
                        홈으로
                    </Link>
                    <Link
                        href="/notices"
                        className="inline-flex items-center justify-center bg-[var(--color-fg)] text-white px-8 py-3 text-sm font-medium hover:opacity-90 transition"
                    >
                        공지사항
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-8 md:py-12">
            {/* 큰 타이틀 */}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 md:mb-4 text-[var(--color-fg)] tracking-tight">
                INQUIRY
            </h1>
            <p className="text-sm md:text-base text-[var(--color-fg-muted)] mb-6 md:mb-10">
                궁금하신 부분을 남겨주시면 영업일 기준 1~2일 이내 답변드리겠습니다.
            </p>

            <hr className="border-t-2 border-[var(--color-fg)] mb-8" />

            <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
                {/* 문의 유형 */}
                <Field label="문의 유형" required>
                    <select
                        value={form.category}
                        onChange={e => update("category", e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-fg)]"
                    >
                        <option value="주문/결제">주문/결제</option>
                        <option value="배송">배송</option>
                        <option value="교환/반품">교환/반품</option>
                        <option value="회원/적립금">회원/적립금</option>
                        <option value="상품 문의">상품 문의</option>
                        <option value="기타">기타</option>
                    </select>
                </Field>

                {/* 이름 + 이메일 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Field label="이름" required>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            placeholder="홍길동"
                            required
                            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg)]"
                        />
                    </Field>
                    <Field label="이메일" required>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => update("email", e.target.value)}
                            placeholder="example@elfbar.com"
                            required
                            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg)]"
                        />
                    </Field>
                </div>

                {/* 연락처 */}
                <Field label="연락처">
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={e => update("phone", e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg)]"
                    />
                </Field>

                {/* 제목 */}
                <Field label="제목" required>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => update("title", e.target.value)}
                        placeholder="문의 제목을 입력해주세요"
                        required
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg)]"
                    />
                </Field>

                {/* 내용 */}
                <Field label="내용" required>
                    <textarea
                        value={form.content}
                        onChange={e => update("content", e.target.value)}
                        placeholder="문의 내용을 자세히 입력해주세요"
                        required
                        rows={8}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg)] resize-y"
                    />
                </Field>

                {/* 개인정보 동의 */}
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.agree}
                        onChange={e => update("agree", e.target.checked)}
                        className="mt-1 w-4 h-4 accent-[var(--color-accent)]"
                    />
                    <span className="text-sm text-[var(--color-fg-muted)]">
                        <span className="text-[var(--color-danger)] mr-1">*</span>
                        개인정보 수집·이용에 동의합니다.
                        <Link href="/privacy" className="ml-2 text-[var(--color-accent)] underline">
                            자세히 보기
                        </Link>
                    </span>
                </label>

                {/* 제출 버튼 */}
                <div className="pt-4 flex justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] px-10 py-3 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                    >
                        취소
                    </Link>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center bg-[var(--color-fg)] text-white px-10 py-3 text-sm font-semibold hover:opacity-90 transition"
                    >
                        문의 접수
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-[var(--color-fg)] mb-2">
                {label}
                {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}
