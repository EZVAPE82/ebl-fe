import Script from "next/script";

/**
 * GA4 + 카카오 픽셀.
 * 환경변수 (NEXT_PUBLIC_*) 가 비어 있으면 렌더링하지 않음.
 *
 * 보안:
 *  - NEXT_PUBLIC_* 만 클라이언트에 노출 (rule 3)
 *  - 측정 ID 외 시크릿 절대 포함 X
 */
export function Analytics() {
    const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
    const kakaoPixel = process.env.NEXT_PUBLIC_KAKAO_PIXEL_ID;

    return (
        <>
            {ga4 && (
                <>
                    <Script
                        async
                        src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4-init" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${ga4}', { anonymize_ip: true });
                        `}
                    </Script>
                </>
            )}

            {kakaoPixel && (
                <>
                    <Script
                        src="//t1.daumcdn.net/kas/static/kp.js"
                        strategy="afterInteractive"
                    />
                    <Script id="kakao-pixel-init" strategy="afterInteractive">
                        {`
                            if (window.kakaoPixel) {
                                kakaoPixel('${kakaoPixel}').pageView();
                            }
                        `}
                    </Script>
                </>
            )}
        </>
    );
}
