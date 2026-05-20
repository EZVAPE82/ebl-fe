/**
 * Badge — 상태 칩.
 *
 * tone: neutral | success | warning | danger | info | brand
 * size: sm | md
 */
"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";
type Size = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: Tone;
    size?: Size;
}

const tones: Record<Tone, string> = {
    neutral: "bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)]",
    success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    danger:  "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
    info:    "bg-[var(--color-info)]/10 text-[var(--color-info)]",
    brand:   "bg-[var(--color-brand)] text-[var(--color-brand-fg)]",
};

// Figma 시안: Caption2(14 Medium) — 카테고리/상태 칩. radius 4 sharp.
const sizes: Record<Size, string> = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
};

export function Badge({
    tone = "neutral",
    size = "sm",
    className,
    children,
    ...rest
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-[var(--radius-sm)] font-medium",
                tones[tone],
                sizes[size],
                className
            )}
            {...rest}
        >
            {children}
        </span>
    );
}
