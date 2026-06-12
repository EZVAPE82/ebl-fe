"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/recentlyViewed";

/**
 * 상품 상세에서 마운트 시 "최근 본 상품"에 현재 상품을 기록.
 * 렌더 출력 없음(부수효과 전용). 서버 컴포넌트(상세 페이지)에서 props 로 받아 박는다.
 */
export function RecordRecentView({
    id,
    name,
    href,
    thumb,
}: {
    id: number;
    name: string;
    href: string;
    thumb: string | null;
}) {
    useEffect(() => {
        pushRecentlyViewed({ id, name, href, thumb });
    }, [id, name, href, thumb]);
    return null;
}
