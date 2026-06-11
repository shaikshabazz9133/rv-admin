import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? "https://dev-backend.rvadventureaustralia.com.au";

/**
 * Extract a plain URL string from any image field shape the API might return:
 *   - plain string  →  returned as-is
 *   - { url, _id }  →  .url is returned
 *   - null/undefined → ""
 */
export function imgUrl(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && "url" in (field as object))
    return ((field as Record<string, unknown>).url as string) ?? "";
  return "";
}

/** Resolve any image URL returned by the API — handles full https URLs and relative paths. */
export function resolveImg(src: unknown): string {
  const str = imgUrl(src);
  if (!str) return "";
  if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:") || str.startsWith("blob:")) return str;
  return `${IMG_BASE}${str.startsWith("/") ? "" : "/"}${str}`;
}
