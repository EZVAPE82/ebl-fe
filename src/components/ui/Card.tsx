/**
 * Card — 섹션 컨테이너.
 *
 * tone:
 *   default : 기본 카드
 *   subtle  : 배경 약간 톤다운
 *   danger  : 위험 영역 (탈퇴 등)
 *
 * `padding=false` 면 패딩 제거 (이미지·테이블 등을 꽉 채울 때).
 */
"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "default" | "subtle" | "danger";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    tone?: Tone;
    padding?: boolean;
}

const tones: Record<Tone, string> = {
    default: "bg-[var(--color-surface)] border-[var(--color-border)]",
    subtle:  "bg-[var(--color-bg-subtle)] border-[var(--color-border)]",
    danger:  "bg-[var(--color-danger-bg)] border-[var(--color-danger)]/30",
};

export function Card({
    tone = "default",
    padding = true,
    className,
    children,
    ...rest
}: CardProps) {
    return (
        <div
            className={cn(
                "rounded-[var(--radius-lg)] border",
                tones[tone],
                padding && "p-4",
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <h2 className={cn("font-semibold text-sm text-[var(--color-fg)] mb-3", className)}>
            {children}
        </h2>
    );
}
