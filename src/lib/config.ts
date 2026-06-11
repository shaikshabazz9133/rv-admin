type RvConfig = { apiBase: string; imgBase: string };

const FALLBACK_API = process.env.NEXT_PUBLIC_API_BASE ?? "https://dev-backend.rvadventureaustralia.com.au/api";
const FALLBACK_IMG = process.env.NEXT_PUBLIC_IMG_BASE ?? "https://dev-backend.rvadventureaustralia.com.au";

function rvConfig(): RvConfig | undefined {
  return typeof window !== "undefined"
    ? (window as unknown as { __RV_CONFIG__?: RvConfig }).__RV_CONFIG__
    : undefined;
}

export const API_BASE: string = rvConfig()?.apiBase ?? FALLBACK_API;
export const IMG_BASE: string = rvConfig()?.imgBase ?? FALLBACK_IMG;
