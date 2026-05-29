import { SeriesPage } from "@/components/SeriesPage";

export const metadata = { title: "ELFBAR DUKE 시그니처" };

export default function DukeProductPage() {
    return (
        <SeriesPage
            series="ELFBAR DUKE"
            subtitle="단순한 풍미 그 이상의 시그니처 시리즈"
            description="DUKE 시리즈는 ELFBAR 의 시그니처 라인업으로, 정제된 풍미와 균형 잡힌 그립감을 자랑합니다. 멘솔·그레이프·라임 등 다양한 플레이버를 한 번의 충전으로 오래 즐길 수 있습니다."
            nameKeyword="DUKE"
            accentColor="#3a4a8a"
            accentColor2="#1a1f4e"
        />
    );
}
