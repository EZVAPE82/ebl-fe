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
    // Figma 시안: radius 12 (radius-lg), padding 24 (padding 6)
    return (
        <div
            className={cn(
                "rounded-[var(--radius-lg)] border",
                tones[tone],
                padding && "p-6",
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
    // Figma Title 5 (16 Medium, line 24)
    return (
        <h2 className={cn("font-medium text-base text-[var(--color-fg)] mb-4", className)}>
            {children}
        </h2>
    );
}
