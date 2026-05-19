import { api } from "@/lib/api";

type Health = {
    status: string;
    service: string;
    timestamp: string;
};

async function fetchHealth(): Promise<Health | null> {
    try {
        // 서버 컴포넌트에서 호출. NEXT_PUBLIC_API_BASE_URL 사용.
        return await api<Health>("/api/v1/public/ping", { cache: "no-store" });
    } catch {
        return null;
    }
}

export default async function Home() {
    const health = await fetchHealth();

    return (
        <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-white">
            <div className="w-full max-w-xl space-y-6">
                <header className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">엘프바 라운지</h1>
                    <p className="text-sm text-zinc-500">elfbarlounge.co.kr · 개발 환경</p>
                </header>

                <section className="rounded-md border border-zinc-200 p-4 text-sm">
                    <div className="font-medium mb-2">백엔드 헬스체크</div>
                    {health ? (
                        <dl className="grid grid-cols-[100px_1fr] gap-y-1 text-zinc-700">
                            <dt className="text-zinc-500">status</dt>
                            <dd className="font-mono">{health.status}</dd>
                            <dt className="text-zinc-500">service</dt>
                            <dd className="font-mono">{health.service}</dd>
                            <dt className="text-zinc-500">timestamp</dt>
                            <dd className="font-mono text-xs">{health.timestamp}</dd>
                        </dl>
                    ) : (
                        <p className="text-rose-600">
                            백엔드에 연결할 수 없습니다. <code className="text-xs">./gradlew bootRun</code> 으로 백엔드를 실행하세요.
                        </p>
                    )}
                </section>

                <footer className="text-xs text-zinc-400">
                    Next.js 15 · Spring Boot 3 · 기능명세서 v1.5
                </footer>
            </div>
        </main>
    );
}
