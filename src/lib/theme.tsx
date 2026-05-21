"use client";

/**
 * 테마 (light / dark / system) 관리.
 *
 * 동작:
 *  - system: html[data-theme] 제거 → globals.css 의 prefers-color-scheme 따름
 *  - light/dark: html[data-theme="..."] 설정 → [data-theme] CSS 블록 적용
 *  - localStorage("theme") 에 영속
 *
 * 초기 깜빡임 방지:
 *  layout.tsx 의 <head> 안에 ThemeInitScript 를 dangerouslySetInnerHTML 로 삽입
 *  → React 렌더 전 inline script 가 data-theme 먼저 설정.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

type Ctx = {
    theme: Theme;
    resolved: "light" | "dark";   // system 일 때 OS 값으로 해석한 결과
    setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolved, setResolved] = useState<"light" | "dark">("light");

    // 초기 1회: localStorage + OS 설정 로드 (외부 상태 → React 동기화).
    useEffect(() => {
        const saved = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Theme | null;
        const initial: Theme = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(initial);
        applyTheme(initial, setResolved);
    }, []);

    // OS 설정 변경 감지 (system 일 때만)
    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => setResolved(mq.matches ? "dark" : "light");
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, [theme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        try { localStorage.setItem(STORAGE_KEY, t); } catch { /* private mode */ }
        applyTheme(t, setResolved);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}

function applyTheme(theme: Theme, setResolved: (r: "light" | "dark") => void) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "system") {
        root.removeAttribute("data-theme");
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setResolved(dark ? "dark" : "light");
    } else {
        root.setAttribute("data-theme", theme);
        setResolved(theme);
    }
}

/**
 * SSR 깜빡임 방지 inline script — layout.tsx 의 <head> 에 삽입.
 * React hydration 이전에 data-theme 를 미리 적용해서 light flash 차단.
 */
export const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
    // system 또는 미설정: data-theme 안 둠 → prefers-color-scheme media 작동
  } catch (e) { /* private mode 등 */ }
})();
`.trim();
