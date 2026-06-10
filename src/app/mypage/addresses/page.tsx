"use client";

/**
 * 배송지 관리 (Figma node 37:12534) — 풀 레이아웃 재구성.
 *
 * 레이아웃 (sidebar 260 + main 1000, gap 80):
 * - 외곽: mx-auto max-w-[1920px] px-4 xl:px-[170px] pt-10 md:pt-[60px] pb-20 flex col→row gap-20
 * - 좌측: 공유 <MyPageSideNav /> (현재 경로로 "배송지 관리" 자동 active)
 * - 메인: flex-1 lg:w-[1000px] — (등록된 배송지 리스트) + Form + 하단 액션
 *
 * 데이터/로직 보존(절대 변경 금지):
 * - useAuth 로 현재 회원 조회, 비로그인 시 /login?redirect 로 리다이렉트
 * - load(): GET /api/v1/members/me/addresses
 * - save(): editingId 면 PUT, 아니면 POST /api/v1/members/me/addresses (payload: label/recipientName/phone/postalCode/address1/address2/isDefault)
 * - remove(): DELETE /api/v1/members/me/addresses/{id}
 * - makeDefault(): POST /api/v1/members/me/addresses/{id}/default
 * - 이름은 회원 이름(user.name) prefill (신규 등록 시), 수정 시 행 값 매핑
 *
 * 디자인 노트 (회원정보 수정 페이지와 동일 디자인 시스템):
 * - 섹션 헤더: 32px 굵게 + 우측 안내문구, 하단 옅은 보더 + 굵은 검정 상단 보더
 * - 일반 입력: rounded-[4px] border #E5E5EC, focus #222
 * - 비활성 입력(이름/우편/기본주소): bg #F7F7FB + border #BEBEBE + text #767676
 * - 우편번호 찾기 버튼: #0072DD, 확인: #222, 취소: #F3F3F3
 * - 기본 배송지 라디오 pill: 22px round, 선택 시 #0072DD + 흰 점
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";

type AddressView = {
    id: number;
    label: string | null;
    recipientName: string;
    phoneMasked: string;
    postalCode: string;
    address1: string;
    address2: string | null;
    isDefault: boolean;
};

const PHONE_PREFIX_HOME = ["02", "031", "032", "033", "041", "042", "043", "051", "052", "053", "054", "055", "061", "062", "063", "064"];
const PHONE_PREFIX_MOBILE = ["010", "011", "016", "017", "018", "019"];
const EMAIL_DOMAINS = ["직접입력", "naver.com", "gmail.com", "daum.net", "hanmail.net", "nate.com"];

const empty = {
    label: "",
    recipientName: "",
    homePhone1: "02",
    homePhone2: "",
    homePhone3: "",
    mobilePhone1: "010",
    mobilePhone2: "",
    mobilePhone3: "",
    emailLocal: "",
    emailDomain: "",
    emailDomainSelect: "직접입력",
    postalCode: "",
    address1: "",
    address2: "",
    isDefault: true,
};

export default function AddressesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [list, setList] = useState<AddressView[]>([]);
    const [form, setForm] = useState({ ...empty });
    const [editingId, setEditingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            const r = await api<AddressView[]>("/api/v1/members/me/addresses", { auth: true });
            setList(r);
        } catch {
            // 무시
        }
    }, []);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!authLoading && !user) router.replace("/login?redirect=/mypage/addresses");
        else if (user) load();
    }, [user, authLoading, load, router]);

    // 신규 등록 폼에는 회원 이름(이름 필드 비활성) prefill — 수정 중이 아닐 때만.
    useEffect(() => {
        if (user?.name && !editingId) {
            setForm((s) => (s.recipientName ? s : { ...s, recipientName: user.name }));
        }
    }, [user, editingId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    async function save(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            label: form.label,
            recipientName: form.recipientName,
            phone: `${form.mobilePhone1}-${form.mobilePhone2}-${form.mobilePhone3}`,
            postalCode: form.postalCode,
            address1: form.address1,
            address2: form.address2,
            isDefault: form.isDefault,
        };
        try {
            if (editingId) {
                await api(`/api/v1/members/me/addresses/${editingId}`, {
                    method: "PUT", auth: true, body: JSON.stringify(payload),
                });
            } else {
                await api("/api/v1/members/me/addresses", {
                    method: "POST", auth: true, body: JSON.stringify(payload),
                });
            }
            setForm({ ...empty, recipientName: user?.name ?? "" });
            setEditingId(null);
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : "저장 실패");
        }
    }

    /** 수정 — 행 값을 폼에 매핑. 전화는 마스킹되어 복원 불가 → 휴대전화 본문은 재입력. */
    function edit(a: AddressView) {
        setEditingId(a.id);
        setForm({
            ...empty,
            label: a.label ?? "",
            recipientName: a.recipientName || (user?.name ?? ""),
            postalCode: a.postalCode,
            address1: a.address1,
            address2: a.address2 ?? "",
            isDefault: a.isDefault,
        });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function remove(id: number) {
        if (!confirm("이 배송지를 삭제하시겠어요?")) return;
        try {
            await api(`/api/v1/members/me/addresses/${id}`, { method: "DELETE", auth: true });
            if (editingId === id) {
                setEditingId(null);
                setForm({ ...empty, recipientName: user?.name ?? "" });
            }
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : "삭제 실패");
        }
    }

    async function makeDefault(id: number) {
        try {
            await api(`/api/v1/members/me/addresses/${id}/default`, { method: "POST", auth: true });
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : "기본 배송지 설정 실패");
        }
    }

    function cancel() {
        setEditingId(null);
        setForm({ ...empty, recipientName: user?.name ?? "" });
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
            {/* 좌측: 공유 사이드바 — 현재 경로(/mypage/addresses)로 "배송지 관리" 자동 강조 */}
            <MyPageSideNav />

            {/* 메인 */}
            <main className="flex-1 lg:w-[1000px] flex flex-col gap-10">
                {/* ===== 등록된 배송지 리스트 (있을 때만) ===== */}
                {list.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h3 className="text-[16px] font-semibold text-[#222222]">등록된 배송지</h3>
                        <ul className="flex flex-col gap-2">
                            {list.map((a) => (
                                <li
                                    key={a.id}
                                    className={`rounded-[4px] border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                                        a.isDefault ? "border-[#0072DD] bg-[#F6F9FF]" : "border-[#E5E5EC] bg-white"
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-semibold text-[#222222] truncate">
                                                {a.label || "배송지"}
                                            </span>
                                            {a.isDefault && (
                                                <span className="shrink-0 text-[11px] leading-none px-2 py-1 rounded-[4px] bg-[#0072DD] text-white">
                                                    기본
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 text-[13px] text-[#505050]">
                                            {a.recipientName} · {a.phoneMasked}
                                        </div>
                                        <div className="text-[13px] text-[#767676]">
                                            ({a.postalCode}) {a.address1} {a.address2 ?? ""}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!a.isDefault && (
                                            <button
                                                type="button"
                                                onClick={() => makeDefault(a.id)}
                                                className="px-3 py-2 rounded-[4px] border border-[#E5E5EC] text-[13px] font-medium text-[#505050] hover:bg-[#F7F7FB]"
                                            >
                                                기본설정
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => edit(a)}
                                            className="px-3 py-2 rounded-[4px] border border-[#E5E5EC] text-[13px] font-medium text-[#222222] hover:bg-[#F7F7FB]"
                                        >
                                            수정
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => remove(a.id)}
                                            className="px-3 py-2 rounded-[4px] border border-[#E5E5EC] text-[13px] font-medium text-[#767676] hover:bg-[#F7F7FB]"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ===== 배송지 추가/수정 폼 ===== */}
                <form onSubmit={save} className="flex flex-col gap-[60px]">
                    <section className="flex flex-col">
                        <header className="flex justify-between items-end pb-5 border-b border-[#E5E5EC]">
                            <h2 className="text-[32px] font-bold text-[#000000] leading-tight">
                                배송지 관리
                            </h2>
                            <span className="text-[14px] font-light text-[#0072DD]">
                                *필수입력사항
                            </span>
                        </header>

                        <div className="border-t border-[#222222] py-10 flex flex-col gap-8">
                            {/* 배송지명 */}
                            <FormRow label="배송지명" required>
                                <FormInput
                                    value={form.label}
                                    onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
                                    placeholder="배송지명을 입력해주세요"
                                    className="w-full max-w-[480px]"
                                />
                            </FormRow>

                            {/* 이름 — 비활성 (회원 이름 prefill) */}
                            <FormRow label="이름" required>
                                <ReadOnlyInput
                                    value={form.recipientName || "—"}
                                    className="w-full max-w-[480px]"
                                />
                            </FormRow>

                            {/* 일반전화 */}
                            <FormRow label="일반전화" required>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <FormSelect
                                        value={form.homePhone1}
                                        onChange={(e) => setForm((s) => ({ ...s, homePhone1: e.target.value }))}
                                        options={PHONE_PREFIX_HOME}
                                        className="w-full max-w-[150px]"
                                    />
                                    <Dash />
                                    <FormInput
                                        value={form.homePhone2}
                                        onChange={(e) => setForm((s) => ({ ...s, homePhone2: e.target.value.replace(/\D/g, "") }))}
                                        inputMode="numeric"
                                        className="w-full max-w-[150px]"
                                    />
                                    <Dash />
                                    <FormInput
                                        value={form.homePhone3}
                                        onChange={(e) => setForm((s) => ({ ...s, homePhone3: e.target.value.replace(/\D/g, "") }))}
                                        inputMode="numeric"
                                        className="w-full max-w-[150px]"
                                    />
                                </div>
                            </FormRow>

                            {/* 휴대전화 — 받는 분 연락처 */}
                            <FormRow label="휴대전화" required>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <FormSelect
                                        value={form.mobilePhone1}
                                        onChange={(e) => setForm((s) => ({ ...s, mobilePhone1: e.target.value }))}
                                        options={PHONE_PREFIX_MOBILE}
                                        className="w-full max-w-[150px]"
                                    />
                                    <Dash />
                                    <FormInput
                                        value={form.mobilePhone2}
                                        onChange={(e) => setForm((s) => ({ ...s, mobilePhone2: e.target.value.replace(/\D/g, "") }))}
                                        inputMode="numeric"
                                        required
                                        className="w-full max-w-[150px]"
                                    />
                                    <Dash />
                                    <FormInput
                                        value={form.mobilePhone3}
                                        onChange={(e) => setForm((s) => ({ ...s, mobilePhone3: e.target.value.replace(/\D/g, "") }))}
                                        inputMode="numeric"
                                        required
                                        className="w-full max-w-[150px]"
                                    />
                                </div>
                            </FormRow>

                            {/* 이메일 */}
                            <FormRow label="이메일" required>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <FormInput
                                        value={form.emailLocal}
                                        onChange={(e) => setForm((s) => ({ ...s, emailLocal: e.target.value }))}
                                        className="w-full max-w-[212px]"
                                    />
                                    <span className="text-[14px] text-[#222222]">@</span>
                                    <FormInput
                                        value={form.emailDomain}
                                        onChange={(e) => setForm((s) => ({ ...s, emailDomain: e.target.value }))}
                                        disabled={form.emailDomainSelect !== "직접입력"}
                                        className="w-full max-w-[212px]"
                                    />
                                    <FormSelect
                                        value={form.emailDomainSelect}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setForm((s) => ({
                                                ...s,
                                                emailDomainSelect: v,
                                                emailDomain: v === "직접입력" ? s.emailDomain : v,
                                            }));
                                        }}
                                        options={EMAIL_DOMAINS}
                                        className="w-full max-w-[140px]"
                                    />
                                </div>
                            </FormRow>

                            {/* 주소 */}
                            <FormRow label="주소" required>
                                <div className="flex flex-col gap-2 w-full max-w-[600px]">
                                    <div className="flex gap-2 flex-wrap">
                                        <ReadOnlyInput
                                            value={form.postalCode}
                                            placeholder="우편번호"
                                            className="w-full max-w-[260px]"
                                        />
                                        <button
                                            type="button"
                                            className="w-full max-w-[140px] p-4 bg-[#0072DD] rounded-[4px] text-white text-[14px] font-medium hover:bg-[#0061bb]"
                                            onClick={() => {
                                                // 우편번호 검색 연동 자리 — 임시 수동 입력 fallback (비파괴적)
                                                const z = prompt("우편번호를 입력해주세요");
                                                if (z == null) return;
                                                const a = prompt("기본주소를 입력해주세요");
                                                setForm((s) => ({
                                                    ...s,
                                                    postalCode: z,
                                                    address1: a ?? s.address1,
                                                }));
                                            }}
                                        >
                                            우편번호 찾기
                                        </button>
                                    </div>
                                    <ReadOnlyInput
                                        value={form.address1}
                                        placeholder="기본주소 (우편번호 검색 시 자동 입력)"
                                        className="w-full max-w-[600px]"
                                    />
                                    <FormInput
                                        value={form.address2}
                                        onChange={(e) => setForm((s) => ({ ...s, address2: e.target.value }))}
                                        placeholder="상세주소를 입력해주세요"
                                        className="w-full max-w-[600px]"
                                    />
                                </div>
                            </FormRow>

                            {/* 기본 배송지 저장 — 라디오 pill (isDefault 매핑) */}
                            <FormRow label="기본 배송지 저장" required>
                                <div className="flex items-center gap-6 pt-3 flex-wrap">
                                    <PillRadio
                                        checked={form.isDefault}
                                        onChange={() => setForm((s) => ({ ...s, isDefault: true }))}
                                        label="저장함"
                                    />
                                    <PillRadio
                                        checked={!form.isDefault}
                                        onChange={() => setForm((s) => ({ ...s, isDefault: false }))}
                                        label="저장안함"
                                    />
                                </div>
                            </FormRow>
                        </div>
                    </section>

                    {/* ===== 하단 액션 ===== */}
                    <div className="flex justify-center items-center gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={() => {
                                if (editingId) cancel();
                                else router.push("/mypage");
                            }}
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
                </form>
            </main>
        </div>
    );
}

/* ============================================================
 * 폼 보조 컴포넌트 — Figma 시안: 라벨 좌측 고정폭(120) + 필드 우측
 * (회원정보 수정 페이지와 동일 디자인 시스템)
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
                <span className="text-[14px] font-medium text-[#000000]">{label}</span>
                {required && (
                    <span className="text-[14px] font-medium text-[#0072DD]">*</span>
                )}
            </div>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

const INPUT_BASE = "block p-4 rounded-[4px] text-[14px] outline-none";

function FormInput({
    className = "",
    ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...rest}
            className={`${INPUT_BASE} border border-[#E5E5EC] text-[#222222] placeholder:text-[#767676] focus:border-[#222222] disabled:bg-[#F7F7FB] disabled:border-[#BEBEBE] disabled:text-[#767676] ${className}`}
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
                {checked && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </span>
            <input type="radio" checked={checked} onChange={onChange} className="hidden" />
            <span className="text-[14px] font-medium text-[#505050]">{label}</span>
        </label>
    );
}
