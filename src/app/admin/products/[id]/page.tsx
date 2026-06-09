"use client";

import { use, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { ProductForm, type ProductInitial } from "@/components/admin/ProductForm";

type AdminProductDetail = {
    id: number;
    categoryId: number | null;
    brandId: number | null;
    name: string;
    slug: string;
    description: string | null;
    compatibilityInfo: string | null;
    price: number;
    onlinePrice: number | null;
    status: ProductInitial["status"];
    thumbnailUrl: string | null;
    featuredOrder: number | null;
    bestOrder: number | null;
    stock: number | null;
    options: {
        id: number; optionGroup: string; optionValue: string;
        priceDelta: number; stock: number; required: boolean;
        sortOrder: number; visible: boolean;
    }[];
    images: {
        id: number; url: string; type: "THUMBNAIL" | "DETAIL"; sortOrder: number;
    }[];
};

export default function AdminProductEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [initial, setInitial] = useState<ProductInitial | null>(null);

    useEffect(() => {
        (async () => {
            const p = await adminApi<AdminProductDetail>(`/api/v1/admin/products/${id}`);
            setInitial({
                id: p.id,
                categoryId: p.categoryId,
                brandId: p.brandId,
                name: p.name,
                slug: p.slug,
                description: p.description ?? "",
                compatibilityInfo: p.compatibilityInfo ?? "",
                price: p.price,
                onlinePrice: p.onlinePrice,
                status: p.status,
                thumbnailUrl: p.thumbnailUrl ?? "",
                stockThreshold: 0,
                stock: p.stock ?? null,
                featuredOrder: p.featuredOrder,
                bestOrder: p.bestOrder,
                options: p.options.map(o => ({
                    optionGroup: o.optionGroup, optionValue: o.optionValue,
                    priceDelta: o.priceDelta, stock: o.stock, required: o.required,
                    sortOrder: o.sortOrder, visible: o.visible,
                })),
                images: p.images.map(im => ({ url: im.url, type: im.type, sortOrder: im.sortOrder })),
            });
        })();
    }, [id]);

    if (!initial) return <p className="text-[var(--color-fg-muted)]">불러오는 중...</p>;

    return (
        <div>
            <h1 className="text-xl font-bold mb-5">상품 수정 #{initial.id}</h1>
            <ProductForm mode="edit" initial={initial} />
        </div>
    );
}
