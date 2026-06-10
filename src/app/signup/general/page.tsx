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
    const isForeignInitial = sp.get("type") === "foreign";
    // 본인인증 모달을 일반 회원가입의 진입 게이트로 — 폼 필드 이전에 cert 부터 시작.
    // (방식 선택은 이미 /signup 랜딩에서 끝났으므로 redundant choice 화면은 건너뜀)
    const initial: Step = "cert";

    const [step, setStep] = useState<Step>(initial);
    // URL ?type=foreign 으로 진입 시 memberKind 도 외국인으로 설정 (시안 274:8727)
    const [memberKind, setMemberKind] = useState<"KOREAN" | "FOREIGN_RESIDENT">(
        isForeignInitial ? "FOREIGN_RESIDENT" : "KOREAN"
    );

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
        referralCode: "",
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

    // 시안 274:8752/8771/8813 — 외국인일 때 영문 텍스트 사전
    const isForeign = memberKind === "FOREIGN_RESIDENT";
    const i18n = isForeign ? {
        title:       "Sign Up",
        agreeAll:    "Agree to All",
        privacy:     "Privacy Policy",
        youth:       "Youth Protection Policy",
        marketing:   "Consent to Receive Marketing Information",
        required:    "[Required]",
        cancel:      "Cancel",
        next:        "Next",
        errAgree:    "Please agree to all required terms.",
        smsConsent:  "Agree to Receive SMS Notifications",
        emailConsent:"Agree to Receive Email Notifications",
        // info step
        sectionTitle:       "Account Information",
        markRequired:       "*Required",
        markOptional:       "*Optional",
        lblId:              "ID",
        lblPassword:        "Password",
        lblPasswordConfirm: "Confirm Password",
        lblName:            "Name",
        lblLandline:        "Landline",
        lblMobile:          "Mobile Number",
        lblCert:            "Identity Verification",
        lblBirth:           "Date of Birth",
        lblEmail:           "Email",
        lblAddress:         "Address",
        lblMarketing:       "Marketing Consent",
        lblGender:          "Gender",
        lblJoinPath:        "How did you hear about us",
        phId:               "Please enter your ID",
        phPwd:              "Please enter your password",
        pwdHint:            "*10-16 chars, mix of letters, numbers & special characters",
        phPwdConfirm:       "Please re-enter your password",
        phName:             "Please enter your name",
        phCert:             "Please enter your verification code",
        btnVerify:          "Verify",
        optYear:            "Year",
        optMonth:           "Month",
        optDay:             "Day",
        phEmail:            "Please enter your email",
        domainManually:     "Manually",
        phAddress:          "Enter your address",
        btnFindZip:         "Find Code",
        radioEmailNoti:     "Email Notifications",
        radioSmsNoti:       "SMS Notifications",
        radioMale:          "Male",
        radioFemale:        "Female",
        phJoinPath:         "Please enter how you found us",
        lblReferral:        "Referral Code",
        phReferral:         "Enter referrer's code (optional)",
        btnComplete:        "Complete",
        errEmail:           "Please enter your email.",
        errPasswordMismatch:"Passwords do not match.",
        errPhone:           "Please enter your mobile number.",
        errBirth:           "Please enter your date of birth.",
        errSignup:          "Sign-up failed.",
        // done step
        doneTitle:    "Registration Complete!",
        doneDesc:     "Log in now to explore our services.",
        btnEditProf:  "Edit Profile",
        btnShop:      "Go Shopping",
    } : {
        title:       "회원가입",
        agreeAll:    "전체동의",
        privacy:     "개인정보 수집 및 이용 동의",
        youth:       "청소년보호정책",
        marketing:   "마케팅 정보 수신 동의",
        required:    "[필수]",
        cancel:      "취소",
        next:        "다음",
        errAgree:    "필수 약관에 모두 동의해주세요.",
        smsConsent:  "SMS 수신 동의",
        emailConsent:"이메일 수신 동의",
        // info step
        sectionTitle:       "회원정보",
        markRequired:       "* 필수입력사항",
        markOptional:       "* 선택사항",
        lblId:              "아이디",
        lblPassword:        "비밀번호",
        lblPasswordConfirm: "비밀번호 확인",
        lblName:            "이름",
        lblLandline:        "일반전화",
        lblMobile:          "휴대전화",
        lblCert:            "성인인증",
        lblBirth:           "생년월일",
        lblEmail:           "이메일",
        lblAddress:         "주소",
        lblMarketing:       "마케팅 및 광고 활용 동의",
        lblGender:          "성별",
        lblJoinPath:        "가입경로",
        phId:               "아이디를 입력해주세요",
        phPwd:              "비밀번호를 입력해주세요",
        pwdHint:            "(영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10자 ~ 16자)",
        phPwdConfirm:       "비밀번호를 입력해주세요",
        phName:             "이름을 입력해주세요",
        phCert:             "인증번호를 입력해주세요",
        btnVerify:          "인증번호 입력",
        optYear:            "년",
        optMonth:           "월",
        optDay:             "일",
        phEmail:            "이메일을 입력해주세요",
        domainManually:     "직접입력",
        phAddress:          "주소를 입력해주세요",
        btnFindZip:         "우편번호 찾기",
        radioEmailNoti:     "이메일수신",
        radioSmsNoti:       "SMS 수신",
        radioMale:          "남자",
        radioFemale:        "여자",
        phJoinPath:         "가입경로를 입력해주세요",
        lblReferral:        "추천인 코드",
        phReferral:         "추천인 코드를 입력해주세요 (선택)",
        btnComplete:        "가입완료",
        errEmail:           "이메일을 입력해주세요.",
        errPasswordMismatch:"비밀번호가 일치하지 않습니다.",
        errPhone:           "휴대폰 번호를 입력해주세요.",
        errBirth:           "생년월일을 입력해주세요.",
        errSignup:          "회원가입에 실패했습니다.",
        // done step
        doneTitle:    "회원가입이 완료되었습니다!",
        doneDesc:     "로그인하고 다양한 서비스를 이용해 보세요.",
        btnEditProf:  "회원정보 수정",
        btnShop:      "쇼핑하러가기",
    };

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
            setError(i18n.errAgree);
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
        if (!email) { setError(i18n.errEmail); return; }

        const pwError = validatePassword(form.password);
        if (pwError) { setError(pwError); return; }
        if (form.password !== form.passwordConfirm) {
            setError(i18n.errPasswordMismatch);
            return;
        }

        const phone = `${form.phonePrefix}-${form.phone2}-${form.phone3}`;
        if (!form.phone2 || !form.phone3) { setError(i18n.errPhone); return; }

        if (!form.birthYear || !form.birthMonth || !form.birthDay) {
            setError(i18n.errBirth); return;
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
                    referralCode: form.referralCode || null,
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
            setError(e instanceof ApiError ? e.message : i18n.errSignup);
        } finally {
            setSubmitting(false);
        }
    }

    /* ============================================================
     * Render
     * ============================================================ */
    return (
        <div className={step === "agree" || step === "info" || step === "done" ? "w-full" : "mx-auto max-w-[760px] px-4 py-8 md:py-12"}>
            {step === "choice" && <ChoiceScreen onKorean={chooseKorean} onForeign={chooseForeign} />}

            {step === "cert" && <CertScreen foreign={memberKind === "FOREIGN_RESIDENT"} onPick={passCert} onClose={() => router.push("/signup")} />}

            {step === "agree" && (
                <div className="mx-auto max-w-[1000px] px-4 pt-10 md:pt-[60px] pb-20 flex flex-col items-center gap-[60px]">
                    {/* 회원가입 타이틀 */}
                    <h1 className="text-[32px] md:text-[36px] font-bold text-center text-[#222222]">
                        {i18n.title}
                    </h1>

                    {/* STEPPER — 약관동의 / 정보입력 / 가입완료 */}
                    <Stepper current="agree" foreign={isForeign} />

                    {/* 약관 동의 영역 */}
                    <section className="w-full flex flex-col gap-4">
                        {/* 전체동의 */}
                        <div className="p-6 bg-[#F6F7FB] rounded-[10px] flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => toggleAll(!(agree.tos && agree.privacy && agree.youth && agree.marketing))}
                                className="flex items-center gap-1.5"
                            >
                                <RoundCheck checked={agree.tos && agree.privacy && agree.youth && agree.marketing} />
                                <span className="text-[18px] font-medium text-[#000]">{i18n.agreeAll}</span>
                            </button>
                            <Chevron open={false} />
                        </div>

                        {/* CARD 1 — 개인정보 수집 및 이용 동의 [필수] (privacy + tos) */}
                        <AgreeCard
                            label={i18n.privacy}
                            requiredLabel={i18n.required}
                            checked={agree.tos && agree.privacy}
                            onCheck={v => setAgree(s => ({ ...s, tos: v, privacy: v }))}
                            open={openCard === "tos"}
                            onToggleOpen={() => setOpenCard(openCard === "tos" ? "none" : "tos")}
                        >
                            <p className="text-[18px] text-[#222]">{isForeign ? "Article 1 (Purpose)" : "제 1조(목적)"}</p>
                            <p className="text-[14px] text-[#000]">
                                {isForeign
                                    ? "The purpose of these Terms and Conditions is to regulate the rights, obligations, responsibilities, and other necessary matters between the Member and the Company regarding the use of the shopping mall services provided by the Company."
                                    : "본 약관은 회사가 제공하는 쇼핑몰 서비스의 이용과 관련하여 회원과 회사 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다."}
                            </p>
                            <p className="text-[14px] font-light text-[#767676]">
                                {isForeign
                                    ? "* You must agree to the required terms to sign up and use our services."
                                    : "* 필수 항목에 동의하셔야 회원가입 및 서비스 이용이 가능합니다."}
                            </p>
                        </AgreeCard>

                        {/* CARD 2 — 청소년보호정책 [필수] (youth) */}
                        <AgreeCard
                            label={i18n.youth}
                            requiredLabel={i18n.required}
                            checked={agree.youth}
                            onCheck={v => setAgree(s => ({ ...s, youth: v }))}
                            open={openCard === "youth"}
                            onToggleOpen={() => setOpenCard(openCard === "youth" ? "none" : "youth")}
                        >
                            <p className="text-[18px] text-[#222]">{isForeign ? "Article 2" : "제 2조(목적)"}</p>
                            {(isForeign ? [
                                "If you do not agree to the required items, your registration may be restricted.",
                                "Optional items do not affect your use of the service.",
                                "Detailed information can be found in the full text of each agreement.",
                                "We provide marketing updates, including events, discount benefits, and new product arrivals.",
                            ] : [
                                "필수 동의 항목을 체크하지 않을 경우 회원가입이 제한될 수 있습니다.",
                                "선택 동의 항목은 서비스 이용에 영향을 미치지 않습니다.",
                                "자세한 내용은 각 약관 전문을 통해 확인하실 수 있습니다.",
                                "이벤트, 할인 혜택, 신상품 안내 등의 마케팅 정보를 제공합니다.",
                            ]).map((line, i) => (
                                <p key={i} className="text-[14px] text-[#000]">{line}</p>
                            ))}
                        </AgreeCard>

                        {/* CARD 3 — 마케팅 정보 수신 동의 [필수] (marketing + SMS/email sub-toggles) */}
                        <AgreeCard
                            label={i18n.marketing}
                            requiredLabel={i18n.required}
                            checked={agree.marketing}
                            onCheck={v => {
                                setAgree(s => ({ ...s, marketing: v }));
                                setForm(s => ({ ...s, marketingEmail: v, marketingSms: v }));
                            }}
                            open={openCard === "marketing"}
                            onToggleOpen={() => setOpenCard(openCard === "marketing" ? "none" : "marketing")}
                        >
                            <div className="flex items-center gap-4">
                                <PillRadio
                                    label={i18n.smsConsent}
                                    checked={form.marketingSms}
                                    onChange={v => { update("marketingSms", v); if (v) setAgree(s => ({ ...s, marketing: true })); }}
                                />
                                <PillRadio
                                    label={i18n.emailConsent}
                                    checked={form.marketingEmail}
                                    onChange={v => { update("marketingEmail", v); if (v) setAgree(s => ({ ...s, marketing: true })); }}
                                />
                            </div>
                            <p className="text-[14px] text-[#767676]">
                                {isForeign
                                    ? "You can receive useful shopping updates, including discount coupons, exclusive benefits, events, and new arrivals via SMS or email. However, transaction information and notices related to key policies will be sent regardless of your consent."
                                    : "할인쿠폰 및 혜택, 이벤트, 신상품 소식 등 쇼핑몰에서 제공하는 유익한 쇼핑정보를 SMS나 이메일로 받아보실 수 있습니다. 단 주문/거래 정보 및 주요 정책과 관련된 내용은 수신동의 여부와 관계없이 발송됩니다."}
                            </p>
                        </AgreeCard>

                        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

                        {/* 취소 / 다음 */}
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => router.push("/signup")}
                                className="w-[200px] p-4 bg-[#F6F7FB] rounded-[4px] text-center text-[14px] font-medium text-[#767676]"
                            >
                                {i18n.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={goInfo}
                                disabled={!allRequired}
                                className="w-[200px] p-4 bg-[#222222] rounded-[4px] text-center text-[14px] font-medium text-white disabled:opacity-40"
                            >
                                {i18n.next}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {step === "info" && (
                <div className="mx-auto max-w-[1000px] px-4 pt-10 md:pt-[60px] pb-20 flex flex-col items-center gap-[60px]">
                    {/* 회원가입 타이틀 */}
                    <h1 className="text-[32px] md:text-[36px] font-bold text-center text-[#222222]">
                        {i18n.title}
                    </h1>

                    {/* STEPPER — 약관동의(done) / 정보입력(active) / 가입완료(inactive) */}
                    <Stepper current="info" foreign={isForeign} />

                    <form onSubmit={onSubmit} className="w-full flex flex-col gap-10">
                        {/* ───── SECTION A — 회원정보 (필수) ───── */}
                        <section className="flex flex-col">
                            <div className="flex justify-between items-end pb-5 border-b border-[#E5E5EC]">
                                <h2 className="text-[32px] font-bold text-[#000]">{i18n.sectionTitle}</h2>
                                <span className="text-[14px] font-light text-[#0072DD]">{i18n.markRequired}</span>
                            </div>

                            <div className="border-t border-[#222222] py-10 flex flex-col gap-8">
                                <SpecRow label={i18n.lblId} required>
                                    <input
                                        type="text"
                                        placeholder={i18n.phId}
                                        className={`${specInput} w-full max-w-[480px]`}
                                        value={form.emailLocal}
                                        onChange={e => update("emailLocal", e.target.value)}
                                    />
                                </SpecRow>

                                <SpecRow label={i18n.lblPassword} required>
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="password"
                                            placeholder={i18n.phPwd}
                                            className={`${specInput} w-full max-w-[480px]`}
                                            value={form.password}
                                            onChange={e => update("password", e.target.value)}
                                        />
                                        <p className="text-[14px] font-light text-[#DC0000]">{i18n.pwdHint}</p>
                                    </div>
                                </SpecRow>

                                <SpecRow label={isForeign ? <>Confirm<br />Password</> : i18n.lblPasswordConfirm} required>
                                    <input
                                        type="password"
                                        placeholder={i18n.phPwdConfirm}
                                        className={`${specInput} w-full max-w-[480px]`}
                                        value={form.passwordConfirm}
                                        onChange={e => update("passwordConfirm", e.target.value)}
                                    />
                                </SpecRow>

                                <SpecRow label={i18n.lblName} required>
                                    <input
                                        type="text"
                                        placeholder={i18n.phName}
                                        className={`${specInput} w-full max-w-[480px]`}
                                        value={form.name}
                                        onChange={e => update("name", e.target.value)}
                                    />
                                </SpecRow>

                                <SpecRow label={i18n.lblLandline} required>
                                    <div className="flex flex-wrap items-center gap-1">
                                        <div className="relative w-[150px] max-w-full">
                                            <select
                                                value={form.landlinePrefix}
                                                onChange={e => update("landlinePrefix", e.target.value)}
                                                className={`${specSelect} w-full`}
                                            >
                                                <option>02</option><option>031</option><option>032</option>
                                                <option>033</option><option>041</option><option>042</option>
                                                <option>043</option><option>044</option><option>051</option>
                                                <option>052</option><option>053</option><option>054</option>
                                                <option>055</option><option>061</option><option>062</option>
                                                <option>063</option><option>064</option>
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        <span className="w-[7px] h-px bg-[#222] shrink-0" />
                                        <input type="text" inputMode="numeric" className={`${specInput} w-[150px] max-w-full`}
                                            value={form.landline2} onChange={e => update("landline2", e.target.value)} />
                                        <span className="w-[7px] h-px bg-[#222] shrink-0" />
                                        <input type="text" inputMode="numeric" className={`${specInput} w-[150px] max-w-full`}
                                            value={form.landline3} onChange={e => update("landline3", e.target.value)} />
                                    </div>
                                </SpecRow>

                                <SpecRow label={i18n.lblMobile} required>
                                    <div className="flex flex-wrap items-center gap-1">
                                        <div className="relative w-[150px] max-w-full">
                                            <select
                                                value={form.phonePrefix}
                                                onChange={e => update("phonePrefix", e.target.value)}
                                                className={`${specSelect} w-full`}
                                            >
                                                <option>010</option><option>011</option><option>016</option>
                                                <option>017</option><option>018</option><option>019</option>
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        <span className="w-[7px] h-px bg-[#222] shrink-0" />
                                        <input type="text" inputMode="numeric" className={`${specInput} w-[150px] max-w-full`}
                                            value={form.phone2} onChange={e => update("phone2", e.target.value)} />
                                        <span className="w-[7px] h-px bg-[#222] shrink-0" />
                                        <input type="text" inputMode="numeric" className={`${specInput} w-[150px] max-w-full`}
                                            value={form.phone3} onChange={e => update("phone3", e.target.value)} />
                                    </div>
                                </SpecRow>

                                <SpecRow label={isForeign ? <>Identity<br />Verification</> : i18n.lblCert} required twoLineLabel>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input type="text" placeholder={i18n.phCert}
                                            className={`${specInput} w-[332px] max-w-full`}
                                            value={form.certCode} onChange={e => update("certCode", e.target.value)} />
                                        <button type="button"
                                            className="w-[140px] p-4 bg-[#0072DD] rounded-[4px] text-white text-[14px] font-medium">
                                            {i18n.btnVerify}
                                        </button>
                                    </div>
                                </SpecRow>

                                <SpecRow label={i18n.lblBirth} required>
                                    <div className="flex flex-wrap items-center gap-1">
                                        <div className="relative w-[150px] max-w-full">
                                            <select value={form.birthYear} onChange={e => update("birthYear", e.target.value)} className={`${specSelect} w-full`}>
                                                <option value="">{i18n.optYear}</option>
                                                {Array.from({ length: 80 }, (_, i) => 2010 - i).map(y => (
                                                    <option key={y} value={String(y)}>{y}</option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        <div className="relative w-[150px] max-w-full">
                                            <select value={form.birthMonth} onChange={e => update("birthMonth", e.target.value)} className={`${specSelect} w-full`}>
                                                <option value="">{i18n.optMonth}</option>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={String(m)}>{m}</option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        <div className="relative w-[150px] max-w-full">
                                            <select value={form.birthDay} onChange={e => update("birthDay", e.target.value)} className={`${specSelect} w-full`}>
                                                <option value="">{i18n.optDay}</option>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={String(d)}>{d}</option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    </div>
                                </SpecRow>

                                <SpecRow label={i18n.lblEmail} required>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input type="text" placeholder={i18n.phEmail}
                                            className={`${specInput} w-[212px] max-w-full`}
                                            value={form.emailLocal} onChange={e => update("emailLocal", e.target.value)} />
                                        <span className="text-[14px] text-[#505050]">@</span>
                                        <input type="text"
                                            className={`${specInput} w-[212px] max-w-full`}
                                            value={form.emailDomainCustom} onChange={e => update("emailDomainCustom", e.target.value)} />
                                        <div className="relative w-[140px] max-w-full">
                                            <select
                                                value={form.emailDomain}
                                                onChange={e => {
                                                    update("emailDomain", e.target.value);
                                                    if (e.target.value !== "") update("emailDomainCustom", e.target.value);
                                                }}
                                                className={`${specSelect} w-full`}>
                                                <option value="">{i18n.domainManually}</option>
                                                <option value="naver.com">naver.com</option>
                                                <option value="gmail.com">gmail.com</option>
                                                <option value="daum.net">daum.net</option>
                                                <option value="hanmail.net">hanmail.net</option>
                                                <option value="kakao.com">kakao.com</option>
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    </div>
                                </SpecRow>

                                <SpecRow label={i18n.lblAddress} required>
                                    <div className="flex flex-col gap-2 w-[600px] max-w-full">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <input type="text" placeholder={i18n.phAddress}
                                                className={`${specInput} w-[260px] max-w-full`}
                                                value={form.addressZip} onChange={e => update("addressZip", e.target.value)} />
                                            <button type="button"
                                                className="w-[140px] p-4 bg-[#0072DD] rounded-[4px] text-white text-[14px] font-medium">
                                                {i18n.btnFindZip}
                                            </button>
                                        </div>
                                        <input type="text" className={`${specInput} w-full`}
                                            value={form.address1} onChange={e => update("address1", e.target.value)} />
                                        <input type="text" className={`${specInput} w-full`}
                                            value={form.address2} onChange={e => update("address2", e.target.value)} />
                                    </div>
                                </SpecRow>

                                <SpecRow label={isForeign ? <>Marketing<br />Consent</> : i18n.lblMarketing} required twoLineLabel>
                                    <div className="flex items-center gap-6">
                                        <SpecPillRadio label={i18n.radioEmailNoti} checked={form.marketingEmail}
                                            onChange={v => update("marketingEmail", v)} />
                                        <SpecPillRadio label={i18n.radioSmsNoti} checked={form.marketingSms}
                                            onChange={v => update("marketingSms", v)} />
                                    </div>
                                </SpecRow>
                            </div>
                        </section>

                        {/* ───── SECTION B — 회원정보 (선택) ───── */}
                        <section className="flex flex-col">
                            <div className="flex justify-between items-end pb-5 border-b border-[#E5E5EC]">
                                <h2 className="text-[32px] font-bold text-[#000]">{i18n.sectionTitle}</h2>
                                <span className="text-[14px] font-light text-[#0072DD]">{i18n.markOptional}</span>
                            </div>

                            <div className="border-t border-[#222222] py-10 flex flex-col gap-8">
                                <SpecRow label={i18n.lblGender} required>
                                    <div className="flex items-center gap-6">
                                        <SpecPillRadio label={i18n.radioMale} checked={form.gender === "MALE"}
                                            onChange={() => update("gender", "MALE")} />
                                        <SpecPillRadio label={i18n.radioFemale} checked={form.gender === "FEMALE"}
                                            onChange={() => update("gender", "FEMALE")} />
                                    </div>
                                </SpecRow>

                                <SpecRow label={isForeign ? <>How did you<br />hear about us</> : i18n.lblJoinPath} required>
                                    <input type="text" placeholder={i18n.phJoinPath}
                                        className={`${specInput} w-full max-w-[480px]`}
                                        value={form.joinPath} onChange={e => update("joinPath", e.target.value)} />
                                </SpecRow>

                                <SpecRow label={i18n.lblReferral}>
                                    <input type="text" placeholder={i18n.phReferral}
                                        className={`${specInput} w-full max-w-[480px] uppercase`}
                                        maxLength={12}
                                        value={form.referralCode}
                                        onChange={e => update("referralCode", e.target.value.toUpperCase().trim())} />
                                </SpecRow>
                            </div>
                        </section>

                        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

                        {/* 가입완료 버튼 — SQUARE 검정, 좌측 정렬 */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="self-start w-[200px] p-4 bg-[#222222] rounded-[4px] text-center text-[14px] font-medium text-white disabled:opacity-40"
                        >
                            {submitting ? (isForeign ? "Processing..." : "처리 중...") : i18n.btnComplete}
                        </button>
                    </form>
                </div>
            )}

            {step === "done" && (
                <section className="mx-auto max-w-[560px] px-4 pt-10 md:pt-[60px] pb-20 flex flex-col items-center gap-[100px]">
                    {/* ── Top block: 회원가입 타이틀 + STEPPER (3/3 complete) ── */}
                    <div className="w-full flex flex-col items-center gap-10">
                        <h1 className="text-[32px] md:text-[36px] font-bold text-center text-[#222222]">
                            {i18n.title}
                        </h1>
                        {/* current="done" → 세 단계 모두 파란 채움 + 두 연결선 모두 #0072DD */}
                        <Stepper current="done" foreign={isForeign} />
                    </div>

                    {/* ── Complete block: 성공 그래픽 + 메시지 + 버튼 ── */}
                    <div className="flex flex-col items-center gap-[60px]">
                        {/* 성공 그래픽 — public/images 에 적합 자산 없어 인라인 SVG (체크 + 컨페티) */}
                        <SignupSuccessGraphic />

                        <div className="flex flex-col items-center gap-10">
                            <div className="flex flex-col items-center gap-4">
                                <h2 className="text-[36px] md:text-[56px] font-bold text-center text-[#222222] leading-tight">
                                    {i18n.doneTitle}
                                </h2>
                                <p className="text-[18px] text-[#767676] text-center">
                                    {i18n.doneDesc}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href="/mypage/settings"
                                    className="w-[200px] p-4 bg-[#F3F3F3] rounded-[4px] text-center text-[14px] font-medium text-[#505050] block"
                                >
                                    {i18n.btnEditProf}
                                </Link>
                                <Link
                                    href="/products"
                                    className="w-[200px] p-4 bg-[#222222] rounded-[4px] text-center text-[14px] font-medium text-white block"
                                >
                                    {i18n.btnShop}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

/* ============================================================
 * Figma 정보입력 — input / select 공통 클래스 (37:10562)
 *   p-4 / radius 4px / border #DDDDDD / focus #222 / placeholder #767676
 * ============================================================ */
const specInput =
    "p-4 rounded-[4px] border border-[#DDDDDD] text-[14px] text-[#000] " +
    "outline-none focus:border-[#222] placeholder:text-[#767676] bg-white";

// select 는 chevron 자리 확보 위해 pr 넉넉히 + appearance-none
const specSelect =
    "appearance-none p-4 pr-10 rounded-[4px] border border-[#DDDDDD] text-[14px] text-[#000] " +
    "outline-none focus:border-[#222] bg-white";

/* 셀렉트 우측 chevron — 부모는 relative 여야 함 */
function SelectChevron() {
    return (
        <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
        >
            <path d="M4 6L8 10L12 6" stroke="#767676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ============================================================
 * SpecRow — Figma 정보입력 라벨/입력 행 (label cell 120px + 입력 영역)
 *   label: text-[14px] font-medium #000 + 필수 * (#0072DD)
 *   반응형: 좁은 화면에선 라벨이 위로 스택 (md 부터 좌측 고정)
 * ============================================================ */
function SpecRow({
    label, required, twoLineLabel, children,
}: {
    label: React.ReactNode;
    required?: boolean;
    twoLineLabel?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-0">
            <div className="md:w-[120px] md:shrink-0 flex md:pt-4">
                <span className={`text-[14px] font-medium text-[#000] ${twoLineLabel ? "whitespace-pre-line" : ""}`}>
                    {label}
                </span>
                {required && <span className="text-[14px] font-medium text-[#0072DD]">*</span>}
            </div>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

/* ============================================================
 * SpecPillRadio — Figma 정보입력 알약 라디오 (22px round)
 *   selected: bg-#0072DD + 흰 점 10px / unselected: bg-#E5E5EC
 *   label: text-[14px] font-medium #505050
 * ============================================================ */
function SpecPillRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
            className="flex items-center gap-2"
        >
            <span
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition ${
                    checked ? "bg-[#0072DD]" : "bg-[#E5E5EC]"
                }`}
            >
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
            </span>
            <span className="text-[14px] font-medium text-[#505050]">{label}</span>
        </button>
    );
}

/* ============================================================
 * ChoiceScreen — Step 1: 회원가입 방식 선택 (37:10502)
 * ============================================================ */
function ChoiceScreen({ onKorean, onForeign }: { onKorean: () => void; onForeign: () => void }) {
    function social(provider: "KAKAO" | "GOOGLE") {
        alert(`${provider} 로그인은 도급인 콘솔 키 수령 후 활성화됩니다.`);
    }
    return (
        <div className="py-8 md:py-16 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-fg)] mb-3">
                회원가입을 시작해 볼까요?
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mb-12">
                회원가입으로 구매시 40% 할인을 할수 있습니다!
            </p>

            <div className="max-w-[640px] mx-auto space-y-3">
                {/* 카카오 — 노란색 (시안: 각진 모서리 rounded-none) */}
                <button
                    type="button"
                    onClick={() => social("KAKAO")}
                    className="w-full flex items-center justify-center gap-2 py-[18px] rounded-none bg-[#FEE500] text-[#191919] text-sm font-medium hover:brightness-95 transition"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#191919">
                        <path d="M12 3C6.48 3 2 6.52 2 10.87c0 2.75 1.81 5.16 4.56 6.55-.2.71-.73 2.65-.84 3.06-.13.51.19.51.41.37.17-.12 2.74-1.86 3.83-2.6.66.09 1.34.14 2.04.14 5.52 0 10-3.52 10-7.87S17.52 3 12 3z"/>
                    </svg>
                    카카오로 3초만에 가입하기
                </button>

                {/* 구글 — 흰색 + 보더 (시안: 각진 모서리 rounded-none) */}
                <button
                    type="button"
                    onClick={() => social("GOOGLE")}
                    className="w-full flex items-center justify-center gap-2 py-[18px] rounded-none bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] transition"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    구글로 3초만에 가입하기
                </button>

                {/* 일반 회원가입 — 검정 (시안: 각진 모서리 rounded-none) */}
                <button
                    type="button"
                    onClick={onKorean}
                    className="w-full py-[18px] rounded-none bg-[var(--color-fg)] text-[var(--color-bg)] text-sm font-medium hover:opacity-90 transition"
                >
                    일반 회원가입
                </button>

                {/* 외국인 회원가입 — 연회색 (시안: 각진 모서리 rounded-none) */}
                <button
                    type="button"
                    onClick={onForeign}
                    className="w-full py-[18px] rounded-none bg-[var(--color-bg-subtle)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-bg-muted)] transition"
                >
                    외국인 회원가입
                </button>
            </div>
        </div>
    );
}

/* ============================================================
 * CertScreen — Step 2: PASS 본인인증 모달
 *   - 한국어 (37:11763): 가입 가능 여부 확인을 위해 본인인증을 진행할게요
 *   - 외국인 (274:8727): We will verify your identity to check your eligibility
 * ============================================================ */
function CertScreen({ foreign, onPick, onClose }: { foreign?: boolean; onPick: () => void; onClose: () => void }) {
    // Escape 로 닫기 + 모달 열려있는 동안 배경 스크롤 잠금
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    // 타이틀 — 두 줄, <br/> 유지 (Figma 37:11763 / 274:8727)
    const title = foreign ? (
        <>We will verify your identity<br />to check your eligibility</>
    ) : (
        <>가입 가능 여부 확인을 위해<br />본인인증을 진행할게요</>
    );
    const bullets = foreign
        ? [
            "Phone verification will be processed via mobile authentication",
            "I-PIN verification is processed through NICE Information Service",
            "Users under 14 will also need to complete a verification process with their legal guardian",
        ]
        : [
            "휴대폰 인증은 모바일인증을 통해 진행됩니다.",
            "아이핀 인증은 NICE 정보통신을 통해 진행돼요.",
            "14세 미만의 경우 본인 이외의 법정 대리인의 인증 절차도 함께 진행돼요.",
        ];
    const ipinLabel   = foreign ? "I-PIN Verification"    : "아이핀 인증";
    const mobileLabel = foreign ? "Mobile Authentication" : "휴대폰 인증";
    // 영문 라벨이 길어 고정폭 대신 flex-1 stretch (Figma 274:8727) — 한국어는 sm 이상에서 200px 고정
    const certBtn =
        `${foreign ? "flex-1" : "flex-1 sm:w-[200px]"} ` +
        "p-4 bg-[#F3F3F3] rounded-[4px] text-center text-[14px] font-medium text-[#505050] transition hover:bg-[#E9E9E9]";

    return (
        // 오버레이 — 클릭 시 닫기 (Figma: fixed inset-0 z-50 bg-black/60)
        <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-[540px] bg-white rounded-[10px] px-6 sm:px-[60px] py-10 flex flex-col gap-9"
            >
                {/* 헤더 — 타이틀+닫기 / 불릿 안내 */}
                <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-start gap-4">
                        <h2 className="text-[24px] font-medium text-[#000] leading-[34px]">
                            {title}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="닫기"
                            className="shrink-0 -mr-1 -mt-1 p-1 text-[#222] hover:opacity-70 transition"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M6 6L18 18M18 6L6 18" stroke="#222" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <ul className="flex flex-col gap-3">
                        {bullets.map((b, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E5E5EC] shrink-0" />
                                <span className="text-[14px] text-[#767676]">{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 인증 방식 — 아이핀 / 휴대폰 (둘 다 다음 스텝으로 진행) */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onPick}
                        className={certBtn}
                    >
                        {ipinLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onPick}
                        className={certBtn}
                    >
                        {mobileLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
 * Stepper — Step 3·4·5: 약관동의 → 정보입력 → 가입완료
 * ============================================================ */
function Stepper({ current, foreign }: { current: "agree" | "info" | "done"; foreign?: boolean }) {
    const steps = foreign ? [
        { id: "agree", label: "Agree to Terms" },
        { id: "info",  label: "Account Details" },
        { id: "done",  label: "Welcome" },
    ] as const : [
        { id: "agree", label: "약관동의" },
        { id: "info",  label: "정보입력" },
        { id: "done",  label: "가입완료" },
    ] as const;
    const order = (s: string) => steps.findIndex(x => x.id === s);
    const curIdx = order(current);

    return (
        <ol className="flex items-center justify-center gap-0">
            {steps.map((s, i) => {
                const filled = i <= curIdx; // done or active → 파란 채움
                return (
                    <li key={s.id} className="flex items-center">
                        <div className="flex flex-col items-center gap-2.5">
                            <span
                                className={`w-[46px] h-[46px] rounded-full flex items-center justify-center transition ${
                                    filled ? "bg-[#0072DD]" : "border border-[#DDDDDD]"
                                }`}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                    <path d="M4 10L8.5 14.5L16 6" stroke={filled ? "#FFFFFF" : "#DDDDDD"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <span className={`text-[16px] font-medium ${filled ? "text-[#000]" : "text-[#767676]"}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <span className="block w-[120px] md:w-[160px] h-[3px] rounded-full bg-[#F6F7FB] -mt-[34px]">
                                {/* 진행 표시: 완료 구간은 가득 / 활성 직전(현재→다음) 구간은 절반 */}
                                {i < curIdx ? (
                                    <span className="block w-full h-full bg-[#0072DD] rounded-full" />
                                ) : i === curIdx ? (
                                    <span className="block w-1/2 h-full bg-[#0072DD] rounded-full" />
                                ) : null}
                            </span>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

/* ============================================================
 * AgreeCard — 약관 카드 (round 체크 + 라벨 + [필수] + chevron + 접이식 body)
 * ============================================================ */
function AgreeCard({
    label, requiredLabel, checked, onCheck, open, onToggleOpen, children,
}: {
    label: string;
    requiredLabel: string;
    checked: boolean;
    onCheck: (v: boolean) => void;
    open: boolean;
    onToggleOpen: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="p-6 rounded-[10px] border border-[#DDDDDD] flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <button
                    type="button"
                    onClick={() => onCheck(!checked)}
                    aria-pressed={checked}
                    className="flex items-center gap-1.5"
                >
                    <RoundCheck checked={checked} />
                    <span className="text-[18px] font-medium text-[#000]">{label}</span>
                    <span className="text-[18px] font-medium text-[#0072DD]">{requiredLabel}</span>
                </button>
                <button
                    type="button"
                    onClick={onToggleOpen}
                    aria-label={open ? "접기" : "펼치기"}
                    className="shrink-0"
                >
                    <Chevron open={open} />
                </button>
            </div>
            {open && (
                <div className="px-4 flex flex-col gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}

/* 라운드 체크박스 (28px) — 체크 시 파란 채움 + 흰 체크 */
function RoundCheck({ checked }: { checked: boolean }) {
    return (
        <span
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${
                checked ? "bg-[#0072DD] border-[#0072DD]" : "border-[#BEBEBE]"
            }`}
        >
            {checked && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3.5 8L6.8 11.3L12.5 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </span>
    );
}

/* 다운 chevron (~36px, stroke #222) — open 시 회전 */
function Chevron({ open }: { open: boolean }) {
    return (
        <svg
            width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
            <path d="M12 15L18 21L24 15" stroke="#222222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* 알약형 라디오 — 마케팅 SMS/이메일 서브 토글 */
function PillRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
            className="flex items-center gap-1"
        >
            <span
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center ${
                    checked ? "bg-[#0072DD]" : "bg-[#E5E5EC]"
                }`}
            >
                <span className={`w-2.5 h-2.5 rounded-full ${checked ? "bg-white" : "bg-white"}`} />
            </span>
            <span className="text-[14px] font-medium text-[#505050]">{label}</span>
        </button>
    );
}

/* Radio / FieldRow 제거 — 정보입력 SpecRow·SpecPillRadio 로 대체 (Figma 37:10562) */

/* ============================================================
 * SignupSuccessGraphic — 가입완료 성공 그래픽 (Figma 37:10594)
 *   public/images 에 적합한 축하 자산이 없어 인라인 SVG 로 렌더.
 *   소프트 원 안의 큰 #0072DD 체크 + 절제된 컨페티 점 몇 개.
 *   viewBox 443×337 (spec aspect ~443/337), 폭은 w-[443px] max-w-full h-auto.
 * ============================================================ */
function SignupSuccessGraphic() {
    return (
        <svg
            viewBox="0 0 443 337"
            className="w-[443px] max-w-full h-auto"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* 소프트 배경 원 (옅은 파랑) */}
            <circle cx="221.5" cy="168.5" r="110" fill="#E8F2FD" />
            {/* 메인 원 (#0072DD) */}
            <circle cx="221.5" cy="168.5" r="78" fill="#0072DD" />
            {/* 흰 체크 */}
            <path
                d="M188 169.5L211 192.5L256 147.5"
                stroke="#FFFFFF"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* 컨페티 — 절제된 점/조각 (좌측) */}
            <circle cx="92" cy="96" r="9" fill="#0072DD" opacity="0.85" />
            <circle cx="66" cy="178" r="6" fill="#9CC9F2" />
            <circle cx="118" cy="248" r="7" fill="#0072DD" opacity="0.7" />
            <rect x="138" y="60" width="13" height="13" rx="3" transform="rotate(24 138 60)" fill="#9CC9F2" />
            {/* 컨페티 — 절제된 점/조각 (우측) */}
            <circle cx="351" cy="92" r="9" fill="#0072DD" opacity="0.85" />
            <circle cx="378" cy="172" r="6" fill="#9CC9F2" />
            <circle cx="325" cy="250" r="7" fill="#0072DD" opacity="0.7" />
            <rect x="296" y="58" width="13" height="13" rx="3" transform="rotate(-18 296 58)" fill="#9CC9F2" />
            {/* 가는 라인 컨페티 */}
            <path d="M150 282L160 272" stroke="#9CC9F2" strokeWidth="4" strokeLinecap="round" />
            <path d="M298 280L288 270" stroke="#9CC9F2" strokeWidth="4" strokeLinecap="round" />
        </svg>
    );
}
