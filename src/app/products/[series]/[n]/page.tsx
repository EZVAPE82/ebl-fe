import { ProductDetailView } from "@/app/p/[id]/page";

// 정식 상품 상세 URL — /products/{series}/{n} → slug "{series}-flavor-{n}" 으로 조회.
// (백엔드 detail 이 id-or-slug 지원) 구 /p/{id} 도 호환 유지.
type Params = Promise<{ series: string; n: string }>;

export default async function ProductBySeriesPage({ params }: { params: Params }) {
    const { series, n } = await params;
    return <ProductDetailView idOrSlug={`${series}-flavor-${n}`} />;
}
