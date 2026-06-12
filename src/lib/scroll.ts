/**
 * 가로 스크롤 캐러셀 화살표 — 순환(wrap) 스크롤.
 *  - dir +1(다음): 끝에 도달했으면 처음으로, 아니면 한 칸(뷰포트 85%) 우측.
 *  - dir -1(이전): 처음이면 끝으로, 아니면 한 칸 좌측.
 * 스크롤할 내용이 없으면(모두 보임) no-op.
 */
export function wrapScroll(el: HTMLElement | null, dir: 1 | -1): void {
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const step = Math.round(el.clientWidth * 0.85);
    const EPS = 4;
    const cur = el.scrollLeft;
    const next = dir > 0
        ? (cur >= max - EPS ? 0 : Math.min(cur + step, max))   // 끝 → 처음
        : (cur <= EPS ? max : Math.max(cur - step, 0));         // 처음 → 끝
    el.scrollTo({ left: next, behavior: "smooth" });
}
