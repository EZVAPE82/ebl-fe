import { DetailExpand } from "@/components/DetailExpand";

/* ============================================================
 * DukeLanding — ELFBAR DUKE 상세 (시안 277-12516).
 *   Figma 디자인 통이미지 한 장(duke-detail-full.jpg)을 "더 알아보기" 접기/펼치기로 노출.
 *   모든 DUKE 상품(/products/duke/{n}) 공통. 검정 배경이라 dark 페이드.
 * ============================================================ */
export function DukeLanding() {
    return <DetailExpand src="/images/duke-detail-full.jpg" alt="ELFBAR DUKE 시그니처 상세" dark />;
}
