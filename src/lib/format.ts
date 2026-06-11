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

/**
 * 상품 상세 URL — flavor 상품은 /products/{series}/{n}(정식·SEO), 슬러그 없거나 그 외 패턴은 /p/{id}(호환).
 * 예: slug "duke-flavor-19" → /products/duke/19
 */
export function productHref(p: { id: number; slug?: string | null }): string {
    const m = (p.slug ?? "").match(/^(.+)-flavor-(\d+)$/);
    return m ? `/products/${m[1]}/${m[2]}` : `/p/${p.id}`;
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}
