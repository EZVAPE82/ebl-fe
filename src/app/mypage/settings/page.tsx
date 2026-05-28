"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { validatePassword } from "@/lib/validation";
import { Button, Checkbox, Input } from "@/components/ui";
import { MyPageSideNav } from "@/components/mypage/SideNav";

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
        const err = validatePassword(newPassword);
        if (err) { alert(err); return; }
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

    if (authLoading || !user) {
        return <div className="mx-auto max-w-screen-2xl px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 grid gap-8 md:grid-cols-[220px_1fr]">
            <MyPageSideNav />

            <main className="max-w-2xl space-y-10">
                {/* 헤더 */}
                <header className="flex items-end justify-between pb-3 border-b border-[var(--color-fg)]">
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-fg)]">회원정보 수정</h2>
                    <span className="text-xs text-[var(--color-accent)]">*필수입력사항</span>
                </header>

                {/* 회원정보 폼 */}
                <section>
                    <h3 className="text-base md:text-lg font-semibold mb-4 text-[var(--color-fg)]">회원정보</h3>
                    <div className="space-y-3">
                        <ReadOnlyField label="아이디*" value={user.email} />
                        <ReadOnlyField label="이름*" value={user.name} />
                        <Input
                            type="password"
                            label="비밀번호*"
                            placeholder="현재 비밀번호"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                        />
                        <Input
                            type="password"
                            label="신규 비밀번호*"
                            placeholder="새 비밀번호 (10자 이상, 영문·숫자·특수문자)"
                            helperText="10자 이상, 영문·숫자·특수문자 포함"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                        <ReadOnlyField label="휴대전화*" value={user.phone || "—"} />
                        <Input
                            label="이메일*"
                            value={user.email}
                            readOnly
                            disabled
                        />
                    </div>

                    <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-[var(--color-fg-muted)] mb-1">마케팅 및 광고 활용 동의 *</p>
                        <div className="flex gap-4">
                            <Checkbox
                                label="이메일 수신"
                                checked={marketingEmail}
                                onChange={e => setMarketingEmail(e.target.checked)}
                            />
                            <Checkbox
                                label="SMS 수신"
                                checked={marketingSms}
                                onChange={e => setMarketingSms(e.target.checked)}
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row md:justify-between gap-2">
                        <Button
                            onClick={withdraw}
                            variant="secondary"
                            className="!border-[var(--color-danger)] !text-[var(--color-danger)] hover:!bg-[var(--color-danger-bg)] md:w-32"
                        >
                            회원탈퇴
                        </Button>
                        <div className="flex gap-2">
                            <Button onClick={() => router.replace("/mypage")} variant="secondary" className="md:w-32">취소</Button>
                            <Button
                                onClick={async () => {
                                    if (currentPassword && newPassword) {
                                        await changePassword();
                                    } else {
                                        await saveProfile();
                                    }
                                }}
                                className="md:w-32"
                            >
                                확인
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <label className="block">
            <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1">{label}</span>
            <div className="block w-full bg-[var(--color-bg-subtle)] text-[var(--color-fg)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3.5 text-sm">
                {value}
            </div>
        </label>
    );
}
