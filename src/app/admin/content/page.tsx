"use client";

import { useState } from "react";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";

type Tab = "notice" | "faq" | "event" | "banner" | "popup";

export default function AdminContentPage() {
    const [tab, setTab] = useState<Tab>("notice");

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">콘텐츠 관리</h1>

            <div className="border-b border-[var(--color-border)] mb-4 flex gap-1 text-sm">
                {(["notice", "faq", "event", "banner", "popup"] as Tab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-2 border-b-2 ${tab === t ? "border-[var(--color-fg)] font-semibold" : "border-transparent text-[var(--color-fg-muted)]"}`}
                    >{LABEL[t]}</button>
                ))}
            </div>

            {tab === "notice" && <NoticeForm />}
            {tab === "faq" && <FaqForm />}
            {tab === "event" && <EventForm />}
            {tab === "banner" && <BannerForm />}
            {tab === "popup" && <PopupForm />}
        </div>
    );
}

const LABEL: Record<Tab, string> = {
    notice: "공지", faq: "FAQ", event: "이벤트", banner: "배너", popup: "팝업",
};

function NoticeForm() {
    const [f, setF] = useState({ title: "", content: "", pinned: false, visible: true });
    return (
        <SimpleForm
            fields={f}
            update={(k, v) => setF(s => ({ ...s, [k]: v }))}
            schema={{
                title: { type: "text", label: "제목", required: true },
                content: { type: "textarea", label: "내용", required: true, rows: 8 },
                pinned: { type: "checkbox", label: "필독 고정" },
                visible: { type: "checkbox", label: "노출" },
            }}
            onSubmit={async () => {
                await adminApi("/api/v1/admin/content/notices", { method: "POST", body: JSON.stringify(f) });
                alert("등록되었습니다.");
                setF({ title: "", content: "", pinned: false, visible: true });
            }}
        />
    );
}

function FaqForm() {
    const [f, setF] = useState({ category: "", question: "", answer: "", sortOrder: 0, visible: true });
    return (
        <SimpleForm
            fields={f}
            update={(k, v) => setF(s => ({ ...s, [k]: v }))}
            schema={{
                category: { type: "text", label: "카테고리" },
                question: { type: "text", label: "질문", required: true },
                answer: { type: "textarea", label: "답변", required: true, rows: 6 },
                sortOrder: { type: "number", label: "정렬" },
                visible: { type: "checkbox", label: "노출" },
            }}
            onSubmit={async () => {
                await adminApi("/api/v1/admin/content/faqs", { method: "POST", body: JSON.stringify(f) });
                alert("등록되었습니다.");
                setF({ category: "", question: "", answer: "", sortOrder: 0, visible: true });
            }}
        />
    );
}

function EventForm() {
    const [f, setF] = useState({ title: "", summary: "", content: "", bannerUrl: "", startsAt: "", endsAt: "", visible: true });
    return (
        <SimpleForm
            fields={f}
            update={(k, v) => setF(s => ({ ...s, [k]: v }))}
            schema={{
                title: { type: "text", label: "제목", required: true },
                summary: { type: "text", label: "요약" },
                content: { type: "textarea", label: "내용", rows: 6 },
                bannerUrl: { type: "text", label: "배너 URL" },
                startsAt: { type: "datetime", label: "시작" },
                endsAt: { type: "datetime", label: "종료" },
                visible: { type: "checkbox", label: "노출" },
            }}
            onSubmit={async () => {
                const payload = { ...f, startsAt: f.startsAt || null, endsAt: f.endsAt || null };
                await adminApi("/api/v1/admin/content/events", { method: "POST", body: JSON.stringify(payload) });
                alert("등록되었습니다.");
                setF({ title: "", summary: "", content: "", bannerUrl: "", startsAt: "", endsAt: "", visible: true });
            }}
        />
    );
}

function BannerForm() {
    const [f, setF] = useState({ placement: "MAIN_HERO", imageUrl: "", linkUrl: "", altText: "", sortOrder: 0, visible: true, startsAt: "", endsAt: "" });
    return (
        <SimpleForm
            fields={f}
            update={(k, v) => setF(s => ({ ...s, [k]: v }))}
            schema={{
                placement: { type: "select", label: "위치", options: ["MAIN_HERO", "TOP_STRIP", "SECTION"] },
                imageUrl: { type: "text", label: "이미지 URL", required: true },
                linkUrl: { type: "text", label: "링크 URL" },
                altText: { type: "text", label: "대체 텍스트" },
                sortOrder: { type: "number", label: "정렬" },
                visible: { type: "checkbox", label: "노출" },
                startsAt: { type: "datetime", label: "시작" },
                endsAt: { type: "datetime", label: "종료" },
            }}
            onSubmit={async () => {
                const payload = { ...f, startsAt: f.startsAt || null, endsAt: f.endsAt || null };
                await adminApi("/api/v1/admin/content/banners", { method: "POST", body: JSON.stringify(payload) });
                alert("등록되었습니다.");
            }}
        />
    );
}

function PopupForm() {
    const [f, setF] = useState({ title: "", imageUrl: "", linkUrl: "", contentHtml: "", sortOrder: 0, visible: true, startsAt: "", endsAt: "" });
    return (
        <SimpleForm
            fields={f}
            update={(k, v) => setF(s => ({ ...s, [k]: v }))}
            schema={{
                title: { type: "text", label: "제목", required: true },
                imageUrl: { type: "text", label: "이미지 URL" },
                linkUrl: { type: "text", label: "링크 URL" },
                contentHtml: { type: "textarea", label: "HTML 내용", rows: 4 },
                sortOrder: { type: "number", label: "정렬" },
                visible: { type: "checkbox", label: "노출" },
                startsAt: { type: "datetime", label: "시작" },
                endsAt: { type: "datetime", label: "종료" },
            }}
            onSubmit={async () => {
                const payload = { ...f, startsAt: f.startsAt || null, endsAt: f.endsAt || null };
                await adminApi("/api/v1/admin/content/popups", { method: "POST", body: JSON.stringify(payload) });
                alert("등록되었습니다.");
            }}
        />
    );
}

type Field =
    | { type: "text" | "textarea" | "number" | "datetime"; label: string; required?: boolean; rows?: number }
    | { type: "checkbox"; label: string }
    | { type: "select"; label: string; options: string[] };

function SimpleForm<T extends Record<string, unknown>>({
    fields, update, schema, onSubmit,
}: {
    fields: T;
    update: <K extends keyof T>(k: K, v: T[K]) => void;
    schema: Record<keyof T, Field>;
    onSubmit: () => Promise<void>;
}) {
    const [submitting, setSubmitting] = useState(false);
    return (
        <form
            onSubmit={async e => {
                e.preventDefault();
                setSubmitting(true);
                try { await onSubmit(); } catch (e) { alert(e instanceof ApiError ? e.message : "저장 실패"); }
                setSubmitting(false);
            }}
            className="max-w-2xl space-y-3 bg-white rounded-md border border-[var(--color-border)] p-4"
        >
            {(Object.entries(schema) as [keyof T, Field][]).map(([key, f]) => (
                <label key={String(key)} className="block">
                    <span className="text-xs text-[var(--color-fg-muted)]">{f.label}</span>
                    {f.type === "text" && (
                        <input
                            type="text"
                            required={"required" in f && f.required}
                            value={(fields[key] as string) ?? ""}
                            onChange={e => update(key, e.target.value as T[keyof T])}
                            className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm"
                        />
                    )}
                    {f.type === "textarea" && (
                        <textarea
                            required={"required" in f && f.required}
                            rows={"rows" in f ? f.rows : 4}
                            value={(fields[key] as string) ?? ""}
                            onChange={e => update(key, e.target.value as T[keyof T])}
                            className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm"
                        />
                    )}
                    {f.type === "number" && (
                        <input
                            type="number"
                            value={(fields[key] as number) ?? 0}
                            onChange={e => update(key, Number(e.target.value) as T[keyof T])}
                            className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm"
                        />
                    )}
                    {f.type === "datetime" && (
                        <input
                            type="datetime-local"
                            value={(fields[key] as string) ?? ""}
                            onChange={e => update(key, e.target.value as T[keyof T])}
                            className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm"
                        />
                    )}
                    {f.type === "select" && (
                        <select
                            value={(fields[key] as string) ?? ""}
                            onChange={e => update(key, e.target.value as T[keyof T])}
                            className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm"
                        >
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    )}
                    {f.type === "checkbox" && (
                        <div className="mt-1">
                            <input
                                type="checkbox"
                                checked={Boolean(fields[key])}
                                onChange={e => update(key, e.target.checked as T[keyof T])}
                            />
                        </div>
                    )}
                </label>
            ))}
            <button type="submit" disabled={submitting} className="rounded-md bg-[var(--color-brand)] text-white px-4 py-2 text-sm disabled:opacity-50">
                {submitting ? "저장 중..." : "등록"}
            </button>
        </form>
    );
}
