/**
 * 최근 본 상품 — localStorage 기반 (서버 의존 없음).
 *  - 상품 상세 진입 시 pushRecentlyViewed 로 기록(중복 제거 + 최신 우선, 최대 MAX).
 *  - FloatingDock 의 "최근 본 상품" 이 getRecentlyViewed 로 읽어 노출.
 *  - 같은 탭 갱신 알림용 커스텀 이벤트("ebl:recentlyViewed") + 다른 탭은 'storage' 이벤트.
 */
export type RecentProduct = {
    id: number;
    name: string;
    href: string;
    thumb: string | null;
};

const KEY = "ebl:recentlyViewed";
const MAX = 8;
export const RECENT_EVENT = "ebl:recentlyViewed";

export function getRecentlyViewed(): RecentProduct[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return [];
        const arr: unknown = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr.filter(isValid).slice(0, MAX);
    } catch {
        return [];
    }
}

export function pushRecentlyViewed(p: RecentProduct): void {
    if (typeof window === "undefined" || !p || typeof p.id !== "number") return;
    try {
        const next = [
            { id: p.id, name: p.name, href: p.href, thumb: p.thumb ?? null },
            ...getRecentlyViewed().filter((x) => x.id !== p.id),
        ].slice(0, MAX);
        window.localStorage.setItem(KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(RECENT_EVENT));
    } catch {
        /* 용량 초과 / 스토리지 비활성 — 무시 */
    }
}

function isValid(x: unknown): x is RecentProduct {
    const r = x as RecentProduct;
    return !!r && typeof r.id === "number" && typeof r.name === "string" && typeof r.href === "string";
}
