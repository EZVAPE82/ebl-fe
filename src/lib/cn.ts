/**
 * 클래스 이름 머지 헬퍼.
 * 조건부 / undefined 안전하게 연결.
 *
 * 예) cn("base", isActive && "active", disabled && "opacity-50")
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}
