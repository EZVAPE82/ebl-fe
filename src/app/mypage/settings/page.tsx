"use client";

/**
 * 회원정보 수정 (Figma node 37:12499) — 풀 레이아웃 재구성.
 *
 * 레이아웃 (sidebar 260 + main 1000, gap 80):
 * - 외곽: mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex col→row gap-20
 * - 좌측: 공유 <MyPageSideNav /> (현재 경로로 "회원정보 수정" 자동 active)
 * - 메인: flex-1 lg:w-[1000px] — Form(섹션 A 필수 / 섹션 B 선택) + 하단 액션
 *
 * 데이터/로직 보존(절대 변경 금지):
 * - useAuth 로 현재 회원 조회, 비로그인 시 /login?redirect 로 리다이렉트
 * - 아이디(email-local)/이름/이메일/휴대전화 prefill (graceful fallback)
 * - saveProfile() PUT /api/v1/members/me (마케팅 동의)
 * - changePassword() POST /api/v1/members/me/password (현재+신규, validatePassword)
 * - withdraw() DELETE /api/v1/members/me (확인 후 익명화)
 * - 확인 버튼: 비밀번호 둘 다 입력 시 changePassword, 아니면 saveProfile (기존 동작 유지)
 *
 * 디자인 노트:
 * - 섹션 헤더: 32px 굵게 + 우측 안내문구, 하단 옅은 보더 + 굵은 검정 상단 보더
 * - 일반 입력: rounded-[4px] border #E5E5EC, focus #222
 * - 비활성 입력(아이디/이름/우편/기본주소): bg #F7F7FB + border #BEBEBE + text #767676
 * - 우편번호 찾기 버튼: #0072DD, 확인: #222, 취소: #F3F3F3, 회원탈퇴: 흰 배경 보더
 * - 라디오 pill: 22px round, 선택 시 #0072DD + 흰 점
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { validatePassword } from "@/lib/validation";
import { MyPageSideNav } from "@/components/mypage/SideNav";

export default function MyPageSettings() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // 전화/이메일/생년월일/주소/마케팅 등 폼 상태
    const [phoneHome, setPhoneHome] = useState({ a: "02", b: "", c: "" });
    const [phoneMobile, setPhoneMobile] = useState({ a: "010", b: "", c: "" });
    const [emailLocal, setEmailLocal] = useState("");
    const [emailDomain, setEmailDomain] = useState("naver.com");
    const [emailDomainMode, setEmailDomainMode] = useState("직접입력");
    const [birth, setBirth] = useState({ y: "1999", m: "01", d: "01" });
    const [zip, setZip] = useState("");
    const [addr1, setAddr1] = useState("");
    const [addr2, setAddr2] = useState("");
    // 시안: 이메일수신 / SMS 수신 — 둘 다 체크 가능 (multi-select)
    const [marketingEmail, setMarketingEmail] = useState(true);
    const [marketingSms, setMarketingSms] = useState(true);
    const [gender, setGender] = useState<"M" | "F" | "">("M");
    const [joinPath, setJoinPath] = useState("");

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/mypage/settings");
            return;
        }
        if (user?.email) {
            const [local, domain] = user.email.split("@");
            setEmailLocal(local || "");
            if (domain) setEmailDomain(domain);
        }
        if (user?.phone) {
            // 010-1234-5678 형태로 가정
            const parts = user.phone.split("-");
            if (parts.length === 3) {
                setPhoneMobile({ a: parts[0], b: parts[1], c: parts[2] });
            }
        }
    }, [user, authLoading, router]);

    async function saveProfile() {
        try {
            await api("/api/v1/members/me", {
                method: "PUT",
                auth: true,
                body: JSON.stringify({
                    marketingEmailAgreed: marketingEmail,
                    marketingSmsAgreed: marketingSms,
                }),
            });
            alert("저장되었습니다.");
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "저장 실패");
        }
    }

    async function changePassword() {
        const err = validatePassword(newPassword);
        if (err) {
            alert(err);
            return;
        }
        try {
            await api("/api/v1/members/me/password", {
                method: "POST",
                auth: true,
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
            await logout();
            router.replace("/login");
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "변경 실패");
        }
    }

    async function withdraw() {
        if (!confirm("정말 탈퇴하시겠어요? 개인정보가 즉시 익명화됩니다.")) return;
        try {
            await api("/api/v1/members/me", { method: "DELETE", auth: true });
            await logout();
            alert("탈퇴 처리되었습니다.");
            router.replace("/");
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "탈퇴 실패");
        }
    }

    async function handleConfirm() {
        if (currentPassword && newPassword) {
            await changePassword();
        } else {
            await saveProfile();
        }
    }

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 text-[#767676]">
                불러오는 중...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex flex-col lg:flex-row gap-20">
            {/* 좌측: 공유 사이드바 — 현재 경로(/mypage/settings)로 "회원정보 수정" 자동 강조 */}
            <MyPageSideNav />

            {/* 메인 */}
            <main className="flex-1 lg:w-[1000px] flex flex-col gap-10">
                <form
                    className="flex flex-col gap-[60px]"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleConfirm();
                    }}
                >
                    {/* ===== 섹션 A — 회원정보 수정 (필수) ===== */}
                    <section className="flex flex-col">
                        <header className="flex justify-between items-end pb-5 border-b border-[#E5E5EC]">
                            <h2 className="text-[32px] font-bold text-[#000000] leading-tight">
                                회원정보 수정
                            </h2>
                            <span className="text-[14px] font-light text-[#0072DD]">
                                *필수입력사항
                            </span>
                        </header>

                        <div className="border-t border-[#222222] py-10 flex flex-col gap-8">
                            <FormRow label="아이디" required>
                                <ReadOnlyInput
                                    value={user.email.split("@")[0] || "—"}
                                    className="w-full max-w-[480px]"
                                />
                            </FormRow>

                            <FormRow label="비밀번호" required>
                                <FormInput
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="비밀번호를 입력해주세요"
                                    autoComplete="current-password"
                                    className="w-full max-w-[480px]"
                                />
                            </FormRow>

                            <FormRow label="신규 비밀번호" required>
                                <FormInput
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="비밀번호를 입력해주세요"
                                    autoComplete="new-password"
                                    className="w-full max-w-[480px]"
                                />
                            </FormRow>

                            <FormRow label="이름" required>
                                <ReadOnlyInput
                                    value={user.name || "—"}
                                    className="w-full max-w-[480px]"
                                />
                            </FormRow>

                            <FormRow label="일반전화" required>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <FormSelect
                                        value={phoneHome.a}
                                        onChange={(e) =>
                                            setPhoneHome({ ...phoneHome, a: e.target.value })
                                        }
                                        options={["02", "031", "032", "051", "053", "062"]}
                                        className="w-full max-w-[150px]"
                                    />
                                    <Dash />
                                    <FormInput
                                        value={phoneHome.b}
                                        onChange={(e) =>
                                            setPhoneHome({ ...phoneHome, b: e.target.value })
                                        }
                                        inputMode="numeric"
                                        className="w-full max-w-[150px]"
                                    />
                                    <Dash />
                                    <FormInput
                                        value={phoneHome.c}
                                        onChange={(e) =>
                                            setPhoneHome({ ...phoneHome, c: e.target.value })
                                        }
                                        inputMode="numeric"
                                        className="w-full max-w-[150px]"
                                    />
                                </div>
                            </FormRow>

                            <FormRow label="휴대전화" required>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <FormSelect
                                        value={phoneMobile.a}
                                        onChange={(e) =>
                                            setPhoneMobile({ ...phoneMobile, a: e.target.value })
                                        }
                                        options={["010", "011", "016", "017", "018", "019"]}
                                        className="w-full max-w-[150px]"
                                    />
                                    <Dash />
                                    <FormInput
                                        value={phoneMobile.b}
                                        onChange={(e) =>
                                            setPhoneMobile({ ...phoneMobile, b: e.target.value })
                                        }
                                        inputMode="numeric"
                                        className="w-full max-w-[150px]"
                                    />
                                    <Dash />
                                    <FormInput
                                        value={phoneMobile.c}
                                        onChange={(e) =>
                                            setPhoneMobile({ ...phoneMobile, c: e.target.value })
                                        }
                                        inputMode="numeric"
                                        className="w-full max-w-[150px]"
                                    />
                                </div>
                            </FormRow>

                            <FormRow label="이메일" required>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <FormInput
                                        value={emailLocal}
                                        onChange={(e) => setEmailLocal(e.target.value)}
                                        className="w-full max-w-[212px]"
                                    />
                                    <span className="text-[14px] text-[#222222]">@</span>
                                    <FormInput
                                        value={emailDomain}
                                        onChange={(e) => setEmailDomain(e.target.value)}
                                        className="w-full max-w-[212px]"
                                    />
                                    <FormSelect
                                        value={emailDomainMode}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setEmailDomainMode(v);
                                            if (v !== "직접입력") setEmailDomain(v);
                                        }}
                                        options={[
                                            "직접입력",
                                            "naver.com",
                                            "gmail.com",
                                            "daum.net",
                                            "kakao.com",
                                        ]}
                                        className="w-full max-w-[140px]"
                                    />
                                </div>
                            </FormRow>

                            <FormRow label="생년월일" required>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <FormSelect
                                        value={birth.y}
                                        onChange={(e) => setBirth({ ...birth, y: e.target.value })}
                                        options={Array.from({ length: 80 }, (_, i) =>
                                            String(2026 - i)
                                        )}
                                        className="w-full max-w-[150px]"
                                    />
                                    <FormSelect
                                        value={birth.m}
                                        onChange={(e) => setBirth({ ...birth, m: e.target.value })}
                                        options={Array.from({ length: 12 }, (_, i) =>
                                            String(i + 1).padStart(2, "0")
                                        )}
                                        className="w-full max-w-[150px]"
                                    />
                                    <FormSelect
                                        value={birth.d}
                                        onChange={(e) => setBirth({ ...birth, d: e.target.value })}
                                        options={Array.from({ length: 31 }, (_, i) =>
                                            String(i + 1).padStart(2, "0")
                                        )}
                                        className="w-full max-w-[150px]"
                                    />
                                </div>
                            </FormRow>

                            <FormRow label="주소" required>
                                <div className="flex flex-col gap-2 w-full max-w-[600px]">
                                    <div className="flex gap-2 flex-wrap">
                                        <ReadOnlyInput
                                            value={zip}
                                            placeholder="우편번호"
                                            className="w-full max-w-[260px]"
                                        />
                                        <button
                                            type="button"
                                            className="w-full max-w-[140px] p-4 bg-[#0072DD] rounded-[4px] text-white text-[14px] font-medium hover:bg-[#0061bb]"
                                            onClick={() => {
                                                // 우편번호 검색 연동 자리 — 임시 수동 입력 fallback
                                                const z = prompt("우편번호를 입력해주세요");
                                                if (z) setZip(z);
                                            }}
                                        >
                                            우편번호 찾기
                                        </button>
                                    </div>
                                    <ReadOnlyInput
                                        value={addr1}
                                        placeholder="기본주소 (우편번호 검색 시 자동 입력)"
                                        className="w-full max-w-[600px]"
                                    />
                                    <FormInput
                                        value={addr2}
                                        onChange={(e) => setAddr2(e.target.value)}
                                        placeholder="상세주소를 입력해주세요"
                                        className="w-full max-w-[600px]"
                                    />
                                </div>
                            </FormRow>

                            <FormRow
                                label={
                                    <>
                                        마케팅 및<br />광고 활용 동의
                                    </>
                                }
                                required
                            >
                                {/* 시안: 이메일수신 / SMS 수신 — 둘 다 체크 가능 (multi-select toggle) */}
                                <div className="flex items-center gap-6 pt-3 flex-wrap">
                                    <PillRadio
                                        checked={marketingEmail}
                                        onChange={() => setMarketingEmail((v) => !v)}
                                        label="이메일수신"
                                    />
                                    <PillRadio
                                        checked={marketingSms}
                                        onChange={() => setMarketingSms((v) => !v)}
                                        label="SMS 수신"
                                    />
                                </div>
                            </FormRow>
                        </div>
                    </section>

                    {/* ===== 섹션 B — 회원정보 (선택) ===== */}
                    <section className="flex flex-col">
                        <header className="flex justify-between items-end pb-5 border-b border-[#E5E5EC]">
                            <h2 className="text-[32px] font-bold text-[#000000] leading-tight">
                                회원정보
                            </h2>
                            <span className="text-[14px] font-light text-[#0072DD]">
                                *선택사항
                            </span>
                        </header>

                        <div className="border-t border-[#222222] py-10 flex flex-col gap-8">
                            <FormRow label="성별" required>
                                <div className="flex items-center gap-6 pt-3 flex-wrap">
                                    <PillRadio
                                        checked={gender === "M"}
                                        onChange={() => setGender("M")}
                                        label="남자"
                                    />
                                    <PillRadio
                                        checked={gender === "F"}
                                        onChange={() => setGender("F")}
                                        label="여자"
                                    />
                                </div>
                            </FormRow>

                            <FormRow label="가입경로" required>
                                <FormInput
                                    value={joinPath}
                                    onChange={(e) => setJoinPath(e.target.value)}
                                    placeholder="온라인마케팅을 통한 경로"
                                    className="w-full max-w-[480px]"
                                />
                            </FormRow>
                        </div>
                    </section>

                    {/* ===== 하단 액션 ===== */}
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <button
                            type="button"
                            onClick={withdraw}
                            className="w-full max-w-[140px] p-4 rounded-[4px] border border-[#222222] bg-white text-center text-[14px] font-medium text-[#222222] hover:bg-[#F7F7FB]"
                        >
                            회원탈퇴
                        </button>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full max-w-[200px] p-4 bg-[#F3F3F3] rounded-[4px] text-center text-[14px] font-medium text-[#505050] hover:bg-[#e9e9e9]"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="w-full max-w-[200px] p-4 bg-[#222222] rounded-[4px] text-center text-white text-[14px] font-medium hover:opacity-90"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}

/* ============================================================
 * 폼 보조 컴포넌트 — Figma 시안: 라벨 좌측 고정폭(120) + 필드 우측
 * ============================================================ */
function FormRow({
    label,
    required,
    children,
}: {
    label: React.ReactNode;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="w-[120px] shrink-0 flex pt-4">
                <span className="text-[14px] font-medium text-[#222222]">{label}</span>
                {required && (
                    <span className="text-[14px] font-medium text-[#0072DD]">*</span>
                )}
            </div>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

const INPUT_BASE =
    "block p-4 rounded-[4px] text-[14px] outline-none";

function FormInput({
    className = "",
    ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...rest}
            className={`${INPUT_BASE} border border-[#E5E5EC] text-[#222222] placeholder:text-[#767676] focus:border-[#222222] ${className}`}
        />
    );
}

/** 비활성(읽기 전용) 입력 — 시안: 연회색 배경 + 진한 보더 + 회색 텍스트 */
function ReadOnlyInput({
    className = "",
    ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...rest}
            readOnly
            disabled
            className={`${INPUT_BASE} bg-[#F7F7FB] border border-[#BEBEBE] text-[#767676] placeholder:text-[#767676] cursor-not-allowed ${className}`}
        />
    );
}

function FormSelect({
    options,
    className = "",
    ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
    return (
        <select
            {...rest}
            className={`${INPUT_BASE} border border-[#E5E5EC] text-[#222222] focus:border-[#222222] appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-9 ${className}`}
            style={{
                backgroundImage:
                    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23222' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
            }}
        >
            {options.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
        </select>
    );
}

/** 전화/입력 사이 대시 구분선 */
function Dash() {
    return <span className="w-[7px] h-px bg-[#222222] shrink-0" aria-hidden="true" />;
}

/** 22px pill 라디오 — 선택 시 파랑 채움 + 흰 점 */
function PillRadio({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
}) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer">
            <span
                onClick={onChange}
                className={`relative w-[22px] h-[22px] rounded-full flex items-center justify-center ${
                    checked ? "bg-[#0072DD]" : "bg-[#E5E5EC]"
                }`}
            >
                {checked && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
            <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
            <span className="text-[14px] font-medium text-[#505050]">{label}</span>
        </label>
    );
}
