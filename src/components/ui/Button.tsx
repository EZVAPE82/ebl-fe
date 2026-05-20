/**
 * Button — 공통 버튼 컴포넌트.
 *
 * variant:
 *   primary  : 브랜드 컬러 채움 (제출·결제·확정)
 *   secondary: 보더만 (취소·뒤로)
 *   danger   : 위험 액션 (삭제·탈퇴)
 *   ghost    : 배경/보더 없음 (텍스트 버튼)
 *
 * size:
 *   sm | md(default) | lg
 *
 * loading=true 일 때 비활성 + 텍스트 대신 인디케이터.
 *
 * 디자이너 시안이 들어오면 이 파일의 className만 교체하면 됨.
 */
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const base =
    "inline-flex items-center justify-center gap-1.5 font-medium transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 " +
    "focus-visible:ring-[var(--color-ring)] disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
    primary:
        "bg-[var(--color-brand)] text-[var(--color-brand-fg)] " +
        "hover:bg-[var(--color-brand-hover)]",
    secondary:
        "bg-[var(--color-surface)] text-[var(--color-fg)] " +
        "border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]",
    danger:
        "bg-[var(--color-danger)] text-white hover:opacity-90",
    ghost:
        "bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-bg-muted)]",
};

const sizes: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5 rounded-[var(--radius-md)]",
    md: "text-sm px-4 py-2.5 rounded-[var(--radius-md)]",
    lg: "text-base px-5 py-3 rounded-[var(--radius-lg)]",
};

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = "button",
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={cn(
                base,
                variants[variant],
                sizes[size],
                fullWidth && "w-full",
                className
            )}
            {...rest}
        >
            {loading ? (
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            ) : (
                <>
                    {leftIcon}
                    {children}
                    {rightIcon}
                </>
            )}
        </button>
    );
}
