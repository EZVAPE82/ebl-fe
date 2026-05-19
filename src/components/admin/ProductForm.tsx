"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin";
import { ApiError } from "@/lib/api";

type OptionInput = {
    optionGroup: string; optionValue: string;
    priceDelta: number; stock: number; required: boolean;
    sortOrder: number; visible: boolean;
};
type ImageInput = { url: string; type: "THUMBNAIL" | "DETAIL"; sortOrder: number };

export type ProductInitial = {
    id?: number;
    categoryId?: number | null;
    brandId?: number | null;
    name: string;
    slug: string;
    description: string;
    compatibilityInfo: string;
    price: number;
    status: "DRAFT" | "ACTIVE" | "SOLD_OUT" | "DISCONTINUED";
    thumbnailUrl: string;
    stockThreshold: number;
    options: OptionInput[];
    images: ImageInput[];
};

const EMPTY: ProductInitial = {
    name: "", slug: "", description: "", compatibilityInfo: "",
    price: 0, status: "DRAFT", thumbnailUrl: "", stockThreshold: 0,
    options: [], images: [],
};

export function ProductForm({ initial = EMPTY, mode }: { initial?: ProductInitial; mode: "create" | "edit" }) {
    const router = useRouter();
    const [f, setF] = useState<ProductInitial>(initial);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const payload = {
                categoryId: f.categoryId,
                brandId: f.brandId,
                name: f.name, slug: f.slug,
                description: f.description, compatibilityInfo: f.compatibilityInfo,
                price: f.price,
                status: f.status,
                thumbnailUrl: f.thumbnailUrl,
                stockThreshold: f.stockThreshold,
                options: f.options,
                images: f.images,
            };
            if (mode === "create") {
                const res = await adminApi<{ id: number }>("/api/v1/admin/products", {
                    method: "POST", body: JSON.stringify(payload),
                });
                router.replace(`/admin/products/${res.id}`);
            } else {
                await adminApi(`/api/v1/admin/products/${initial.id}`, {
                    method: "PUT", body: JSON.stringify(payload),
                });
                alert("저장되었습니다.");
            }
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "저장에 실패했습니다.");
        } finally { setSubmitting(false); }
    }

    async function remove() {
        if (!initial.id || !confirm("정말 삭제하시겠습니까?")) return;
        try {
            await adminApi(`/api/v1/admin/products/${initial.id}`, { method: "DELETE" });
            router.replace("/admin/products");
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "삭제 실패");
        }
    }

    function up<K extends keyof ProductInitial>(k: K, v: ProductInitial[K]) {
        setF(s => ({ ...s, [k]: v }));
    }

    function addOption() {
        setF(s => ({ ...s, options: [...s.options, { optionGroup: "", optionValue: "", priceDelta: 0, stock: 0, required: true, sortOrder: s.options.length, visible: true }] }));
    }
    function updOption(i: number, patch: Partial<OptionInput>) {
        setF(s => ({ ...s, options: s.options.map((o, idx) => idx === i ? { ...o, ...patch } : o) }));
    }
    function rmOption(i: number) {
        setF(s => ({ ...s, options: s.options.filter((_, idx) => idx !== i) }));
    }

    function addImage() {
        setF(s => ({ ...s, images: [...s.images, { url: "", type: "DETAIL", sortOrder: s.images.length }] }));
    }
    function updImage(i: number, patch: Partial<ImageInput>) {
        setF(s => ({ ...s, images: s.images.map((o, idx) => idx === i ? { ...o, ...patch } : o) }));
    }
    function rmImage(i: number) {
        setF(s => ({ ...s, images: s.images.filter((_, idx) => idx !== i) }));
    }

    return (
        <form onSubmit={onSubmit} className="space-y-5 max-w-3xl">
            <Section title="기본">
                <Grid2>
                    <F label="이름"><input required value={f.name} onChange={e => up("name", e.target.value)} className={ic} /></F>
                    <F label="슬러그"><input required value={f.slug} onChange={e => up("slug", e.target.value)} className={ic} /></F>
                    <F label="카테고리 ID"><input type="number" value={f.categoryId ?? ""} onChange={e => up("categoryId", e.target.value ? Number(e.target.value) : null)} className={ic} /></F>
                    <F label="브랜드 ID"><input type="number" value={f.brandId ?? ""} onChange={e => up("brandId", e.target.value ? Number(e.target.value) : null)} className={ic} /></F>
                    <F label="가격"><input type="number" required value={f.price} onChange={e => up("price", Number(e.target.value))} className={ic} /></F>
                    <F label="재고 임계치"><input type="number" value={f.stockThreshold} onChange={e => up("stockThreshold", Number(e.target.value))} className={ic} /></F>
                    <F label="상태">
                        <select value={f.status} onChange={e => up("status", e.target.value as ProductInitial["status"])} className={ic}>
                            <option value="DRAFT">DRAFT</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="SOLD_OUT">SOLD_OUT</option>
                            <option value="DISCONTINUED">DISCONTINUED</option>
                        </select>
                    </F>
                    <F label="썸네일 URL"><input value={f.thumbnailUrl} onChange={e => up("thumbnailUrl", e.target.value)} className={ic} /></F>
                </Grid2>
                <F label="설명"><textarea rows={4} value={f.description} onChange={e => up("description", e.target.value)} className={ic} /></F>
                <F label="호환 정보"><textarea rows={2} value={f.compatibilityInfo} onChange={e => up("compatibilityInfo", e.target.value)} className={ic} /></F>
            </Section>

            <Section title="옵션" right={<button type="button" onClick={addOption} className="text-xs rounded border border-zinc-300 px-2 py-1">+ 옵션 추가</button>}>
                {f.options.length === 0 ? <p className="text-xs text-zinc-500">옵션 없음</p> : (
                    <div className="space-y-2">
                        {f.options.map((o, i) => (
                            <div key={i} className="grid grid-cols-12 gap-1 items-center text-sm">
                                <input placeholder="그룹" value={o.optionGroup} onChange={e => updOption(i, { optionGroup: e.target.value })} className={`${ic} col-span-2`} />
                                <input placeholder="값" value={o.optionValue} onChange={e => updOption(i, { optionValue: e.target.value })} className={`${ic} col-span-3`} />
                                <input type="number" placeholder="+" value={o.priceDelta} onChange={e => updOption(i, { priceDelta: Number(e.target.value) })} className={`${ic} col-span-2`} />
                                <input type="number" placeholder="재고" value={o.stock} onChange={e => updOption(i, { stock: Number(e.target.value) })} className={`${ic} col-span-2`} />
                                <label className="col-span-2 text-xs flex items-center gap-1">
                                    <input type="checkbox" checked={o.required} onChange={e => updOption(i, { required: e.target.checked })} /> 필수
                                </label>
                                <button type="button" onClick={() => rmOption(i)} className="col-span-1 text-rose-500 text-xs">삭제</button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            <Section title="이미지" right={<button type="button" onClick={addImage} className="text-xs rounded border border-zinc-300 px-2 py-1">+ 이미지 추가</button>}>
                {f.images.length === 0 ? <p className="text-xs text-zinc-500">이미지 없음</p> : (
                    <div className="space-y-2">
                        {f.images.map((im, i) => (
                            <div key={i} className="grid grid-cols-12 gap-1 items-center text-sm">
                                <input placeholder="URL" value={im.url} onChange={e => updImage(i, { url: e.target.value })} className={`${ic} col-span-8`} />
                                <select value={im.type} onChange={e => updImage(i, { type: e.target.value as ImageInput["type"] })} className={`${ic} col-span-2`}>
                                    <option value="THUMBNAIL">THUMBNAIL</option>
                                    <option value="DETAIL">DETAIL</option>
                                </select>
                                <input type="number" value={im.sortOrder} onChange={e => updImage(i, { sortOrder: Number(e.target.value) })} className={`${ic} col-span-1`} />
                                <button type="button" onClick={() => rmImage(i)} className="col-span-1 text-rose-500 text-xs">삭제</button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="rounded-md bg-zinc-900 text-white px-4 py-2 text-sm disabled:opacity-50">
                    {submitting ? "저장 중..." : mode === "create" ? "등록" : "저장"}
                </button>
                {mode === "edit" && (
                    <button type="button" onClick={remove} className="rounded-md border border-rose-300 text-rose-600 px-4 py-2 text-sm">삭제</button>
                )}
            </div>
        </form>
    );
}

const ic = "w-full rounded border border-zinc-300 px-2 py-1.5 text-sm bg-white";

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="bg-white rounded-md border border-zinc-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{title}</h2>
                {right}
            </div>
            {children}
        </section>
    );
}
function Grid2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block"><span className="text-xs text-zinc-600">{label}</span>{children}</label>;
}
