import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
    return (
        <div>
            <h1 className="text-xl font-bold mb-5">상품 신규 등록</h1>
            <ProductForm mode="create" />
        </div>
    );
}
