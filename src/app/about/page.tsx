import { DocPage } from "@/components/DocPage";

export const metadata = { title: "회사소개" };

export default function AboutPage() {
    return (
        <DocPage title="회사소개" version="v1" lastUpdated="2026-05-19">
            <p>엘프바 라운지는 정품 전자담배 기기를 전문으로 판매하는 자사 운영 쇼핑몰입니다.</p>
            <h2>운영 원칙</h2>
            <p>· 만 19세 이상 성인 인증 후 이용<br />· 정품 정상 유통 채널 100%<br />· 빠르고 안전한 배송</p>
        </DocPage>
    );
}
