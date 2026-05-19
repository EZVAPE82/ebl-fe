import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "엘프바 라운지 — 전자담배 자사몰",
    description: "정품 전자담배 기기·액상 전문몰. 만 19세 이상 이용 가능.",
    openGraph: {
        title: "엘프바 라운지",
        description: "정품 전자담배 기기·액상 전문몰",
        url: "https://elfbarlounge.co.kr",
        siteName: "엘프바 라운지",
        locale: "ko_KR",
        type: "website",
    },
    robots: { index: false, follow: false }, // 개발 환경 — 운영 전 변경
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="ko"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
        <body className="min-h-full flex flex-col bg-white text-zinc-900">
            <AuthProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </AuthProvider>
        </body>
        </html>
    );
}
