"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { SortKey } from "@/types/api";

/**
 * 전체상품 정렬 드롭다운 — 시안 450:5993 ("최신순 ↕").
 * native select 대신 커스텀 메뉴(스타일 일치). 변경 시 series 유지하고 sort 만 바꿔 이동.
 */
const SORTS: { key: SortKey; label: string }[] = [
    { key: "popular", label: "인기순" },
    { key: "newest", label: "최신순" },
    { key: "price_asc", label: "가격 낮은순" },
    { key: "price_desc", label: "가격 높은순" },
    { key: "rating", label: "평점순" },
    { key: "reviews", label: "후기많은순" },
];

export function SortSelect({ series, sort }: { series: string; sort: SortKey }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = SORTS.find((s) => s.key === sort) ?? SORTS[0];

    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    function pick(key: SortKey) {
        setOpen(false);
        if (key === sort) return;
        const u = new URLSearchParams();
        u.set("series", series);
        u.set("sort", key);
        router.push(`/products?${u.toString()}`);
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 text-[14px] text-[#767676] hover:text-[#222] transition"
            >
                <span>{current.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 21V3M3.5 6.5 7 3l3.5 3.5" /><path d="M17 3v18M20.5 17.5 17 21l-3.5-3.5" />
                </svg>
            </button>

            {open && (
                <ul
                    role="listbox"
                    className="absolute right-0 top-full z-30 mt-2 w-[136px] overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                >
                    {SORTS.map((s) => {
                        const active = s.key === sort;
                        return (
                            <li key={s.key} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    onClick={() => pick(s.key)}
                                    className={`block w-full px-4 py-2 text-left text-[14px] transition ${
                                        active
                                            ? "font-medium text-[#0072DD] bg-[var(--color-bg-subtle)]"
                                            : "text-[#555] hover:bg-[var(--color-bg-subtle)] hover:text-[#222]"
                                    }`}
                                >
                                    {s.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
