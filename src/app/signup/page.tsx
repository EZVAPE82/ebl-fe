"use client";

/**
 * 회원가입 — Figma 5 step flow 매칭
 *  37:10502  choice  — 일반 / 외국인 / 카카오 / 구글 선택
 *  37:11763  cert    — PASS 본인인증 모달 (아이핀 / 휴대폰)
 *  37:10545  agree   — 약관 동의 (접이식 카드 + 전체동의 + 마케팅 라디오)
 *  37:10562  info    — 정보 입력 (이메일/비밀번호/이름/휴대폰/생년월일/주소/회원유형)
 *  37:10594  done    — 가입완료 (확성기 일러스트)
 *
 *  visual rules (시안 정확 매칭):
 *   - 카드/박스: rounded-[8px], border #E5E7EB
 *   - 입력창:   rounded-[4px], 슬림 (py-2.5)
 *   - 버튼:     SQUARE (rounded-none) — 취소/다음/가입완료/쇼핑하러가기
 *   - 스텝퍼:   원형 + 파란색 #3b82f6 fill (active/done) / 회색 outline (todo)
 *   - 액션 강조:파란 버튼 #3b82f6 (인증번호 받기, 우편번호 찾기)
 *   - 라벨:     필수 항목은 검정 별표(*), 좌측 정렬 (data row 레이아웃)
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { validatePassword } from "@/lib/validation";

type Step = "choice" | "cert" | "agree" | "info" | "done";

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 text-[var(--color-fg-subtle)]">불러오는 중...</div>}>
            <SignupFlow />
        </Suspense>
    );
}

function SignupFlow() {
    const router = useRouter();
    const sp = useSearchParams();
    const initial: Step = sp.get("type") === "foreign" ? "cert" : "choice";

    const [step, setStep] = useState<Step>(initial);
    const [memberKind, setMemberKind] = useState<"KOREAN" | "FOREIGN_RESIDENT">("KOREAN");

    const [form, setForm] = useState({
        email: "",
        emailLocal: "",
        emailDomain: "",
        emailDomainCustom: "",
        password: "",
        passwordConfirm: "",
        name: "",
        landlinePrefix: "02",
        landline2: "",
        landline3: "",
        phonePrefix: "010",
        phone2: "",
        phone3: "",
        certCode: "",
        birthYear: "",
        birthMonth: "",
        birthDay: "",
        addressZip: "",
        address1: "",
        address2: "",
        gender: "MALE" as "MALE" | "FEMALE" | "",
        joinPath: "",
        marketingEmail: false,
        marketingSms: false,
    });

    const [agree, setAgree] = useState({ tos: false, privacy: false, youth: false, marketing: false });
    const [openCard, setOpenCard] = useState<"none" | "all" | "tos" | "privacy" | "youth" | "marketing">("privacy");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm(s => ({ ...s, [k]: v }));
    }

    function toggleAll(v: boolean) {
        setAgree({ tos: v, privacy: v, youth: v, marketing: v });
        setForm(s => ({ ...s, marketingEmail: v, marketingSms: v }));
    }

    const allRequired = agree.tos && agree.privacy && agree.youth;

    /* ─── choice → cert ────────────────────────────────────────── */
    function chooseKorean() { setMemberKind("KOREAN"); setStep("cert"); }
    function chooseForeign() { setMemberKind("FOREIGN_RESIDENT"); setStep("cert"); }

    /* ─── cert → agree ─────────────────────────────────────────── */
    function passCert() {
        setStep("agree");
        window.scrollTo({ top: 0 });
    }

    /* ─── agree → info ─────────────────────────────────────────── */
    function goInfo() {
        setError(null);
        if (!allRequired) {
            setError("필수 약관에 모두 동의해주세요.");
            return;
        }
        setStep("info");
        window.scrollTo({ top: 0 });
    }

    /* ─── info → done ──────────────────────────────────────────── */
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const email = form.emailLocal && (form.emailDomainCustom || form.emailDomain)
            ? `${form.emailLocal}@${form.emailDomainCustom || form.emailDomain}`
            : "";
        if (!email) { setError("이메일을 입력해주세요."); return; }

        const pwError = validatePassword(form.password);
        if (pwError) { setError(pwError); return; }
        if (form.password !== form.passwordConfirm) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        const phone = `${form.phonePrefix}-${form.phone2}-${form.phone3}`;
        if (!form.phone2 || !form.phone3) { setError("휴대폰 번호를 입력해주세요."); return; }

        if (!form.birthYear || !form.birthMonth || !form.birthDay) {
            setError("생년월일을 입력해주세요."); return;
        }
        const birthDate = `${form.birthYear}-${form.birthMonth.padStart(2,"0")}-${form.birthDay.padStart(2,"0")}`;

        setSubmitting(true);
        try {
            await api("/api/v1/auth/signup", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password: form.password,
                    name: form.name,
                    phone,
                    birthDate,
                    gender: form.gender || null,
                    memberType: memberKind,
                    joinChannel: typeof window !== "undefined" && window.innerWidth < 768 ? "MOBILE" : "PC",
                    marketingEmailAgreed: form.marketingEmail || agree.marketing,
                    marketingSmsAgreed: form.marketingSms || agree.marketing,
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

    /* ============================================================
     * Render
     * ============================================================ */
    return (
        <div className="mx-auto max-w-[760px] px-4 py-8 md:py-12">
            {step === "choice" && <ChoiceScreen onKorean={chooseKorean} onForeign={chooseForeign} />}

            {step === "cert" && <CertScreen onPick={passCert} onClose={() => setStep("choice")} />}

            {(step === "agree" || step === "info" || step === "done") && (
                <>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] text-center mb-8">
                        회원가입
                    </h1>
                    <Stepper current={step === "done" ? "done" : step === "info" ? "info" : "agree"} />
                </>
            )}

            {step === "agree" && (
                <section className="mt-10 space-y-3">
                    {/* 전체동의 */}
                    <AgreeCard
                        title="전체동의"
                        checked={agree.tos && agree.privacy && agree.youth && agree.marketing}
                        onCheck={v => toggleAll(v)}
                        open={openCard === "all"}
                        onToggleOpen={() => setOpenCard(openCard === "all" ? "none" : "all")}
                    />

                    {/* 개인정보 수집 및 이용 동의 [필수] */}
                    <AgreeCard
                        title={<>개인정보 수집 및 이용 동의 <span className="text-[#3b82f6] font-semibold">[필수]</span></>}
                        checked={agree.tos}
                        onCheck={v => setAgree(s => ({ ...s, tos: v }))}
                        open={openCard === "tos"}
                        onToggleOpen={() => setOpenCard(openCard === "tos" ? "none" : "tos")}
                        body={
                            <div className="text-sm text-[var(--color-fg-muted)] space-y-2">
                                <p className="font-medium text-[var(--color-fg)]">제 1조 (목적)</p>
                                <p className="text-[13px] leading-relaxed">
                                    본 약관은 회사가 제공하는 쇼핑몰 서비스의 이용과 관련하여 회원과 회사 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                                </p>
                                <p className="text-xs text-[var(--color-fg-subtle)]">* 필수 항목에 동의하셔야 회원가입 및 서비스 이용이 가능합니다.</p>
                            </div>
                        }
                    />

                    {/* 청소년보호정책 [필수] */}
                    <AgreeCard
                        title={<>청소년보호정책 <span className="text-[#3b82f6] font-semibold">[필수]</span></>}
                        checked={agree.youth}
                        onCheck={v => setAgree(s => ({ ...s, youth: v }))}
                        open={openCard === "youth"}
                        onToggleOpen={() => setOpenCard(openCard === "youth" ? "none" : "youth")}
                        body={
                            <div className="text-sm text-[var(--color-fg-muted)] space-y-1">
                                <p className="font-medium text-[var(--color-fg)] mb-1">제 2조 (목적)</p>
                                <ol className="list-decimal pl-5 text-[13px] leading-relaxed space-y-1">
                                    <li>필수 동의 항목을 체크하지 않을 경우 회원가입이 제한될 수 있습니다.</li>
                                    <li>선택 동의 항목은 서비스 이용에 영향을 미치지 않습니다.</li>
                                    <li>자세한 내용은 각 약관 전문을 통해 확인하실 수 있습니다.</li>
                                    <li>이벤트, 할인 혜택, 신상품 안내 등의 마케팅 정보를 제공합니다.</li>
                                </ol>
                            </div>
                        }
                    />

                    {/* 마케팅 정보 수신 동의 [필수] (라디오) */}
                    <AgreeCard
                        title={<>마케팅 정보 수신 동의 <span className="text-[#3b82f6] font-semibold">[필수]</span></>}
                        checked={agree.marketing}
                        onCheck={v => {
                            setAgree(s => ({ ...s, marketing: v }));
                            if (!v) setForm(s => ({ ...s, marketingEmail: false, marketingSms: false }));
                        }}
                        open={openCard === "marketing"}
                        onToggleOpen={() => setOpenCard(openCard === "marketing" ? "none" : "marketing")}
                        body={
                            <div className="space-y-2">
                                <div className="flex items-center gap-6 text-sm">
                                    <Radio
                                        label="SMS 수신 동의"
                                        checked={form.marketingSms}
                                        onChange={v => { update("marketingSms", v); if (v) setAgree(s => ({ ...s, marketing: true })); }}
                                    />
                                    <Radio
                                        label="이메일 수신 동의"
                                        checked={form.marketingEmail}
                                        onChange={v => { update("marketingEmail", v); if (v) setAgree(s => ({ ...s, marketing: true })); }}
                                    />
                                </div>
                                <p className="text-xs text-[var(--color-fg-subtle)] leading-relaxed">
                                    할인쿠폰 및 혜택, 이벤트, 신상품 등 쇼핑몰에서 제공하는 다양한 쇼핑정보를 SMS·이메일로 받아보실 수 있습니다.<br />
                                    단, 주문/거래 정보 및 주요 정책의 관련된 내용은 수신동의 여부와 관계없이 발송됩니다.
                                </p>
                            </div>
                        }
                    />

                    {error && <p className="pt-1 text-sm text-[var(--color-danger)]">{error}</p>}

                    {/* 취소 / 다음 — SQUARE 버튼 (라운딩 없음) */}
                    <div className="flex justify-center gap-3 pt-6">
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="w-[120px] py-3 text-sm bg-[var(--color-bg-subtle)] text-[var(--color-fg)] hover:bg-[var(--color-bg-muted)] transition"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={goInfo}
                            disabled={!allRequired}
                            className="w-[120px] py-3 text-sm bg-[var(--color-fg)] text-[var(--color-bg)] hover:opacity-90 transition disabled:opacity-40"
                        >
                            다음
                        </button>
                    </div>
                </section>
            )}

            {step === "info" && (
                <form onSubmit={onSubmit} className="mt-10">
                    {/* 회원정보 헤더 */}
                    <div className="flex items-center justify-between border-b border-[var(--color-fg)] pb-3 mb-1">
                        <h2 className="text-lg font-bold text-[var(--color-fg)]">회원정보</h2>
                        <span className="text-xs text-[var(--color-fg-muted)]">
                            <span className="text-[#3b82f6]">*</span> 필수입력사항
                        </span>
                    </div>

                    <FieldRow label="아이디" required>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="아이디를 입력해주세요"
                                className={inputCls}
                                value={form.emailLocal}
                                onChange={e => update("emailLocal", e.target.value)}
                            />
                        </div>
                    </FieldRow>

                    <FieldRow label="비밀번호" required>
                        <input
                            type="password"
                            placeholder="비밀번호를 입력해주세요"
                            className={inputCls}
                            value={form.password}
                            onChange={e => update("password", e.target.value)}
                        />
                        <p className="mt-1.5 text-[11px] text-[var(--color-danger)]">
                            (영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10자 ~ 16자)
                        </p>
                    </FieldRow>

                    <FieldRow label="비밀번호 확인" required>
                        <input
                            type="password"
                            placeholder="비밀번호를 입력해주세요"
                            className={inputCls}
                            value={form.passwordConfirm}
                            onChange={e => update("passwordConfirm", e.target.value)}
                        />
                    </FieldRow>

                    <FieldRow label="이름" required>
                        <input
                            type="text"
                            placeholder="이름을 입력해주세요"
                            className={inputCls}
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                        />
                    </FieldRow>

                    <FieldRow label="일반전화">
                        <div className="flex items-center gap-2">
                            <select
                                value={form.landlinePrefix}
                                onChange={e => update("landlinePrefix", e.target.value)}
                                className={`${selectCls} flex-1`}
                            >
                                <option>02</option><option>031</option><option>032</option>
                                <option>033</option><option>041</option><option>042</option>
                                <option>043</option><option>044</option><option>051</option>
                                <option>052</option><option>053</option><option>054</option>
                                <option>055</option><option>061</option><option>062</option>
                                <option>063</option><option>064</option>
                            </select>
                            <span className="text-[var(--color-fg-subtle)]">-</span>
                            <input type="text" inputMode="numeric" className={`${inputCls} flex-1`}
                                value={form.landline2} onChange={e => update("landline2", e.target.value)} />
                            <span className="text-[var(--color-fg-subtle)]">-</span>
                            <input type="text" inputMode="numeric" className={`${inputCls} flex-1`}
                                value={form.landline3} onChange={e => update("landline3", e.target.value)} />
                        </div>
                    </FieldRow>

                    <FieldRow label="휴대전화" required>
                        <div className="flex items-center gap-2">
                            <select
                                value={form.phonePrefix}
                                onChange={e => update("phonePrefix", e.target.value)}
                                className={`${selectCls} flex-1`}
                            >
                                <option>010</option><option>011</option><option>016</option>
                                <option>017</option><option>018</option><option>019</option>
                            </select>
                            <span className="text-[var(--color-fg-subtle)]">-</span>
                            <input type="text" inputMode="numeric" className={`${inputCls} flex-1`}
                                value={form.phone2} onChange={e => update("phone2", e.target.value)} />
                            <span className="text-[var(--color-fg-subtle)]">-</span>
                            <input type="text" inputMode="numeric" className={`${inputCls} flex-1`}
                                value={form.phone3} onChange={e => update("phone3", e.target.value)} />
                        </div>
                    </FieldRow>

                    <FieldRow label="인증번호" required>
                        <div className="flex items-center gap-2">
                            <input type="text" placeholder="인증번호를 입력해주세요"
                                className={`${inputCls} flex-1`}
                                value={form.certCode} onChange={e => update("certCode", e.target.value)} />
                            <button type="button"
                                className="shrink-0 px-4 py-2.5 text-sm font-medium bg-[#3b82f6] text-white rounded-[4px] hover:opacity-90 transition">
                                인증번호 입력
                            </button>
                        </div>
                    </FieldRow>

                    <FieldRow label="생년월일">
                        <div className="grid grid-cols-3 gap-2">
                            <select value={form.birthYear} onChange={e => update("birthYear", e.target.value)} className={selectCls}>
                                <option value="">년</option>
                                {Array.from({ length: 80 }, (_, i) => 2010 - i).map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                            <select value={form.birthMonth} onChange={e => update("birthMonth", e.target.value)} className={selectCls}>
                                <option value="">월</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={String(m)}>{m}</option>
                                ))}
                            </select>
                            <select value={form.birthDay} onChange={e => update("birthDay", e.target.value)} className={selectCls}>
                                <option value="">일</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={String(d)}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </FieldRow>

                    <FieldRow label="이메일" required>
                        <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                            <input type="text" placeholder="이메일을 입력해주세요"
                                className={inputCls}
                                value={form.emailLocal} onChange={e => update("emailLocal", e.target.value)} />
                            <span className="text-[var(--color-fg-subtle)]">@</span>
                            <input type="text"
                                className={inputCls}
                                value={form.emailDomainCustom} onChange={e => update("emailDomainCustom", e.target.value)} />
                            <select
                                value={form.emailDomain}
                                onChange={e => {
                                    update("emailDomain", e.target.value);
                                    if (e.target.value !== "") update("emailDomainCustom", e.target.value);
                                }}
                                className={selectCls}>
                                <option value="">직접입력</option>
                                <option value="naver.com">naver.com</option>
                                <option value="gmail.com">gmail.com</option>
                                <option value="daum.net">daum.net</option>
                                <option value="hanmail.net">hanmail.net</option>
                                <option value="kakao.com">kakao.com</option>
                            </select>
                        </div>
                    </FieldRow>

                    <FieldRow label="주소">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input type="text" placeholder="주소를 입력해주세요"
                                    className={`${inputCls} flex-1`}
                                    value={form.addressZip} onChange={e => update("addressZip", e.target.value)} />
                                <button type="button"
                                    className="shrink-0 px-4 py-2.5 text-sm font-medium bg-[#3b82f6] text-white rounded-[4px] hover:opacity-90 transition">
                                    우편번호 찾기
                                </button>
                            </div>
                            <input type="text" className={`${inputCls} w-full`}
                                value={form.address1} onChange={e => update("address1", e.target.value)} />
                            <input type="text" className={`${inputCls} w-full`}
                                value={form.address2} onChange={e => update("address2", e.target.value)} />
                        </div>
                    </FieldRow>

                    <FieldRow label="마케팅 및 광고 활용 동의" required>
                        <div className="flex items-center gap-6">
                            <Radio label="이메일수신" checked={form.marketingEmail}
                                onChange={v => update("marketingEmail", v)} />
                            <Radio label="SMS 수신" checked={form.marketingSms}
                                onChange={v => update("marketingSms", v)} />
                        </div>
                    </FieldRow>

                    {/* 회원정보 (선택) */}
                    <div className="flex items-center justify-between border-b border-[var(--color-fg)] pb-3 mt-12 mb-1">
                        <h2 className="text-lg font-bold text-[var(--color-fg)]">회원정보</h2>
                        <span className="text-xs text-[var(--color-fg-muted)]">
                            <span className="text-[#3b82f6]">*</span> 선택사항
                        </span>
                    </div>

                    <FieldRow label="성별" required>
                        <div className="flex items-center gap-6">
                            <Radio label="남자" checked={form.gender === "MALE"}
                                onChange={() => update("gender", "MALE")} />
                            <Radio label="여자" checked={form.gender === "FEMALE"}
                                onChange={() => update("gender", "FEMALE")} />
                        </div>
                    </FieldRow>

                    <FieldRow label="가입경로" required>
                        <input type="text" placeholder="가입경로를 입력해주세요"
                            className={`${inputCls} w-full`}
                            value={form.joinPath} onChange={e => update("joinPath", e.target.value)} />
                    </FieldRow>

                    {error && <p className="pt-2 text-sm text-[var(--color-danger)]">{error}</p>}

                    {/* 가입완료 버튼 — SQUARE 검정 */}
                    <div className="flex justify-center pt-10">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="min-w-[160px] py-3.5 px-8 text-sm font-medium bg-[var(--color-fg)] text-[var(--color-bg)] hover:opacity-90 transition disabled:opacity-40"
                        >
                            {submitting ? "처리 중..." : "가입완료"}
                        </button>
                    </div>
                </form>
            )}

            {step === "done" && (
                <section className="mt-12 text-center">
                    {/* 확성기 일러스트 자리 */}
                    <div className="mx-auto w-[260px] h-[200px] mb-6 flex items-center justify-center">
                        <MegaphoneIllustration />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] mb-3">
                        회원가입이 완료되었습니다!
                    </h2>
                    <p className="text-sm text-[var(--color-fg-muted)] mb-8">
                        로그인하고 다양한 서비스를 이용해 보세요.
                    </p>

                    {/* SQUARE 버튼 — 좌: 흰 / 우: 검정 */}
                    <div className="flex items-center justify-center gap-3">
                        <Link
                            href="/mypage"
                            className="min-w-[140px] py-3 px-6 text-sm bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] transition text-center"
                        >
                            회원정보 수정
                        </Link>
                        <Link
                            href="/"
                            className="min-w-[140px] py-3 px-6 text-sm bg-[var(--color-fg)] text-[var(--color-bg)] hover:opacity-90 transition text-center"
                        >
                            쇼핑하러가기
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}

/* ============================================================
 * Input/select 공통 클래스 (시안 정확 매칭: 슬림 / radius 4px)
 * ============================================================ */
const inputCls =
    "w-full bg-[var(--color-surface)] border border-[var(--color-border)] " +
    "rounded-[4px] px-3 py-2.5 text-sm text-[var(--color-fg)] " +
    "placeholder:text-[var(--color-fg-subtle)] " +
    "focus:outline-none focus:border-[var(--color-fg-muted)] transition";

const selectCls =
    "bg-[var(--color-surface)] border border-[var(--color-border)] " +
    "rounded-[4px] px-3 py-2.5 text-sm text-[var(--color-fg)] " +
    "focus:outline-none focus:border-[var(--color-fg-muted)] transition";

/* ============================================================
 * ChoiceScreen — Step 1: 회원가입 방식 선택 (37:10502)
 * ============================================================ */
function ChoiceScreen({ onKorean, onForeign }: { onKorean: () => void; onForeign: () => void }) {
    function social(provider: "KAKAO" | "GOOGLE") {
        alert(`${provider} 로그인은 도급인 콘솔 키 수령 후 활성화됩니다.`);
    }
    return (
        <div className="py-8 md:py-16 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] mb-3">
                회원가입을 시작해 볼까요?
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mb-10">
                회원가입으로 구매시 40% 할인을 할수 있습니다!
            </p>

            <div className="max-w-[460px] mx-auto space-y-3">
                {/* 카카오 — 노란색 */}
                <button
                    type="button"
                    onClick={() => social("KAKAO")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[6px] bg-[#FEE500] text-[#191919] text-sm font-medium hover:brightness-95 transition"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#191919">
                        <path d="M12 3C6.48 3 2 6.52 2 10.87c0 2.75 1.81 5.16 4.56 6.55-.2.71-.73 2.65-.84 3.06-.13.51.19.51.41.37.17-.12 2.74-1.86 3.83-2.6.66.09 1.34.14 2.04.14 5.52 0 10-3.52 10-7.87S17.52 3 12 3z"/>
                    </svg>
                    카카오로 3초만에 가입하기
                </button>

                {/* 구글 — 흰색 + 보더 */}
                <button
                    type="button"
                    onClick={() => social("GOOGLE")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[6px] bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    구글로 3초만에 가입하기
                </button>

                {/* 일반 회원가입 — 검정 */}
                <button
                    type="button"
                    onClick={onKorean}
                    className="w-full py-3.5 rounded-[6px] bg-[var(--color-fg)] text-[var(--color-bg)] text-sm font-medium hover:opacity-90 transition"
                >
                    일반 회원가입
                </button>

                {/* 외국인 회원가입 — 연회색 */}
                <button
                    type="button"
                    onClick={onForeign}
                    className="w-full py-3.5 rounded-[6px] bg-[var(--color-bg-subtle)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-bg-muted)] transition"
                >
                    외국인 회원가입
                </button>
            </div>
        </div>
    );
}

/* ============================================================
 * CertScreen — Step 2: PASS 본인인증 모달 (37:11763)
 * ============================================================ */
function CertScreen({ onPick, onClose }: { onPick: () => void; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="py-8 md:py-16">
            {/* 배경 타이틀 */}
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] text-center mb-8 opacity-50">
                회원가입을 시작해 볼까요?
            </h1>

            {/* 모달 오버레이 */}
            <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
                <div
                    onClick={e => e.stopPropagation()}
                    className="relative w-full max-w-[520px] bg-[var(--color-surface)] rounded-[12px] p-8 md:p-10 shadow-xl"
                >
                    {/* 닫기 X */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="닫기"
                        className="absolute top-5 right-5 w-6 h-6 flex items-center justify-center text-[var(--color-fg)] hover:opacity-70"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>

                    <h2 className="text-lg md:text-xl font-bold text-[var(--color-fg)] leading-snug mb-5">
                        가입 가능 여부 확인을 위해<br />
                        본인인증을 진행할게요
                    </h2>

                    <ul className="space-y-2 text-sm text-[var(--color-fg-muted)] mb-8">
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-fg-subtle)] mt-1.5">•</span>
                            <span>휴대폰 인증은 모바일인증을 통해 진행됩니다.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-fg-subtle)] mt-1.5">•</span>
                            <span>아이핀 인증은 NICE 정보통신을 통해 진행돼요.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-fg-subtle)] mt-1.5">•</span>
                            <span>14세 미만의 경우 본인 이외의 법정 대리인의 인증 절차도 함께 진행돼요.</span>
                        </li>
                    </ul>

                    {/* 인증 버튼 2개 — 연회색 SQUARE-ish (rounded sm) */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={onPick}
                            className="py-3.5 rounded-[6px] bg-[var(--color-bg-subtle)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-bg-muted)] transition"
                        >
                            아이핀 인증
                        </button>
                        <button
                            type="button"
                            onClick={onPick}
                            className="py-3.5 rounded-[6px] bg-[var(--color-bg-subtle)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-bg-muted)] transition"
                        >
                            휴대폰 인증
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
 * Stepper — Step 3·4·5: 약관동의 → 정보입력 → 가입완료
 * ============================================================ */
function Stepper({ current }: { current: "agree" | "info" | "done" }) {
    const steps = [
        { id: "agree", label: "약관동의" },
        { id: "info",  label: "정보입력" },
        { id: "done",  label: "가입완료" },
    ] as const;
    const order = (s: string) => steps.findIndex(x => x.id === s);
    const curIdx = order(current);

    return (
        <ol className="flex items-center justify-center">
            {steps.map((s, i) => {
                const done = i < curIdx;
                const active = i === curIdx;
                const isFilled = done || active;
                return (
                    <li key={s.id} className="flex items-center">
                        <div className="flex flex-col items-center w-[64px]">
                            <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition ${
                                    isFilled
                                        ? "bg-[#3b82f6] text-white"
                                        : "bg-[var(--color-surface)] text-[var(--color-fg-subtle)] border border-[var(--color-border-strong)]"
                                }`}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <span className={`mt-1.5 text-xs ${active ? "text-[var(--color-fg)] font-semibold" : isFilled ? "text-[var(--color-fg)]" : "text-[var(--color-fg-muted)]"}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <span className={`block h-[2px] w-16 md:w-24 -mt-5 ${i < curIdx ? "bg-[#3b82f6]" : "bg-[var(--color-border)]"}`} />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

/* ============================================================
 * AgreeCard — 접이식 약관 카드 (체크 + 제목 + 화살표)
 * ============================================================ */
function AgreeCard({
    title, checked, onCheck, open, onToggleOpen, body,
}: {
    title: React.ReactNode;
    checked: boolean;
    onCheck: (v: boolean) => void;
    open: boolean;
    onToggleOpen: () => void;
    body?: React.ReactNode;
}) {
    return (
        <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="flex items-center px-5 py-4">
                <button
                    type="button"
                    onClick={() => onCheck(!checked)}
                    aria-label="동의"
                    className="shrink-0 mr-3"
                >
                    <CheckCircle filled={checked} />
                </button>
                <span className="flex-1 text-sm font-medium text-[var(--color-fg)]">{title}</span>
                <button
                    type="button"
                    onClick={onToggleOpen}
                    aria-label={open ? "접기" : "펼치기"}
                    className="shrink-0 ml-3 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                        style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
            {open && body && (
                <div className="px-5 pb-5 pt-1 border-t border-[var(--color-border)]">
                    <div className="pt-4">{body}</div>
                </div>
            )}
        </div>
    );
}

function CheckCircle({ filled }: { filled: boolean }) {
    return (
        <span
            className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                filled
                    ? "bg-[#3b82f6] text-white"
                    : "bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-border-strong)]"
            }`}
        >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    );
}

/* ============================================================
 * Radio — 파란 점 라디오 (시안 매칭)
 * ============================================================ */
function Radio({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`w-4 h-4 rounded-full flex items-center justify-center transition ${
                    checked
                        ? "bg-[#3b82f6]"
                        : "bg-[var(--color-surface)] border border-[var(--color-border-strong)]"
                }`}
                aria-pressed={checked}
            >
                {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
            <span className="text-[var(--color-fg)]">{label}</span>
        </label>
    );
}

/* ============================================================
 * FieldRow — 좌측 라벨 + 우측 입력 (시안 정보입력 매칭)
 * ============================================================ */
function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[120px_1fr] items-start gap-4 py-3 border-b border-[var(--color-border)]">
            <div className="text-sm text-[var(--color-fg)] pt-2.5">
                {label}{required && <span className="text-[#3b82f6] ml-0.5">*</span>}
            </div>
            <div>{children}</div>
        </div>
    );
}

/* ============================================================
 * MegaphoneIllustration — 가입완료 화면 일러스트 (37:10594)
 * ============================================================ */
function MegaphoneIllustration() {
    return (
        <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="megaBody" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#6FAFEF"/>
                    <stop offset="1" stopColor="#3b82f6"/>
                </linearGradient>
                <linearGradient id="megaCone" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#A5C7F0"/>
                    <stop offset="1" stopColor="#5B9BE0"/>
                </linearGradient>
            </defs>
            {/* 손잡이 */}
            <rect x="30" y="100" width="56" height="28" rx="8" fill="url(#megaBody)"/>
            {/* 몸통 */}
            <rect x="78" y="72" width="64" height="56" rx="10" fill="url(#megaBody)"/>
            {/* 콘 */}
            <path d="M138 60 L210 30 L210 170 L138 140 Z" fill="url(#megaCone)"/>
            {/* 콘 입구 하이라이트 */}
            <ellipse cx="208" cy="100" rx="6" ry="48" fill="#7DB1E4" opacity="0.6"/>
            {/* 안테나/볼륨 */}
            <circle cx="155" cy="40" r="6" fill="#FFD66B"/>
            <path d="M170 30 L180 22 M168 22 L178 15 M178 32 L188 30" stroke="#FFD66B" strokeWidth="2.5" strokeLinecap="round"/>
            {/* 별 */}
            <text x="218" y="155" fontSize="12" fill="#A0A0A0">×</text>
        </svg>
    );
}
