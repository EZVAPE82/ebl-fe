"use client";

import { Header } from "./Header";
import { PromoStrip } from "./PromoStrip";

/**
 * 헤더 스택 — PromoStrip + Header 묶음
 * sticky 솔리드. 모든 페이지에서 동일한 패턴 (flow 공간 차지 → 콘텐츠 자연스럽게 헤더 아래에서 시작).
 * 이전엔 홈에서 fixed 투명 overlay 였으나, 배너와의 시각 분리를 위해 sticky 솔리드 통일.
 */
export function HeaderStack() {
    return (
        <div className="sticky top-0 left-0 right-0 z-40">
            <PromoStrip />
            <Header />
        </div>
    );
}
