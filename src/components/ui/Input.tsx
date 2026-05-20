/**
 * Input — 공통 입력 컴포넌트.
 *
 * - label / helperText / error 지원
 * - error 있을 때 ring·border 컬러 변경
 * - 외부에서 모든 기본 input 속성 전달 가능
 */
"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: ReactNode;
    helperText?: ReactNode;
    error?: string | null;
    leftAddon?: ReactNode;
    rightAddon?: ReactNode;
}

const base =
    "block w-full bg-[var(--color-surface)] text-[var(--color-fg)] " +
    "border rounded-[var(--radius-md)] px-3 py-2.5 text-sm " +
    "placeholder:text-[var(--color-fg-subtle)] " +
    "focus:outline-none focus:ring-2 focus:ring-offset-0 transition " +
    "disabled:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { label, helperText, error, leftAddon, rightAddon, className, id, ...rest },
    ref
) {
    const auto = useId();
    const inputId = id ?? auto;
    const errorId = error ? `${inputId}-err` : undefined;
    const helperId = helperText ? `${inputId}-help` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

    const borderColor = error
        ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
        : "border-[var(--color-border)] focus:ring-[var(--color-ring)] focus:border-[var(--color-ring)]";

    return (
        <div className="block">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {leftAddon && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-fg-subtle)] text-sm">
                        {leftAddon}
                    </span>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    aria-invalid={!!error}
                    aria-describedby={describedBy}
                    className={cn(
                        base,
                        borderColor,
                        leftAddon && "pl-9",
                        rightAddon && "pr-9",
                        className
                    )}
                    {...rest}
                />
                {rightAddon && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-fg-subtle)] text-sm">
                        {rightAddon}
                    </span>
                )}
            </div>
            {error ? (
                <p id={errorId} className="mt-1 text-xs text-[var(--color-danger)]">
                    {error}
                </p>
            ) : helperText ? (
                <p id={helperId} className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
});
