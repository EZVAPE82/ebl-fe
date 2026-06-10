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
    /** 온라인몰 판매가 (선택). NULL/0 이면 기본 price 사용. */
    onlinePrice?: number | null;
    status: "DRAFT" | "ACTIVE" | "SOLD_OUT" | "DISCONTINUED";
    thumbnailUrl: string;
    stockThreshold: number;
    /** 상품 레벨 재고 (옵션 없는 상품용). null/빈값 = 무제한, 숫자 = 재고 추적. */
    stock?: number | null;
    options: OptionInput[];
    images: ImageInput[];
    /** 메인 페이지 추천 순서 (1~N, 캐러셀). 빈값=추천 안 함. */
    featuredOrder?: number | null;
    /** 베스트 직접지정 순서 (1~). 빈값=베스트 아님. best_mode=MANUAL 일 때만 노출. */
    bestOrder?: number | null;
};

const EMPTY: ProductInitial = {
    name: "", slug: "", description: "", compatibilityInfo: "",
    price: 0, onlinePrice: null, status: "DRAFT", thumbnailUrl: "", stockThreshold: 0,
    stock: null, options: [], images: [], featuredOrder: null, bestOrder: null,
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
                onlinePrice: f.onlinePrice && f.onlinePrice > 0 ? f.onlinePrice : null,
                status: f.status,
                thumbnailUrl: f.thumbnailUrl,
                stockThreshold: f.stockThreshold,
                stock: f.stock ?? null,
                options: f.options,
                images: f.images,
            };
            let productId: number;
            if (mode === "create") {
                const res = await adminApi<{ id: number }>("/api/v1/admin/products", {
                    method: "POST", body: JSON.stringify(payload),
                });
                productId = res.id;
            } else {
                await adminApi(`/api/v1/admin/products/${initial.id}`, {
                    method: "PUT", body: JSON.stringify(payload),
                });
                productId = initial.id!;
            }
            // 추천 순서 (featuredOrder) — 별도 PATCH 엔드포인트 (캐러셀, 1~N)
            const order = f.featuredOrder;
            if (order !== initial.featuredOrder) {
                const qs = order && order >= 1 ? `?order=${order}` : "";
                await adminApi(`/api/v1/admin/products/${productId}/featured${qs}`, { method: "PATCH" });
            }
            // 베스트 직접지정 순서 (bestOrder) — 별도 PATCH 엔드포인트
            const best = f.bestOrder;
            if (best !== initial.bestOrder) {
                const bqs = best && best >= 1 ? `?order=${best}` : "";
                await adminApi(`/api/v1/admin/products/${productId}/best${bqs}`, { method: "PATCH" });
            }
            if (mode === "create") router.replace(`/admin/products/${productId}`);
            else alert("저장되었습니다.");
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
                    <F label="기본 판매가 *"><input type="number" required value={f.price} onChange={e => up("price", Number(e.target.value))} className={ic} placeholder="오프라인 매장 등" /></F>
                    <F label="온라인몰 판매가"><input type="number" value={f.onlinePrice ?? ""} onChange={e => up("onlinePrice", e.target.value ? Number(e.target.value) : null)} className={ic} placeholder="비우면 기본가 사용" /></F>
                    <F label="재고 임계치"><input type="number" value={f.stockThreshold} onChange={e => up("stockThreshold", Number(e.target.value))} className={ic} /></F>
                    <F label="재고 (옵션 없을 때)"><input type="number" min={0} value={f.stock ?? ""} onChange={e => up("stock", e.target.value ? Number(e.target.value) : null)} className={ic} placeholder="비우면 무제한" /></F>
                    <F label="추천 순서 (홈 추천 — 캐러셀, 1·2·3…)">
                        <input
                            type="number" min={1}
                            value={f.featuredOrder ?? ""}
                            onChange={e => up("featuredOrder", e.target.value ? Number(e.target.value) : null)}
                            className={ic}
                            placeholder="비우면 추천 안 함"
                        />
                    </F>
                    <F label="베스트 순서 (직접지정 모드)">
                        <input
                            type="number" min={1}
                            value={f.bestOrder ?? ""}
                            onChange={e => up("bestOrder", e.target.value ? Number(e.target.value) : null)}
                            className={ic}
                            placeholder="비우면 베스트 아님"
                        />
                    </F>
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

            <Section title="옵션" right={<button type="button" onClick={addOption} className="text-xs rounded border border-[var(--color-border)] px-2 py-1">+ 옵션 추가</button>}>
                {f.options.length === 0 ? <p className="text-xs text-[var(--color-fg-muted)]">옵션 없음</p> : (
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
                                <button type="button" onClick={() => rmOption(i)} className="col-span-1 text-[var(--color-danger)] text-xs">삭제</button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            <Section title="이미지" right={<button type="button" onClick={addImage} className="text-xs rounded border border-[var(--color-border)] px-2 py-1">+ 이미지 추가</button>}>
                {f.images.length === 0 ? <p className="text-xs text-[var(--color-fg-muted)]">이미지 없음</p> : (
                    <div className="space-y-2">
                        {f.images.map((im, i) => (
                            <div key={i} className="grid grid-cols-12 gap-1 items-center text-sm">
                                <input placeholder="URL" value={im.url} onChange={e => updImage(i, { url: e.target.value })} className={`${ic} col-span-8`} />
                                <select value={im.type} onChange={e => updImage(i, { type: e.target.value as ImageInput["type"] })} className={`${ic} col-span-2`}>
                                    <option value="THUMBNAIL">THUMBNAIL</option>
                                    <option value="DETAIL">DETAIL</option>
                                </select>
                                <input type="number" value={im.sortOrder} onChange={e => updImage(i, { sortOrder: Number(e.target.value) })} className={`${ic} col-span-1`} />
                                <button type="button" onClick={() => rmImage(i)} className="col-span-1 text-[var(--color-danger)] text-xs">삭제</button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

            <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="rounded-md bg-[var(--color-brand)] text-white px-4 py-2 text-sm disabled:opacity-50">
                    {submitting ? "저장 중..." : mode === "create" ? "등록" : "저장"}
                </button>
                {mode === "edit" && (
                    <button type="button" onClick={remove} className="rounded-md border border-[var(--color-danger)]/30 text-[var(--color-danger)] px-4 py-2 text-sm">삭제</button>
                )}
            </div>
        </form>
    );
}

const ic = "w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm bg-white";

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="bg-white rounded-md border border-[var(--color-border)] p-4 space-y-3">
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
    return <label className="block"><span className="text-xs text-[var(--color-fg-muted)]">{label}</span>{children}</label>;
}
