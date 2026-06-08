"use client";

import type { ReactNode } from "react";
import { useGated, GateOverlay } from "@/components/AdultGate";

/**
 * 섹션/이미지 영역 단위 성인인증 게이팅 래퍼.
 * 비회원(미로그인)일 때 감싼 영역 전체에 블러+자물쇠 오버레이를 얹고, 클릭 시 게이트 모달을 연다.
 * 상품 이미지가 보이는 배너·이벤트·순위·시리즈·인스타 등 모든 영역에 사용한다.
 *
 * 주의: 감싼 영역이 자체 position(relative/absolute)을 가지면 wrapperClassName 으로 조정.
 * 기본은 relative + 둥근 모서리 상속(overflow 처리는 호출부 또는 rounded 로).
 */
export function GatedMedia({
    children,
    className = "",
    compact = false,
}: {
    children: ReactNode;
    className?: string;
    /** 작은 영역(아이콘/썸네일)일 때 라벨 숨김 */
    compact?: boolean;
}) {
    const gated = useGated();
    return (
        <div className={`relative ${className}`}>
            {children}
            {gated && <GateOverlay compact={compact} />}
        </div>
    );
}
