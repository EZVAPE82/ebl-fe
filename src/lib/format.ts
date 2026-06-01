export function formatPrice(n: number): string {
    return n.toLocaleString("ko-KR") + "원";
}

/**
 * 온라인몰 표시 가격 — onlinePrice 있으면 우선, 없으면 기본 price.
 * 어드민에서 두 가격 별도 입력 (V21).
 */
export function displayPrice(p: { price: number; onlinePrice?: number | null }): number {
    return p.onlinePrice != null ? p.onlinePrice : p.price;
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}
