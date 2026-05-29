import { SeriesPage } from "@/components/SeriesPage";

export const metadata = { title: "ELFBAR ICE KING" };

export default function IceKingPage() {
    return (
        <SeriesPage
            series="ICE KING"
            subtitle="가장 시원한, 가장 강력한"
            description="ICE KING 은 ELFBAR 의 최상위 쿨링 시리즈로, 한 번의 흡입으로 극강의 청량감을 제공합니다. 진한 향과 풍부한 연기로 매니아들에게 사랑받는 라인업."
            nameKeyword="KING"
            accentColor="#5b6abf"
            accentColor2="#2a3680"
        />
    );
}
