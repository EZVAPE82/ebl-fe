import { api } from "@/lib/api";

export type Integrations = {
    naverLogin: boolean;
    naverCommerce: boolean;
    elevenOpenapi: boolean;
};

const FALLBACK: Integrations = { naverLogin: false, naverCommerce: false, elevenOpenapi: false };

export async function fetchIntegrations(): Promise<Integrations> {
    try {
        return await api<Integrations>("/api/v1/public/integrations", { cache: "no-store" });
    } catch {
        return FALLBACK;
    }
}
