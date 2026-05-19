import { DocPage } from "@/components/DocPage";

export const metadata = { title: "이용안내" };

export default function GuidePage() {
    return (
        <DocPage title="이용안내" version="v1" lastUpdated="2026-05-19">
            <h2>주문·결제</h2>
            <p>회원가입 후 성인 인증 완료 시 결제가 가능합니다. 카드·간편결제 등 다양한 수단을 지원합니다.</p>
            <h2>배송</h2>
            <p>주문 후 평일 기준 1~3일 내 발송됩니다. 일정 금액 이상 주문 시 무료배송이 적용됩니다.</p>
            <h2>교환·반품</h2>
            <p>상품 수령 후 7일 이내 교환·반품 신청 가능합니다. 단순 변심의 경우 반송 택배비가 차감됩니다.</p>
            <h2>적립금·쿠폰</h2>
            <p>구매·리뷰·이벤트로 적립금이 지급됩니다. 적립금은 배송완료 시 지급, 유효기간 6개월입니다.</p>
        </DocPage>
    );
}
