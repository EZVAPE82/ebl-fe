"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { validatePassword } from "@/lib/validation";
import { Button, Input, Card, CardTitle, Checkbox } from "@/components/ui";

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
        if (err) {
            alert(err);
            return;
        }
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
        return <div className="mx-auto max-w-md px-4 py-10 text-[var(--color-fg-subtle)]">불러오는 중...</div>;
    }

    return (
        <div className="mx-auto max-w-md px-4 py-8 space-y-6">
            <div>
                <Link href="/mypage" className="text-xs text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]">
                    ← 마이페이지
                </Link>
                <h1 className="text-xl md:text-2xl font-bold mt-1">계정 설정</h1>
            </div>

            <Card>
                <CardTitle>마케팅 수신 동의</CardTitle>
                <div className="space-y-2">
                    <Checkbox label="이메일 수신" checked={marketingEmail} onChange={e => setMarketingEmail(e.target.checked)} />
                    <Checkbox label="SMS 수신" checked={marketingSms} onChange={e => setMarketingSms(e.target.checked)} />
                </div>
                <div className="mt-3">
                    <Button onClick={saveProfile} fullWidth>저장</Button>
                </div>
            </Card>

            <Card>
                <CardTitle>비밀번호 변경</CardTitle>
                <div className="space-y-3">
                    <Input
                        type="password"
                        label="현재 비밀번호"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        label="새 비밀번호"
                        helperText="10자 이상, 영문·숫자·특수문자 포함"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                    <Button onClick={changePassword} fullWidth>변경</Button>
                    <p className="text-[10px] text-[var(--color-fg-subtle)]">
                        * 변경 시 모든 기기에서 로그아웃됩니다.
                    </p>
                </div>
            </Card>

            <Card tone="danger">
                <CardTitle>회원 탈퇴</CardTitle>
                <p className="text-xs text-[var(--color-fg-muted)] mb-3">
                    탈퇴 시 개인정보(이름·휴대폰·이메일)는 즉시 익명화됩니다.<br />
                    결제·주문 기록은 전자상거래법에 따라 5년간 익명 보관됩니다.
                </p>
                <Button onClick={withdraw} variant="secondary" fullWidth
                    className="!border-[var(--color-danger)] !text-[var(--color-danger)] hover:!bg-[var(--color-danger-bg)]">
                    탈퇴하기
                </Button>
            </Card>
        </div>
    );
}
