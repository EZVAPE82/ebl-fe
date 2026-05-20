/**
 * UI 컴포넌트 배럴.
 *
 *   import { Button, Input, Card, Badge, Checkbox } from "@/components/ui";
 *
 * 디자이너 시안 들어오면:
 *   1) globals.css의 :root 토큰 컬러를 교체
 *   2) 필요 시 각 컴포넌트의 base/variant className만 수정
 *   3) 페이지는 그대로 — 33개 화면 일괄 반영
 */
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

export { Input } from "./Input";
export type { InputProps } from "./Input";

export { Card, CardTitle } from "./Card";
export type { CardProps } from "./Card";

export { Badge } from "./Badge";
export type { BadgeProps } from "./Badge";

export { Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";
