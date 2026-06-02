"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

function authHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "x-app-client": "ADMIN_PANEL",
    accept: "application/json",
  };
}
function jsonHeaders(token: string) {
  return { ...authHeaders(token), "content-type": "application/json" };
}

const inputCls =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white";
const labelCls = "block text-sm font-semibold text-[#1a2b6b] mb-1.5";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function buildUrl(prefix: string, slug: string) {
  return slug ? `${prefix}/${slug}` : "";
}

interface SeoRecord {
  slug?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  url?: string;
}

function readToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("auth_token") ?? "";
}

// ── Public handle exposed via ref ─────────────────────────────────────────────
export interface SeoTabHandle {
  /** Called by parent save handlers — only fires the API if fields were changed. */
  triggerSave: () => Promise<void>;
}

export interface SeoTabProps {
  initialSlug?: string;
  productName?: string;
  urlPrefix?: string;
  image?: string;
}

const SeoTab = forwardRef<SeoTabHandle, SeoTabProps>(function SeoTab(
  { initialSlug, productName, urlPrefix = "/product", image },
  ref,
) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);

  const [form, setForm] = useState({ slug: "", title: "", description: "", url: "" });
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  const hasFetched = useRef(false);
  const slugLocked = useRef(false);
  const savedSlug = useRef<string | null>(null);
  // Tracks whether any field has been changed since the last load/save
  const isDirty = useRef(false);

  const markDirty = () => { isDirty.current = true; };
  const clearDirty = () => { isDirty.current = false; };

  const set = (key: keyof typeof form, value: string) => {
    markDirty();
    setForm((f) => ({ ...f, [key]: value }));
  };

  // ── One-time API fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;

    const derivedSlug = initialSlug?.trim() || slugify(productName?.trim() || "");
    const token = readToken();
    if (!derivedSlug || !token) return;

    hasFetched.current = true;
    setLoading(true);

    fetch(`${API_BASE}/seo-details?slug=${encodeURIComponent(derivedSlug)}`, {
      headers: authHeaders(token),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const rec: SeoRecord | null = d?.data ?? (d?.slug ? d : null);
        if (rec && (rec.slug || rec.title || rec.url)) {
          const s = rec.slug ?? derivedSlug;
          setForm({
            slug: s,
            title: rec.title ?? "",
            description: rec.description ?? "",
            url: rec.url ?? buildUrl(urlPrefix, s),
          });
          setKeywords(Array.isArray(rec.keywords) ? rec.keywords : []);
          setExists(true);
          savedSlug.current = s;
          slugLocked.current = true;
          clearDirty(); // loaded from server — not dirty yet
        } else {
          setForm((f) => ({ ...f, slug: derivedSlug, url: buildUrl(urlPrefix, derivedSlug) }));
          clearDirty();
        }
      })
      .catch(() => {
        setForm((f) => ({
          ...f,
          slug: f.slug || derivedSlug,
          url: buildUrl(urlPrefix, f.slug || derivedSlug),
        }));
        clearDirty();
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug, productName]);

  // ── Live slug / URL sync from productName (add pages, no initialSlug) ────────
  useEffect(() => {
    if (initialSlug || slugLocked.current) return;
    const slug = slugify(productName?.trim() || "");
    if (!slug) return;
    setForm((f) => ({ ...f, slug, url: buildUrl(urlPrefix, slug) }));
    // Name-driven auto-fill is not a user edit — don't mark dirty here.
    // Only field interactions mark dirty.
  }, [productName, initialSlug, urlPrefix]);

  // ── Core save logic (shared by button and triggerSave) ───────────────────────
  const doSave = async (): Promise<void> => {
    if (!form.slug.trim()) {
      toast({ title: "Validation Error", description: "Slug is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const body = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      keywords,
      url: form.url.trim(),
    };
    try {
      const res = await fetch(`${API_BASE}/seo-details`, {
        method: exists ? "PATCH" : "POST",
        headers: jsonHeaders(readToken()),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to save SEO details");
      }
      setExists(true);
      savedSlug.current = body.slug;
      clearDirty();
      toast({ title: "Success", description: `SEO details ${exists ? "updated" : "created"} successfully.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save SEO details", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Ref handle — called by parent save buttons ────────────────────────────────
  useImperativeHandle(ref, () => ({
    triggerSave: async () => {
      if (!isDirty.current || !form.slug.trim()) return;
      await doSave();
    },
  }));

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!form.slug.trim()) return;
    if (typeof window !== "undefined" && !window.confirm("Delete the SEO details for this slug?")) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/seo-details?slug=${encodeURIComponent(form.slug.trim())}`,
        { method: "DELETE", headers: authHeaders(readToken()) },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to delete SEO details");
      }
      setExists(false);
      setForm({ slug: "", title: "", description: "", url: "" });
      setKeywords([]);
      savedSlug.current = null;
      hasFetched.current = false;
      slugLocked.current = false;
      clearDirty();
      toast({ title: "SEO details deleted successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete SEO details", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Keyword helpers ───────────────────────────────────────────────────────────
  const addKeyword = () => {
    const value = keywordInput.trim();
    if (value && !keywords.includes(value)) {
      setKeywords((prev) => [...prev, value]);
      markDirty();
    }
    setKeywordInput("");
  };
  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
    markDirty();
  };
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKeyword(); }
    else if (e.key === "Backspace" && !keywordInput && keywords.length > 0) {
      setKeywords((prev) => prev.slice(0, -1));
      markDirty();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div>
          <label className={labelCls}>
            Slug<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            value={form.slug}
            onChange={(e) => {
              slugLocked.current = true;
              const slug = e.target.value;
              markDirty();
              setForm((f) => ({ ...f, slug, url: buildUrl(urlPrefix, slug) }));
            }}
            placeholder="e.g. my-product-slug"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Title</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Meta title"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>URL</label>
          <input
            value={form.url}
            readOnly
            placeholder="Auto-populated from name"
            className={`${inputCls} bg-gray-50 cursor-default text-gray-500`}
          />
        </div>
        <div>
          <label className={labelCls}>Keywords</label>
          <div className="w-full min-h-10 px-2 py-1.5 border border-gray-300 rounded-lg bg-white flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-[#1a2b6b]/20 focus-within:border-[#1a2b6b]">
            {keywords.map((kw) => (
              <span key={kw} className="inline-flex items-center gap-1 bg-[#1a2b6b]/10 text-[#1a2b6b] text-xs font-medium px-2 py-0.5 rounded">
                {kw}
                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => removeKeyword(kw)} />
              </span>
            ))}
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              onBlur={addKeyword}
              placeholder={keywords.length === 0 ? "Type and press Enter" : ""}
              className="flex-1 min-w-[120px] h-7 px-1 text-sm outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Meta description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white resize-y"
        />
      </div>

      {/* Google Search Preview */}
      {(form.title || form.url || form.description) && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Google Search Preview
          </p>
          <div className="flex items-start gap-4">
            {image && (
              <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img src={image} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 leading-tight">rvadventureaustralia.com.au</p>
                  <p className="text-xs text-gray-400 leading-tight truncate">{form.url || "/"}</p>
                </div>
              </div>
              <p className="text-[#1a0dab] text-xl leading-tight hover:underline cursor-pointer truncate mt-1">
                {form.title
                  ? form.title.length > 60 ? form.title.slice(0, 60) + "…" : form.title
                  : <span className="text-gray-300 italic text-base">Page title</span>}
              </p>
              <p className="text-sm text-gray-600 leading-snug mt-1 line-clamp-2">
                {form.description
                  ? form.description.length > 155 ? form.description.slice(0, 155) + "…" : form.description
                  : <span className="text-gray-300 italic">Meta description will appear here…</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={doSave}
          disabled={saving || !form.slug.trim()}
          className="h-9 px-5 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {exists ? "Update SEO" : "Save SEO"}
        </button>
        {exists && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="h-9 px-5 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
});

export default SeoTab;
