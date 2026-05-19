"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function MyPageSettings() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [marketingEmail, setMarketingEmail] = useState(false);
    const [marketingSms, setMarketingSms] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login?redirect=/mypage/settings");
        }
    }, [user, authLoading, router]);

    async function saveProfile() {
        try {
            await api("/api/v1/members/me", {
                method: "PUT", auth: true,
                body: JSON.stringify({ marketingEmailAgreed: marketingEmail, marketingSmsAgreed: marketingSms }),
            });
            alert("저장되었습니다.");
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "저장 실패");
        }
    }

    async function changePassword() {
        try {
            await api("/api/v1/members/me/password", {
                method: "POST", auth: true,
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

    if (authLoading || !user) return <div className="mx-auto max-w-md px-4 py-10 text-zinc-500">불러오는 중...</div>;

    return (
        <div className="mx-auto max-w-md px-4 py-8 space-y-6">
            <div>
                <Link href="/mypage" className="text-xs text-zinc-500 hover:text-black">← 마이페이지</Link>
                <h1 className="text-xl md:text-2xl font-bold mt-1">계정 설정</h1>
            </div>

            <Section title="마케팅 수신 동의">
                <Check label="이메일 수신" checked={marketingEmail} onChange={setMarketingEmail} />
                <Check label="SMS 수신" checked={marketingSms} onChange={setMarketingSms} />
                <button onClick={saveProfile} className={btn}>저장</button>
            </Section>

            <Section title="비밀번호 변경">
                <label className="block">
                    <span className="text-xs text-zinc-600">현재 비밀번호</span>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={input} />
                </label>
                <label className="block">
                    <span className="text-xs text-zinc-600">새 비밀번호 (10자 이상, 영문/숫자/특수문자)</span>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={input} />
                </label>
                <button onClick={changePassword} className={btn}>변경</button>
                <p className="text-[10px] text-zinc-400">* 변경 시 모든 기기에서 로그아웃됩니다.</p>
            </Section>

            <Section title="회원 탈퇴" danger>
                <p className="text-xs text-zinc-600">
                    탈퇴 시 개인정보(이름·휴대폰·이메일)는 즉시 익명화됩니다.<br />
                    결제·주문 기록은 전자상거래법에 따라 5년간 익명 보관됩니다.
                </p>
                <button onClick={withdraw} className="w-full rounded-md border border-rose-300 text-rose-600 py-2 text-sm">탈퇴하기</button>
            </Section>
        </div>
    );
}

const input = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";
const btn = "w-full rounded-md bg-zinc-900 text-white py-2 text-sm";

function Section({ title, danger, children }: { title: string; danger?: boolean; children: React.ReactNode }) {
    return (
        <section className={`rounded-md border p-4 space-y-3 ${danger ? "border-rose-200 bg-rose-50/40" : "border-zinc-200"}`}>
            <h2 className="font-semibold text-sm">{title}</h2>
            {children}
        </section>
    );
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span>{label}</span>
        </label>
    );
}
