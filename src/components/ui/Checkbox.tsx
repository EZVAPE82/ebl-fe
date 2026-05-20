/**
 * Checkbox — 라벨 동반 체크박스 (mypage settings, 마케팅 동의 등).
 */
"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    { label, className, ...rest },
    ref
) {
    return (
        <label className={cn("flex items-center gap-2 text-sm cursor-pointer", className)}>
            <input
                ref={ref}
                type="checkbox"
                className="size-4 rounded border-[var(--color-border-strong)] text-[var(--color-brand)] focus:ring-[var(--color-ring)]"
                {...rest}
            />
            {label && <span className="text-[var(--color-fg)]">{label}</span>}
        </label>
    );
});
