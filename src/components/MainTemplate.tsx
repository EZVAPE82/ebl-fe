"use client";

import React, { useState, useEffect } from "react";

export type HeroSlide = {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    bgGradient: string;
    tagColor: string;
};

export type ProductCard = {
    id: number | string;
    name: string;
    type: string;
    flavors: string;
    isNew: boolean;
    img: string;
};

export type Partner = {
    id: number;
    name: string;
    desc: string;
    bg: string;
};

type Props = {
    navigationLinks: string[];
    heroSlides: HeroSlide[];
    products: ProductCard[];
    partners: Partner[];
};

export default function MainTemplate({
    navigationLinks,
    heroSlides,
    products,
    partners,
}: Props) {
    // UI States
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [hoveredPartner, setHoveredPartner] = useState<number | null>(null);

    // 스크롤 시 헤더 블러 효과 제어
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // 히어로 배너 자동 롤링
    useEffect(() => {
        if (heroSlides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [heroSlides.length]);

    return (
        <div className="w-full min-h-screen bg-[#0a0a0a] text-white font-sans antialiased selection:bg-emerald-400 selection:text-black">

            {/* =================================================================
                [HEADER] 투명 블러 + 미니멀 내비게이션
              ================================================================== */}
            <header
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                    isScrolled
                        ? "bg-black/70 backdrop-blur-md border-b border-white/10 py-4"
                        : "bg-transparent py-6"
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <a
                        href="/"
                        className="text-2xl font-black tracking-widest bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
                    >
                        ELFBAR
                    </a>

                    <nav className="hidden md:flex space-x-8 text-sm font-medium tracking-wide">
                        {navigationLinks.map((link) => (
                            <a
                                key={link}
                                href="#"
                                className="text-white/70 hover:text-white transition-colors duration-200"
                            >
                                {link}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            className="text-sm border border-white/20 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all duration-300"
                        >
                            Verify Product
                        </button>
                    </div>
                </div>
            </header>

            {/* =================================================================
                [HERO BANNER] 풀스크린 비주얼
              ================================================================== */}
            <section className="relative w-full h-screen overflow-hidden">
                {heroSlides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 w-full h-full bg-gradient-to-b ${slide.bgGradient} transition-opacity duration-1000 flex items-center ${
                            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                    >
                        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6 transform translate-y-0 transition-transform duration-1000 ease-out">
                                <span
                                    className={`inline-block text-xs font-bold uppercase tracking-widest text-black px-3 py-1 rounded-sm ${slide.tagColor}`}
                                >
                                    New Release
                                </span>
                                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none">
                                    {slide.title}
                                </h1>
                                <h3 className="text-xl md:text-2xl font-light text-white/80">
                                    {slide.subtitle}
                                </h3>
                                <p className="text-base text-white/60 max-w-md font-light leading-relaxed">
                                    {slide.description}
                                </p>
                                <div className="pt-4">
                                    <button
                                        type="button"
                                        className="bg-white text-black px-8 py-3 rounded-full font-bold text-sm tracking-wider hover:bg-emerald-400 hover:scale-105 transition-all duration-300 shadow-lg shadow-white/5"
                                    >
                                        LEARN MORE
                                    </button>
                                </div>
                            </div>

                            <div className="hidden md:flex justify-center relative">
                                <div className="w-[400px] h-[500px] bg-white/5 rounded-3xl border border-white/10 backdrop-blur-lg shadow-2xl flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <span className="text-white/20 text-xs tracking-widest font-mono">
                                        PRODUCT IMAGE DISPLAY
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            aria-label={`슬라이드 ${index + 1}`}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === currentSlide ? "w-8 bg-emerald-400" : "w-2 bg-white/30"
                            }`}
                        />
                    ))}
                </div>
            </section>

            {/* =================================================================
                [PRODUCT LIST GRID]
              ================================================================== */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="flex justify-between items-end mb-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-extrabold tracking-tight">FEATURED PRODUCTS</h2>
                        <p className="text-sm text-white/50">
                            엘프바만의 독창적인 기술력이 반영된 대표 라인업을 만나보세요.
                        </p>
                    </div>
                    <a
                        href="/c/best"
                        className="text-sm text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                        View All Products <span>→</span>
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <a
                            key={product.id}
                            href={`/p/${product.id}`}
                            className="group relative bg-[#121212] border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:border-white/20 transition-all duration-300 flex flex-col"
                        >
                            <div className="relative w-full aspect-[4/5] bg-neutral-900 overflow-hidden">
                                {product.isNew && (
                                    <span className="absolute top-4 left-4 z-10 bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                                        New
                                    </span>
                                )}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={product.img}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />
                            </div>

                            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase">
                                        {product.type}
                                    </span>
                                    <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors duration-200">
                                        {product.name}
                                    </h3>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs text-white/50">
                                    <span>Spec: {product.flavors}</span>
                                    <span className="font-bold text-white group-hover:translate-x-1 transition-transform duration-200">
                                        →
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            {/* =================================================================
                [PARTNERS 3D CAROUSEL]
              ================================================================== */}
            <section className="w-full bg-[#0d0d0d] py-24 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 mb-16 text-center space-y-2">
                    <h2 className="text-3xl font-black tracking-tight uppercase">GLOBAL PARTNERS</h2>
                    <p className="text-sm text-white/40">
                        신뢰와 기술 제휴로 함께 뻗어나가는 글로벌 협력 네트워크입니다.
                    </p>
                </div>

                <div
                    className="relative w-full h-[550px] flex items-center justify-center"
                    style={{ perspective: "1400px" }}
                >
                    <div
                        className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border border-dashed border-white/10 pointer-events-none"
                        style={{ transform: "translate(-50%, -50%) rotateX(82deg)" }}
                    />

                    <div className="relative w-[280px] h-[380px]" style={{ transformStyle: "preserve-3d" }}>
                        {partners.map((partner, index) => {
                            const totalItems = partners.length;
                            const angle = (index * 360) / totalItems;
                            const isHovered = hoveredPartner === partner.id;
                            const baseTransform = `rotateY(${angle}deg) translateZ(360px)`;
                            const hoverTransform = `rotateY(0deg) translateZ(420px) scale(1.08)`;

                            return (
                                <div
                                    key={partner.id}
                                    onMouseEnter={() => setHoveredPartner(partner.id)}
                                    onMouseLeave={() => setHoveredPartner(null)}
                                    className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden cursor-pointer shadow-2xl transition-all duration-700 ease-out origin-center"
                                    style={{
                                        transform: isHovered ? hoverTransform : baseTransform,
                                        filter: isHovered ? "grayscale(0%)" : "grayscale(100%)",
                                        opacity:
                                            hoveredPartner === null
                                                ? index < 3 || index > 6
                                                    ? 1
                                                    : 0.3
                                                : isHovered
                                                  ? 1
                                                  : 0.15,
                                        zIndex: isHovered ? 50 : 10 - index,
                                        WebkitBoxReflect:
                                            "below 12px linear-gradient(transparent 75%, rgba(255,255,255,0.08))",
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={partner.bg}
                                        alt={partner.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    <div className="absolute inset-0 p-6 flex flex-col justify-end space-y-2">
                                        <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                                            0{partner.id} . Partner
                                        </span>
                                        <h3 className="text-xl font-bold tracking-tight text-white">
                                            {partner.name}
                                        </h3>
                                        <p className="text-xs text-white/60 font-light leading-tight">
                                            {partner.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* =================================================================
                [FOOTER]
              ================================================================== */}
            <footer className="w-full bg-black border-t border-white/5 py-12 text-sm text-white/40">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <span className="text-lg font-black tracking-widest text-white/60">ELFBAR</span>
                        <p className="text-xs font-light">
                            © 2026 ELFBAR. All rights reserved. 본 제품은 성인 전용 제품입니다.
                        </p>
                    </div>
                    <div className="flex space-x-6 text-xs">
                        <a href="/terms" className="hover:text-white transition-colors">
                            Privacy Policy
                        </a>
                        <a href="/privacy" className="hover:text-white transition-colors">
                            Terms of Service
                        </a>
                        <a href="/faq" className="hover:text-white transition-colors">
                            Contact Us
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
