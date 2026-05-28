/* ============================================================
 * Home Page — 새 MainTemplate (검정 + 에메랄드 액센트 + 3D 파트너 캐러셀)
 *
 * 구조:
 *   - 이 파일은 server component. backend API 호출 후 props 정리.
 *   - 실제 UI / 인터랙션은 MainTemplate (client) 에서 처리.
 *
 * Backend 데이터 매핑:
 *   - HERO_SLIDES   ← /api/v1/public/banners?placement=MAIN_HERO
 *                     (현재 Banner 모델에 title/subtitle 없어서 altText → title,
 *                      나머지 정적 fallback. 추후 Banner 모델 풍부화 시 매핑 강화.)
 *   - PRODUCT_LIST  ← /api/v1/public/products?sort=popular&size=4
 *                     (ProductSummary 의 name/brand/thumbnailUrl 매핑.)
 *   - NAVIGATION    ← 정적 (사이트 NAV 라 backend 불필요).
 *   - PARTNERS      ← 정적 (현재 backend 별도 모델 없음. 추후 Partner 도메인 추가
 *                     시 API 로 교체.)
 * ============================================================ */

import { api } from "@/lib/api";
import MainTemplate, {
    type HeroSlide,
    type ProductCard,
    type Partner,
} from "@/components/MainTemplate";
import type { Banner, Page, ProductSummary } from "@/types/api";

/* ---------- 정적 데이터 (NAV / fallback / 파트너) ---------- */
const NAVIGATION_LINKS = [
    "Products",
    "Flavors",
    "About Us",
    "Where to Buy",
    "Support",
];

// hero 배경 그라데이션 + 태그 색 (slot 순환). 백엔드 Banner 가 풍부해질 때까지 정적.
const HERO_GRADIENTS = [
    "from-purple-900 via-indigo-950 to-black",
    "from-emerald-900 via-teal-950 to-black",
    "from-rose-900 via-fuchsia-950 to-black",
    "from-blue-900 via-slate-950 to-black",
    "from-amber-900 via-orange-950 to-black",
];
const HERO_TAGS = [
    "bg-purple-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-blue-500",
    "bg-amber-500",
];

const FALLBACK_HERO: HeroSlide[] = [
    {
        id: 1,
        title: "ELFBAR BC10000",
        subtitle: "Upgrade Your Flavor Experience",
        description: "진화된 메쉬 코일과 실시간 디스플레이로 완성된 압도적인 만족감.",
        bgGradient: HERO_GRADIENTS[0],
        tagColor: HERO_TAGS[0],
    },
    {
        id: 2,
        title: "ELFBAR RAYA D1",
        subtitle: "Sleek Design, Deeper Satisfaction",
        description: "내 손안의 작은 테크놀로지, 컴팩트한 디자인에 담긴 풍부한 연무량.",
        bgGradient: HERO_GRADIENTS[1],
        tagColor: HERO_TAGS[1],
    },
];

const FALLBACK_PRODUCTS: ProductCard[] = [
    { id: 1, name: "ELFBAR BC10000", type: "Smart Display", flavors: "12 Flavors", isNew: true,  img: "https://picsum.photos/id/106/400/500" },
    { id: 2, name: "ELFBAR RAYA D1", type: "Ultra Slim",    flavors: "8 Flavors",  isNew: true,  img: "https://picsum.photos/id/201/400/500" },
    { id: 3, name: "ELFBAR LOWIT",   type: "Prefilled Pod", flavors: "10 Flavors", isNew: false, img: "https://picsum.photos/id/250/400/500" },
    { id: 4, name: "ELFBAR PI9000",  type: "Puff Master",   flavors: "15 Flavors", isNew: false, img: "https://picsum.photos/id/319/400/500" },
];

const PARTNERS: Partner[] = [
    { id: 1, name: "Partner Alpha",   desc: "Global Distribution Partner",   bg: "https://picsum.photos/id/1015/300/400" },
    { id: 2, name: "Partner Beta",    desc: "Flavor Tech Alliance",          bg: "https://picsum.photos/id/1016/300/400" },
    { id: 3, name: "Partner Gamma",   desc: "Eco-Friendly Logistics",        bg: "https://picsum.photos/id/1018/300/400" },
    { id: 4, name: "Partner Delta",   desc: "Next-Gen Hardware Lab",         bg: "https://picsum.photos/id/1019/300/400" },
    { id: 5, name: "Partner Epsilon", desc: "Design & UX Alliance",          bg: "https://picsum.photos/id/1021/300/400" },
    { id: 6, name: "Partner Zeta",    desc: "Global Compliance Corp",        bg: "https://picsum.photos/id/1022/300/400" },
    { id: 7, name: "Partner Eta",     desc: "Bio-Chemical Testing",          bg: "https://picsum.photos/id/1023/300/400" },
    { id: 8, name: "Partner Theta",   desc: "Supply Chain Network",          bg: "https://picsum.photos/id/1024/300/400" },
    { id: 9, name: "Partner Iota",    desc: "Brand Strategy Group",          bg: "https://picsum.photos/id/1025/300/400" },
];

/* ---------- API helper ---------- */
async function safeFetch<T>(path: string, fallback: T): Promise<T> {
    try {
        return await api<T>(path, { cache: "no-store" });
    } catch {
        return fallback;
    }
}

/* ---------- Page (Server Component) ---------- */
export default async function Home() {
    const emptyPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 8,
        first: true,
        last: true,
        empty: true,
    };

    const [banners, popular] = await Promise.all([
        safeFetch<Banner[]>("/api/v1/public/banners?placement=MAIN_HERO", []),
        safeFetch<Page<ProductSummary>>(
            "/api/v1/public/products?sort=popular&size=4",
            emptyPage as Page<ProductSummary>,
        ),
    ]);

    /* HERO_SLIDES 매핑 — Banner 모델에 title/subtitle/description 필드 없으므로
       altText 를 title 로 사용, 나머지는 정적 폴백 카피. backend Banner 모델 풍부화
       시 (예: title/subtitle/description 컬럼 추가) 아래 mapping 만 강화. */
    const heroSlides: HeroSlide[] =
        banners.length > 0
            ? banners.slice(0, 5).map((b, i) => ({
                  id: b.id,
                  title: b.altText ?? `ELFBAR ${b.id}`,
                  subtitle: "Premium Vape Experience",
                  description: "최고급 일회용 베이프를 만나보세요.",
                  bgGradient: HERO_GRADIENTS[i % HERO_GRADIENTS.length],
                  tagColor: HERO_TAGS[i % HERO_TAGS.length],
              }))
            : FALLBACK_HERO;

    /* PRODUCT_LIST 매핑 — ProductSummary 의 name/thumbnailUrl 직접 매핑.
       type: category id 매핑 정밀화 가능. 일단 정적 라벨. */
    const products: ProductCard[] =
        popular.content.length > 0
            ? popular.content.slice(0, 4).map((p, i) => ({
                  id: p.id,
                  name: p.name,
                  type: p.categoryId === 1 ? "Disposable" : p.categoryId === 2 ? "Liquid" : "Vape",
                  flavors: p.reviewCount > 0 ? `${p.reviewCount} Reviews · ★${p.ratingAvg.toFixed(1)}` : "New",
                  isNew: i < 2,
                  img: p.thumbnailUrl ?? `https://picsum.photos/id/${100 + i * 50}/400/500`,
              }))
            : FALLBACK_PRODUCTS;

    return (
        <MainTemplate
            navigationLinks={NAVIGATION_LINKS}
            heroSlides={heroSlides}
            products={products}
            partners={PARTNERS}
        />
    );
}
