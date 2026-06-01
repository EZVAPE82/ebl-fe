"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MyPageSideNav } from "@/components/mypage/SideNav";

/**
 * 배송지 관리 — Figma 37:12534.
 *  - 좌측: MyPageSideNav
 *  - 우측: 단일 폼 (필수 표시 + 분할 전화/이메일/주소 + 기본 배송지 라디오)
 *  - 하단: 취소(라이트) + 확인(검정) 버튼 (가운데 정렬)
 *
 * 시안: 입력은 둥근 모서리(md) + 옅은 회색 배경. 우편번호 찾기는 파란색 버튼.
 */

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
const EMAIL_DOMAINS = ["naver.com", "gmail.com", "daum.net", "hanmail.net", "nate.com", "직접입력"];

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
            setForm({ ...empty });
            setEditingId(null);
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : "저장 실패");
        }
    }

    function cancel() {
        setEditingId(null);
        setForm({ ...empty });
    }

    if (authLoading || !user) {
        return (
            <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-10 text-[var(--color-fg-subtle)]">
                불러오는 중...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            <MyPageSideNav />

            <div>
                <header className="flex items-end justify-between pb-3 border-b-2 border-[var(--color-fg)]">
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-fg)]">배송지 관리</h2>
                    <span className="text-xs text-[#3b82f6]">*필수입력사항</span>
                </header>

                <form onSubmit={save} className="mt-8 space-y-5 max-w-2xl">
                    {/* 배송지명 */}
                    <Row label="배송지명" required>
                        <input
                            type="text"
                            placeholder="배송지명을 입력해주세요"
                            value={form.label}
                            onChange={e => setForm(s => ({ ...s, label: e.target.value }))}
                            className={inputCls}
                        />
                    </Row>

                    {/* 이름 */}
                    <Row label="이름" required>
                        <input
                            type="text"
                            placeholder="시그날디코드"
                            value={form.recipientName}
                            onChange={e => setForm(s => ({ ...s, recipientName: e.target.value }))}
                            className={inputCls}
                            required
                        />
                    </Row>

                    {/* 일반전화 */}
                    <Row label="일반전화" required>
                        <div className="grid grid-cols-[1fr_8px_1fr_8px_1fr] items-center gap-0">
                            <select
                                value={form.homePhone1}
                                onChange={e => setForm(s => ({ ...s, homePhone1: e.target.value }))}
                                className={selectCls}
                            >
                                {PHONE_PREFIX_HOME.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <span className="text-center text-[var(--color-fg-muted)]">-</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="123"
                                value={form.homePhone2}
                                onChange={e => setForm(s => ({ ...s, homePhone2: e.target.value.replace(/\D/g, "") }))}
                                className={inputCls}
                            />
                            <span className="text-center text-[var(--color-fg-muted)]">-</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="597"
                                value={form.homePhone3}
                                onChange={e => setForm(s => ({ ...s, homePhone3: e.target.value.replace(/\D/g, "") }))}
                                className={inputCls}
                            />
                        </div>
                    </Row>

                    {/* 휴대전화 */}
                    <Row label="휴대전화" required>
                        <div className="grid grid-cols-[1fr_8px_1fr_8px_1fr] items-center gap-0">
                            <select
                                value={form.mobilePhone1}
                                onChange={e => setForm(s => ({ ...s, mobilePhone1: e.target.value }))}
                                className={selectCls}
                            >
                                {PHONE_PREFIX_MOBILE.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <span className="text-center text-[var(--color-fg-muted)]">-</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="1234"
                                value={form.mobilePhone2}
                                onChange={e => setForm(s => ({ ...s, mobilePhone2: e.target.value.replace(/\D/g, "") }))}
                                className={inputCls}
                                required
                            />
                            <span className="text-center text-[var(--color-fg-muted)]">-</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="5678"
                                value={form.mobilePhone3}
                                onChange={e => setForm(s => ({ ...s, mobilePhone3: e.target.value.replace(/\D/g, "") }))}
                                className={inputCls}
                                required
                            />
                        </div>
                    </Row>

                    {/* 이메일 */}
                    <Row label="이메일" required>
                        <div className="grid grid-cols-[1fr_16px_1fr_1fr] items-center gap-2">
                            <input
                                type="text"
                                placeholder="signaldecode02"
                                value={form.emailLocal}
                                onChange={e => setForm(s => ({ ...s, emailLocal: e.target.value }))}
                                className={inputCls}
                            />
                            <span className="text-center text-[var(--color-fg-muted)]">@</span>
                            <input
                                type="text"
                                placeholder="naver.com"
                                value={form.emailDomain}
                                onChange={e => setForm(s => ({ ...s, emailDomain: e.target.value }))}
                                className={inputCls}
                                disabled={form.emailDomainSelect !== "직접입력"}
                            />
                            <select
                                value={form.emailDomainSelect}
                                onChange={e => {
                                    const v = e.target.value;
                                    setForm(s => ({
                                        ...s,
                                        emailDomainSelect: v,
                                        emailDomain: v === "직접입력" ? s.emailDomain : v,
                                    }));
                                }}
                                className={selectCls}
                            >
                                {EMAIL_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </Row>

                    {/* 주소 */}
                    <Row label="주소" required>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="08533"
                                    value={form.postalCode}
                                    onChange={e => setForm(s => ({ ...s, postalCode: e.target.value }))}
                                    className={`${inputCls} max-w-[160px]`}
                                />
                                <button
                                    type="button"
                                    onClick={() => alert("우편번호 찾기 — 외부 API 연동 예정")}
                                    className="px-4 py-2.5 rounded-md bg-[#3b82f6] text-white text-sm font-medium hover:bg-[#2563eb] whitespace-nowrap"
                                >
                                    우편번호 찾기
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="서울특별시 마포구 잔다리로 44"
                                value={form.address1}
                                onChange={e => setForm(s => ({ ...s, address1: e.target.value }))}
                                className={inputCls}
                            />
                            <input
                                type="text"
                                placeholder="센터빌딩 6층"
                                value={form.address2}
                                onChange={e => setForm(s => ({ ...s, address2: e.target.value }))}
                                className={inputCls}
                            />
                        </div>
                    </Row>

                    {/* 기본 배송지 저장 — 시안: 커스텀 블루 채움 + 흰 도트 radio */}
                    <Row label="기본 배송지 저장" required>
                        <div className="flex items-center gap-6">
                            <DefaultRadio
                                checked={form.isDefault}
                                onChange={() => setForm(s => ({ ...s, isDefault: true }))}
                                label="저장함"
                            />
                            <DefaultRadio
                                checked={!form.isDefault}
                                onChange={() => setForm(s => ({ ...s, isDefault: false }))}
                                label="저장안함"
                            />
                        </div>
                    </Row>

                    {/* 액션 버튼 — 시안: 각진 모서리 (rounded-none) */}
                    <div className="flex justify-center gap-3 pt-6 border-t border-[var(--color-border)]">
                        <button
                            type="button"
                            onClick={cancel}
                            className="px-10 py-3 rounded-none bg-[var(--color-bg-subtle)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-bg-muted)] min-w-[120px]"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-3 rounded-none bg-[var(--color-fg)] text-[var(--color-bg)] text-sm font-medium hover:opacity-90 min-w-[120px]"
                        >
                            확인
                        </button>
                    </div>
                </form>

                {/* 기존 등록 배송지 (참고용) */}
                {list.length > 0 && (
                    <div className="mt-10 max-w-2xl">
                        <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-3">등록된 배송지</h3>
                        <ul className="space-y-2">
                            {list.map(a => (
                                <li key={a.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-[var(--color-fg)]">{a.label || "배송지"}</span>
                                        {a.isDefault && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6] text-white">기본</span>
                                        )}
                                    </div>
                                    <div className="mt-1 text-[var(--color-fg)]">{a.recipientName} · {a.phoneMasked}</div>
                                    <div className="text-[var(--color-fg-muted)]">({a.postalCode}) {a.address1} {a.address2 ?? ""}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ───────── helpers ───────── */

const inputCls =
    "w-full px-3 py-2.5 rounded-md bg-[var(--color-bg-subtle)] border border-transparent text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[#3b82f6] focus:bg-[var(--color-bg)]";

const selectCls =
    "w-full px-3 py-2.5 rounded-md bg-[var(--color-bg-subtle)] border border-transparent text-sm text-[var(--color-fg)] focus:outline-none focus:border-[#3b82f6] focus:bg-[var(--color-bg)] appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22><path fill=%22none%22 stroke=%22%23999%22 stroke-width=%221.2%22 d=%22M1 1l4 4 4-4%22/></svg>')] bg-no-repeat bg-[length:10px_6px] bg-[right_10px_center] pr-8";

function Row({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[100px_1fr] items-start gap-3">
            <label className="text-sm text-[var(--color-fg)] pt-2.5">
                {label}
                {required && <span className="text-[#3b82f6] ml-0.5">*</span>}
            </label>
            <div>{children}</div>
        </div>
    );
}

/* 시안 매칭 커스텀 라디오 — 체크: 블루(#3b82f6) 채움 + 흰 도트 / 미체크: 회색 outline */
function DefaultRadio({
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
                    checked
                        ? "border-[#3b82f6] bg-[#3b82f6]"
                        : "border-[var(--color-border-strong)] bg-white"
                } flex items-center justify-center`}
            >
                {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <input type="radio" checked={checked} onChange={onChange} className="hidden" />
            <span className="text-sm text-[var(--color-fg)]">{label}</span>
        </label>
    );
}
