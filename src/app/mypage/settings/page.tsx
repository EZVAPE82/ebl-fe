"use client";

/**
 * 회원정보 수정 (Figma node 37:12499).
 *
 * 디자인 노트 — 라운딩:
 * - 헤더 하단: 검정색 굵은 보더 라인
 * - 모든 입력 필드: rounded-sm (~4px), 옅은 회색 배경(읽기 전용처럼 보임)
 * - 우편번호 찾기 버튼: 파랑(#3b82f6), rounded-sm
 * - 라디오 버튼: 파랑 채움 + 흰색 점
 * - 하단 버튼(회원탈퇴/취소/확인): rounded-sm
 * - 섹션 구분: 굵은 검정 보더 헤더 + 옅은 보더 구분선
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
        if (!confirm("정말 탈퇴하시겠습니까? 개인정보가 즉시 익명화됩니다.")) return;
        try {
            await api("/api/v1/members/me", { method: "DELETE", auth: true });
            await logout();
            alert("탈퇴 처리되었습니다.");
            router.replace("/");
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "탈퇴 실패");
        }
    }

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-screen-2xl px-4 py-10 text-[var(--color-fg-subtle)]">
                불러오는 중...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 grid gap-8 md:grid-cols-[220px_1fr]">
            <MyPageSideNav />

            <main className="max-w-3xl">
                {/* ===== 헤더 ===== */}
                <header className="flex items-end justify-between pb-3 border-b-2 border-[var(--color-fg)]">
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-fg)]">
                        회원정보 수정
                    </h2>
                    <span className="text-xs text-[#3b82f6]">*필수입력사항</span>
                </header>

                {/* ===== 회원정보 폼 (필수) ===== */}
                <section className="py-6 space-y-4">
                    <FormRow label="아이디" required>
                        <ReadOnly value={user.email.split("@")[0] || "signaldecode02"} />
                    </FormRow>

                    <FormRow label="비밀번호" required>
                        <FormInput
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </FormRow>

                    <FormRow label="신규 비밀번호" required>
                        <FormInput
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="10자 이상, 영문·숫자·특수문자 포함"
                        />
                    </FormRow>

                    <FormRow label="이름" required>
                        <ReadOnly value={user.name} />
                    </FormRow>

                    <FormRow label="일반전화" required>
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <FormSelect
                                value={phoneHome.a}
                                onChange={(e) =>
                                    setPhoneHome({ ...phoneHome, a: e.target.value })
                                }
                                options={["02", "031", "032", "051", "053", "062"]}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--color-fg-muted)]">-</span>
                                <FormInput
                                    value={phoneHome.b}
                                    onChange={(e) =>
                                        setPhoneHome({ ...phoneHome, b: e.target.value })
                                    }
                                    placeholder="123"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--color-fg-muted)]">-</span>
                                <FormInput
                                    value={phoneHome.c}
                                    onChange={(e) =>
                                        setPhoneHome({ ...phoneHome, c: e.target.value })
                                    }
                                    placeholder="597"
                                />
                            </div>
                        </div>
                    </FormRow>

                    <FormRow label="휴대전화" required>
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <FormSelect
                                value={phoneMobile.a}
                                onChange={(e) =>
                                    setPhoneMobile({ ...phoneMobile, a: e.target.value })
                                }
                                options={["010", "011", "016", "017", "018", "019"]}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--color-fg-muted)]">-</span>
                                <FormInput
                                    value={phoneMobile.b}
                                    onChange={(e) =>
                                        setPhoneMobile({ ...phoneMobile, b: e.target.value })
                                    }
                                    placeholder="1234"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--color-fg-muted)]">-</span>
                                <FormInput
                                    value={phoneMobile.c}
                                    onChange={(e) =>
                                        setPhoneMobile({ ...phoneMobile, c: e.target.value })
                                    }
                                    placeholder="5678"
                                />
                            </div>
                        </div>
                    </FormRow>

                    <FormRow label="이메일" required>
                        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-center">
                            <FormInput
                                value={emailLocal}
                                onChange={(e) => setEmailLocal(e.target.value)}
                            />
                            <span className="text-[var(--color-fg-muted)]">@</span>
                            <FormInput
                                value={emailDomain}
                                onChange={(e) => setEmailDomain(e.target.value)}
                            />
                            <span />
                            <FormSelect
                                value={emailDomainMode}
                                onChange={(e) => setEmailDomainMode(e.target.value)}
                                options={[
                                    "직접입력",
                                    "naver.com",
                                    "gmail.com",
                                    "daum.net",
                                    "kakao.com",
                                ]}
                            />
                        </div>
                    </FormRow>

                    <FormRow label="생년월일" required>
                        <div className="grid grid-cols-3 gap-2">
                            <FormSelect
                                value={birth.y}
                                onChange={(e) => setBirth({ ...birth, y: e.target.value })}
                                options={Array.from({ length: 80 }, (_, i) =>
                                    String(2026 - i)
                                )}
                            />
                            <FormSelect
                                value={birth.m}
                                onChange={(e) => setBirth({ ...birth, m: e.target.value })}
                                options={Array.from({ length: 12 }, (_, i) =>
                                    String(i + 1).padStart(2, "0")
                                )}
                            />
                            <FormSelect
                                value={birth.d}
                                onChange={(e) => setBirth({ ...birth, d: e.target.value })}
                                options={Array.from({ length: 31 }, (_, i) =>
                                    String(i + 1).padStart(2, "0")
                                )}
                            />
                        </div>
                    </FormRow>

                    <FormRow label="주소" required>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <FormInput
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    placeholder="08533"
                                    className="!w-40"
                                />
                                <button
                                    type="button"
                                    className="rounded-sm bg-[#3b82f6] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#2563eb]"
                                >
                                    우편번호 찾기
                                </button>
                            </div>
                            <FormInput
                                value={addr1}
                                onChange={(e) => setAddr1(e.target.value)}
                                placeholder="서울특별시 마포구 잔다리로 44"
                            />
                            <FormInput
                                value={addr2}
                                onChange={(e) => setAddr2(e.target.value)}
                                placeholder="상세주소"
                            />
                        </div>
                    </FormRow>

                    <FormRow label="마케팅 및 광고 활용 동의" required>
                        {/* 시안: 이메일수신 / SMS 수신 — 둘 다 체크 가능 (multi-select toggle) */}
                        <div className="flex items-center gap-6 pt-2">
                            <RadioOption
                                checked={marketingEmail}
                                onChange={() => setMarketingEmail(v => !v)}
                                label="이메일 수신"
                            />
                            <RadioOption
                                checked={marketingSms}
                                onChange={() => setMarketingSms(v => !v)}
                                label="SMS 수신"
                            />
                        </div>
                    </FormRow>
                </section>

                {/* ===== 회원정보 (선택) ===== */}
                <header className="flex items-end justify-between pb-3 border-b-2 border-[var(--color-fg)] mt-8">
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-fg)]">
                        회원정보
                    </h2>
                    <span className="text-xs text-[#3b82f6]">*선택사항</span>
                </header>

                <section className="py-6 space-y-4">
                    <FormRow label="성별" required>
                        <div className="flex items-center gap-6 pt-2">
                            <RadioOption
                                checked={gender === "M"}
                                onChange={() => setGender("M")}
                                label="남자"
                            />
                            <RadioOption
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
                        />
                    </FormRow>
                </section>

                {/* ===== 하단 버튼 영역 ===== */}
                <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <button
                        type="button"
                        onClick={withdraw}
                        className="rounded-sm border border-[var(--color-border)] bg-white text-[var(--color-fg)] px-6 py-2.5 text-sm font-medium hover:bg-[var(--color-bg-subtle)] md:w-32"
                    >
                        회원탈퇴
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => router.replace("/mypage")}
                            className="rounded-sm bg-[var(--color-bg-subtle)] text-[var(--color-fg)] px-6 py-2.5 text-sm font-medium hover:bg-[var(--color-bg-muted)] md:w-32"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                if (currentPassword && newPassword) {
                                    await changePassword();
                                } else {
                                    await saveProfile();
                                }
                            }}
                            className="rounded-sm bg-[var(--color-fg)] text-white px-6 py-2.5 text-sm font-medium hover:opacity-90 md:w-32"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ============================================================
 * 폼 보조 컴포넌트 — Figma 시안: 라벨 좌측 고정폭, 입력 우측
 * ============================================================ */
function FormRow({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[100px_1fr] md:grid-cols-[120px_1fr] gap-4 items-start">
            <label className="pt-3 text-sm text-[var(--color-fg)]">
                {label}
                {required && <span className="text-[#3b82f6] ml-0.5">*</span>}
            </label>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function FormInput({
    className = "",
    ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...rest}
            className={`block w-full rounded-sm bg-[var(--color-bg-subtle)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-fg-muted)] ${className}`}
        />
    );
}

function FormSelect({
    options,
    ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
    return (
        <select
            {...rest}
            className="block w-full rounded-sm bg-[var(--color-bg-subtle)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-fg-muted)] appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem] pr-7"
            style={{
                backgroundImage:
                    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23999'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
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

function ReadOnly({ value }: { value: string }) {
    return (
        <div className="block w-full rounded-sm bg-[var(--color-bg-subtle)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-fg)]">
            {value}
        </div>
    );
}

function RadioOption({
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
                className={`relative w-4 h-4 rounded-full border ${
                    checked ? "border-[#3b82f6] bg-[#3b82f6]" : "border-[var(--color-border-strong)] bg-white"
                } flex items-center justify-center`}
            >
                {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <input type="radio" checked={checked} onChange={onChange} className="hidden" />
            <span className="text-sm text-[var(--color-fg)]">{label}</span>
        </label>
    );
}
