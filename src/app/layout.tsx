import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elfbarlounge.co.kr";
const isProd = SITE_URL.includes("elfbarlounge.co.kr");

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: { default: "엘프바 라운지 — 전자담배 자사몰", template: "%s | 엘프바 라운지" },
    description: "정품 전자담배 기기·액상 전문몰. 만 19세 이상 이용 가능.",
    openGraph: {
        title: "엘프바 라운지",
        description: "정품 전자담배 기기·액상 전문몰",
        url: SITE_URL,
        siteName: "엘프바 라운지",
        locale: "ko_KR",
        type: "website",
        images: [
            {
                url: "/og-default.png",
                width: 1200,
                height: 630,
                alt: "엘프바 라운지",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "엘프바 라운지",
        description: "정품 전자담배 기기·액상 전문몰",
        images: ["/og-default.png"],
    },
    robots: isProd ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="ko"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
        <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
            <AuthProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </AuthProvider>
            <Analytics />
        </body>
        </html>
    );
}
