/**
 * 비밀번호 정책 — 백엔드와 동일 규칙 유지.
 *  - 10자 이상 100자 이하
 *  - 영문 1자 이상
 *  - 숫자 1자 이상
 *  - 특수문자 1자 이상
 */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,100}$/;

export function validatePassword(pw: string): string | null {
    if (!pw) return "비밀번호를 입력해주세요.";
    if (pw.length < 10) return "비밀번호는 10자 이상이어야 합니다.";
    if (pw.length > 100) return "비밀번호가 너무 깁니다.";
    if (!PASSWORD_REGEX.test(pw)) return "비밀번호는 영문·숫자·특수문자를 각 1자 이상 포함해야 합니다.";
    return null;
}
