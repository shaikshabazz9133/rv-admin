"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  Loader2,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SeoTab, { type SeoTabHandle } from "@/components/SeoTab";
import * as DialogPrimitive from "@radix-ui/react-dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://dev-backend.rvadventureaustralia.com.au/api";

function getToken() {
  return typeof window !== "undefined"
    ? sessionStorage.getItem("auth_token")
    : null;
}
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  _id: string;
  name: string;
  level: number;
  identifier: string;
  isActive: boolean;
  parent?: { _id: string; name: string; level: number } | null;
}
interface Supplier {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  isActive: boolean;
}
interface EbayPolicy {
  id: string;
  name: string;
}
interface EbayCategory {
  categoryId: string;
  categoryName: string;
  children?: EbayCategory[];
}
interface ProductItem {
  _id: string;
  name: string;
  description?: string;
  skuCode?: string;
  price?: number;
  offerPrice?: number;
  displayPic?: string;
  images?: string[];
  thumbnail?: string;
  category?: { _id: string; name: string };
  supplier?: { _id: string; name: string };
  ratingsCount?: number;
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichTextEditor({
  onChange,
  placeholder,
}: {
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        exec("insertImage", result);
      }
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current?.innerHTML ?? "");
  };
  const Btn = ({
    children,
    cmd,
    val,
    title,
    cls,
  }: {
    children: React.ReactNode;
    cmd: string;
    val?: string;
    title?: string;
    cls?: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        exec(cmd, val);
      }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 text-sm select-none ${cls ?? ""}`}
    >
      {children}
    </button>
  );
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <select
          defaultValue="p"
          className="h-7 px-1.5 text-xs border border-gray-200 rounded bg-white mr-1 cursor-pointer"
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            exec("formatBlock", e.target.value);
            e.target.value = "p";
          }}
        >
          <option value="p">Normal</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
        </select>
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        <Btn cmd="bold" title="Bold" cls="font-bold">
          B
        </Btn>
        <Btn cmd="italic" title="Italic" cls="italic">
          I
        </Btn>
        <Btn cmd="underline" title="Underline" cls="underline">
          U
        </Btn>
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        <Btn cmd="insertOrderedList" title="Ordered List">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </Btn>
        <Btn cmd="insertUnorderedList" title="Unordered List">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Btn>
        <Btn cmd="justifyLeft" title="Align Left">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h10M4 18h16"
            />
          </svg>
        </Btn>
        <Btn cmd="justifyCenter" title="Align Center">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M7 12h10M4 18h16"
            />
          </svg>
        </Btn>
        <Btn cmd="justifyRight" title="Align Right">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M10 12h10M4 18h16"
            />
          </svg>
        </Btn>
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        <button
          type="button"
          title="Link"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = window.prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </button>
        <button
          type="button"
          title="Image"
          onMouseDown={(e) => {
            e.preventDefault();
            imageInputRef.current?.click();
          }}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImagePick}
        />
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        <button
          type="button"
          title="Font Color"
          onMouseDown={(e) => {
            e.preventDefault();
            const color = window.prompt("Enter color (e.g. #ff0000):");
            if (color) exec("foreColor", color);
          }}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 text-xs font-bold"
        >
          A
        </button>
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        <Btn cmd="formatBlock" val="blockquote" title="Quote" cls="text-base">
          &ldquo;
        </Btn>
        <Btn cmd="formatBlock" val="pre" title="Code" cls="font-mono text-xs">
          {"</>"}
        </Btn>
        <Btn cmd="subscript" title="Subscript" cls="text-xs">
          X₂
        </Btn>
        <Btn cmd="superscript" title="Superscript" cls="text-xs">
          X²
        </Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="rte-content min-h-[160px] p-4 text-sm text-gray-700 outline-none [&:empty]:before:content-[attr(data-ph)] [&:empty]:before:text-gray-400"
        data-ph={placeholder ?? "Enter content here..."}
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
      />
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80' fill='none'%3E%3Crect width='80' height='80' fill='%23e2e8f0'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%2394a3b8'/%3E%3Cellipse cx='40' cy='68' rx='22' ry='14' fill='%2394a3b8'/%3E%3C/svg%3E";

function ProductCard({
  product,
  selected,
  onToggle,
}: {
  product: ProductItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const img = product.displayPic || product.images?.[0] || product.thumbnail;
  const reviewCount = product.ratingsCount ?? 0;
  const displayPrice = product.offerPrice ?? product.price;
  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-xl overflow-hidden transition-all bg-white ${
        selected
          ? "border-2 border-[#1a2b6b] shadow-lg"
          : "border border-gray-200 hover:border-[#1a2b6b]/40 hover:shadow-md"
      }`}
    >
      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shadow-sm ${
            selected
              ? "bg-[#1a2b6b] border-[#1a2b6b]"
              : "bg-white border-gray-300"
          }`}
        >
          {selected && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="relative h-44 bg-gray-50 flex items-center justify-center overflow-hidden">
        <img
          src={img || PLACEHOLDER_IMG}
          alt={product.name}
          className="w-full h-full object-contain p-3"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />
        {selected && (
          <div className="absolute inset-0 bg-[#1a2b6b]/5 pointer-events-none" />
        )}
      </div>

      {/* Info */}
      <div className="p-3 border-t border-gray-100">
        {/* Stars */}
        <div className="flex items-center gap-0.5 mb-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg
              key={s}
              className="w-3 h-3 text-gray-200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
          <span className="text-[10px] text-gray-400 ml-1">
            Reviews ({reviewCount})
          </span>
        </div>

        {/* Name */}
        <h4 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">
          {product.name}
        </h4>

        {/* Category */}
        {product.category?.name && (
          <p className="text-[11px] text-gray-400 mb-1">
            {product.category.name}
          </p>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-relaxed">
            {product.description.replace(/<[^>]+>/g, "")}
          </p>
        )}

        {/* Price */}
        {displayPrice != null && (
          <p className="text-sm font-bold text-gray-900">
            $ {displayPrice.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Product List Tab (Related Products / Accessories) ─────────────────────────
const PAGE_SIZE = 25;

function ProductSearchTab({
  token,
  selected,
  onToggle,
}: {
  token: string;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(
    (q: string, p: number) => {
      setLoading(true);
      const params = new URLSearchParams({
        includeInactive: "1",
        search: q,
        pageNo: String(p),
        pageSize: String(PAGE_SIZE),
      });
      fetch(`${API_BASE}/product/all?${params}`, {
        headers: authHeaders(token),
      })
        .then((r) => r.json())
        .then((d) => {
          setProducts(d.data?.records?.products ?? []);
          setTotal(d.data?.totalRecords ?? 0);
          setTotalPages(d.data?.totalPages ?? 1);
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    },
    [token],
  );

  useEffect(() => {
    fetchProducts(debouncedQuery, page);
  }, [fetchProducts, debouncedQuery, page]);

  const handleSearch = (v: string) => {
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(v);
      setPage(1);
    }, 400);
  };

  return (
    <div>
      {/* Search + selected count */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]"
          />
        </div>
        {selected.length > 0 && (
          <span className="text-xs font-semibold text-[#1a2b6b] bg-[#1a2b6b]/10 px-3 py-1.5 rounded-full">
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-[#1a2b6b]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                selected={selected.includes(p._id)}
                onToggle={() => onToggle(p._id)}
              />
            ))}
            {products.length === 0 && (
              <p className="col-span-5 text-center text-sm text-gray-400 py-10">
                No products found.
              </p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}&ndash;
                {Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-0.5">
                  {(() => {
                    const pages: (number | "...")[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (page > 3) pages.push("...");
                      for (
                        let i = Math.max(2, page - 1);
                        i <= Math.min(totalPages - 1, page + 1);
                        i++
                      )
                        pages.push(i);
                      if (page < totalPages - 2) pages.push("...");
                      pages.push(totalPages);
                    }
                    return pages.map((pg, i) =>
                      pg === "..." ? (
                        <span
                          key={`d${i}`}
                          className="w-7 text-center text-xs text-gray-400"
                        >
                          &hellip;
                        </span>
                      ) : (
                        <button
                          key={pg}
                          onClick={() => setPage(pg as number)}
                          className={`w-8 h-7 rounded-xl text-xs font-semibold transition-all ${
                            pg === page
                              ? "bg-[#1a2b6b] text-white shadow-sm"
                              : "text-gray-500 hover:text-[#1a2b6b] hover:bg-white"
                          }`}
                        >
                          {pg}
                        </button>
                      ),
                    );
                  })()}
                </div>
                <button
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages || loading}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Input helpers ────────────────────────────────────────────────────────────
const inputCls =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white";
const inputErrCls =
  "w-full h-10 px-3 border border-red-400 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200 transition-colors bg-white";
const numberInputCls =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
const numberInputErrCls =
  "w-full h-10 px-3 border border-red-400 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200 transition-colors bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
const selectCls =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white cursor-pointer appearance-none";
const labelCls = "block text-sm font-semibold text-[#1a2b6b] mb-1.5";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Multi-select dropdown (checkbox list) ───────────────────────────────────
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  disabled,
  error,
}: {
  options: { _id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  const selectedOpts = options.filter((o) => selected.includes(o._id));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full min-h-10 px-2.5 py-1.5 text-sm text-left bg-white border rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      >
        <span className="flex-1 flex flex-wrap gap-1">
          {selectedOpts.length === 0 ? (
            <span className="text-gray-400 py-0.5">{placeholder}</span>
          ) : (
            selectedOpts.map((o) => (
              <span
                key={o._id}
                className="inline-flex items-center gap-1 bg-[#1a2b6b]/10 text-[#1a2b6b] text-xs font-medium px-2 py-0.5 rounded"
              >
                {o.name}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(o._id);
                  }}
                />
              </span>
            ))
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg py-1">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">No options</p>
          ) : (
            options.map((o) => {
              const checked = selected.includes(o._id);
              return (
                <button
                  type="button"
                  key={o._id}
                  onClick={() => toggle(o._id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      checked
                        ? "bg-[#1a2b6b] border-[#1a2b6b]"
                        : "border-gray-300"
                    }`}
                  >
                    {checked && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="flex-1 text-gray-700">{o.name}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Specifications Tab ───────────────────────────────────────────────────────
function SpecificationsTab({
  rows,
  setRows,
}: {
  rows: string[][];
  setRows: React.Dispatch<React.SetStateAction<string[][]>>;
}) {
  const cols = rows[0]?.length ?? 1;
  const addRow = () =>
    setRows((prev) => [...prev, Array(prev[0]?.length ?? 1).fill("")]);
  const addCol = () => setRows((prev) => prev.map((r) => [...r, ""]));
  const delRow = (ri: number) => {
    if (rows.length > 1) setRows((prev) => prev.filter((_, i) => i !== ri));
  };
  const delCol = (ci: number) => {
    if (cols > 1)
      setRows((prev) => prev.map((r) => r.filter((_, i) => i !== ci)));
  };
  const update = (ri: number, ci: number, v: string) =>
    setRows((prev) => {
      const n = prev.map((r) => [...r]);
      n[ri][ci] = v;
      return n;
    });

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={addRow}
          className="h-8 px-4 border border-[#1a2b6b] text-[#1a2b6b] rounded text-xs font-bold tracking-wide hover:bg-[#1a2b6b]/5 transition-colors"
        >
          ADD ROW
        </button>
        <button
          type="button"
          onClick={addCol}
          className="h-8 px-4 border border-[#1a2b6b] text-[#1a2b6b] rounded text-xs font-bold tracking-wide hover:bg-[#1a2b6b]/5 transition-colors"
        >
          ADD COLUMN
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {Array.from({ length: cols }, (_, ci) => (
                <th key={ci} className="px-3 py-2 text-center min-w-[160px]">
                  <button
                    type="button"
                    onClick={() => delCol(ci)}
                    className="text-gray-400 hover:text-red-500 transition-colors mx-auto block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-2">
                    <input
                      value={cell}
                      onChange={(e) => update(ri, ci, e.target.value)}
                      placeholder="Search Here"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1a2b6b] focus:ring-1 focus:ring-[#1a2b6b]/20"
                    />
                  </td>
                ))}
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => delRow(ri)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── eBay Category Picker ─────────────────────────────────────────────────────
function EbayCategoryPicker({
  token,
  value,
  valuePath,
  onChange,
}: {
  token: string;
  value: string;
  valuePath: { id: string; name: string }[];
  onChange: (id: string, path: { id: string; name: string }[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rootCats, setRootCats] = useState<EbayCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  // browsePath holds the drill-down stack — each entry is a node we navigated into
  const [browsePath, setBrowsePath] = useState<EbayCategory[]>([]);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch categories once on first open
  useEffect(() => {
    if (!open || rootCats.length > 0) return;
    setLoadingCats(true);
    fetch(`${API_BASE}/ebay/categories`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => {
        // Handle: array of roots | { data: [...] } | single root with children
        const list: EbayCategory[] = Array.isArray(d)
          ? d
          : Array.isArray(d?.data)
            ? d.data
            : (d?.data?.categories ?? d?.categories ?? []);
        setRootCats(list);
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, [open, token, rootCats.length]);

  // Reset browse state every time dialog opens
  useEffect(() => {
    if (open) {
      setBrowsePath([]);
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open]);

  const currentNode = browsePath[browsePath.length - 1] ?? null;

  // Items to show at current level
  const currentItems: EbayCategory[] = currentNode
    ? (currentNode.children ?? [])
    : rootCats;

  // Filter by search query
  const filteredItems = search
    ? currentItems.filter((c) =>
        c.categoryName.toLowerCase().includes(search.toLowerCase()),
      )
    : currentItems;

  const isLeaf = (cat: EbayCategory) =>
    !cat.children || cat.children.length === 0;

  const handleDrillDown = (cat: EbayCategory) => {
    if (isLeaf(cat)) {
      handleSelect(cat);
    } else {
      setBrowsePath((p) => [...p, cat]);
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  };

  const handleSelect = (cat: EbayCategory) => {
    const path = [...browsePath, cat].map((c) => ({
      id: c.categoryId,
      name: c.categoryName,
    }));
    onChange(cat.categoryId, path);
    setOpen(false);
  };

  const handleBreadcrumb = (idx: number) => {
    setBrowsePath((p) => (idx < 0 ? [] : p.slice(0, idx + 1)));
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const depth = browsePath.length;
  const levelLabel =
    depth === 0
      ? "L1 \u2014 TOP LEVEL"
      : depth === 1
        ? "L2 \u2014 SUB CATEGORIES"
        : `L${depth + 1} \u2014 LEAF CATEGORIES`;

  const displayName =
    value && valuePath.length > 0 ? valuePath[valuePath.length - 1].name : "";

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-between whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
      >
        <span className={displayName ? "text-gray-900" : "text-gray-400"}>
          {displayName || "Select eBay category..."}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {/* Selected path breadcrumb chips */}
      {valuePath.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mt-2">
          {valuePath.map((p, i) => (
            <>
              {i > 0 && (
                <ChevronRight
                  className="h-3 w-3 text-gray-400 shrink-0"
                  key={`arr-${p.id}`}
                />
              )}
              <span
                key={p.id}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  i === valuePath.length - 1
                    ? "bg-[#1a2b6b] text-white"
                    : "bg-[#1a2b6b]/10 text-[#1a2b6b]"
                }`}
              >
                {p.name}
              </span>
            </>
          ))}
          <button
            type="button"
            onClick={() => onChange("", [])}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                Select eBay Category
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Breadcrumb navigation */}
            <div className="px-6 pt-4 pb-0 flex items-center gap-1 flex-wrap shrink-0 min-h-[32px]">
              <button
                type="button"
                onClick={() => handleBreadcrumb(-1)}
                className={`text-sm font-medium px-1 py-0.5 rounded transition-colors ${
                  depth === 0
                    ? "text-gray-900 font-semibold pointer-events-none"
                    : "text-[#1a2b6b] hover:underline"
                }`}
              >
                All Categories
              </button>
              {browsePath.map((b, i) => (
                <>
                  <ChevronRight
                    key={`sep-${b.categoryId}`}
                    className="h-3.5 w-3.5 text-gray-300 shrink-0"
                  />
                  <button
                    key={b.categoryId}
                    type="button"
                    onClick={() => handleBreadcrumb(i)}
                    className={`text-sm font-medium px-1 py-0.5 rounded transition-colors ${
                      i === depth - 1
                        ? "text-gray-900 font-semibold pointer-events-none"
                        : "text-[#1a2b6b] hover:underline"
                    }`}
                  >
                    {b.categoryName}
                  </button>
                </>
              ))}
            </div>

            {/* Search */}
            <div className="px-6 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    currentNode
                      ? `Search in "${currentNode.categoryName}"...`
                      : "Search L1 categories..."
                  }
                  className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white"
                />
              </div>
            </div>

            {/* Level label */}
            <div className="px-6 pb-1 shrink-0">
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                {levelLabel}
              </p>
            </div>

            {/* Category list */}
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {loadingCats ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">
                  No categories found.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredItems.map((cat) => {
                    const leaf = isLeaf(cat);
                    const count = cat.children?.length ?? 0;
                    return (
                      <div
                        key={cat.categoryId}
                        onClick={() => handleDrillDown(cat)}
                        className="flex items-center justify-between py-3 px-3 -mx-1 rounded-lg hover:bg-[#1a2b6b]/5 cursor-pointer group transition-colors"
                      >
                        <span className="text-sm text-gray-700 font-medium select-none">
                          {cat.categoryName}
                        </span>
                        {leaf ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(cat);
                            }}
                            className="text-xs font-semibold text-[#1a2b6b] px-2.5 py-1 rounded-md hover:bg-[#1a2b6b]/10 transition-colors shrink-0"
                          >
                            Select
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400 group-hover:text-[#1a2b6b] transition-colors shrink-0">
                            <span className="text-xs font-semibold">
                              {count}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const seoRef = useRef<SeoTabHandle>(null);

  // ── Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingPub, setSavingPub] = useState(false);

  // ── API data
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [packageTypes, setPackageTypes] = useState<string[]>([]);
  const [dimensionUnits, setDimensionUnits] = useState<string[]>([]);
  const [paymentPolicies, setPaymentPolicies] = useState<EbayPolicy[]>([]);
  const [returnPolicies, setReturnPolicies] = useState<EbayPolicy[]>([]);
  const [fulfillmentPolicies, setFulfillmentPolicies] = useState<EbayPolicy[]>(
    [],
  );

  // ── Form state
  const [form, setForm] = useState({
    name: "",
    skuCode: "",
    offerPrice: "",
    barcode: "",
    ebayCategoryId: "",
    ebayEPID: "",
    ebayPackageType: "",
    ebayDimensionUnit: "",
    ebayLength: "",
    ebayWidth: "",
    ebayHeight: "",
    ebayName: "",
    ebayPrice: "",
    ebayPaymentPolicyId: "",
    ebayReturnPolicyId: "",
    ebayFulfillmentPolicyId: "",
    price: "",
    supplierId: "",
    weight: "",
    quantity: "",
    freeShipping: "",
    displayPicAltText: "",
    imagesAltText: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageMetadata, setImageMetadata] = useState<{ title: string; altText: string; description: string }[]>([]);
  const [displayImageIdx, setDisplayImageIdx] = useState(0);
  const [attachIdx, setAttachIdx] = useState<number | null>(null);
  const [attachForm, setAttachForm] = useState({ title: "", altText: "", description: "" });

  // ── Tab content
  const [activeTab, setActiveTab] = useState<
    | "description"
    | "specifications"
    | "reviews"
    | "related"
    | "accessories"
    | "ebayDescription"
    | "seo"
  >("description");
  const [description, setDescription] = useState("");
  const [ebayDescription, setEbayDescription] = useState("");
  const [specRows, setSpecRows] = useState<string[][]>([[""]]);
  const [selectedRelated, setSelectedRelated] = useState<string[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [ebayCategoryPath, setEbayCategoryPath] = useState<
    { id: string; name: string }[]
  >([]);

  // ── Category multi-selections (L1 → L2 → L3)
  const [cat1Ids, setCat1Ids] = useState<string[]>([]);
  const [cat2Ids, setCat2Ids] = useState<string[]>([]);
  const [cat3Ids, setCat3Ids] = useState<string[]>([]);

  // ── Derived category options (L2 depends on selected L1, L3 on selected L2)
  const cat1Options = categories.filter((c) => c.level === 1 && c.isActive);
  const cat2Options = categories.filter(
    (c) =>
      c.level === 2 &&
      c.isActive &&
      c.parent?._id &&
      cat1Ids.includes(c.parent._id),
  );
  const cat3Options = categories.filter(
    (c) =>
      c.level === 3 &&
      c.isActive &&
      c.parent?._id &&
      cat2Ids.includes(c.parent._id),
  );

  // Changing higher levels prunes now-invalid lower selections
  const handleCat1Change = (ids: string[]) => {
    setCat1Ids(ids);
    const validCat2 = new Set(
      categories
        .filter((c) => c.level === 2 && c.parent && ids.includes(c.parent._id))
        .map((c) => c._id),
    );
    const nextCat2 = cat2Ids.filter((id) => validCat2.has(id));
    setCat2Ids(nextCat2);
    const validCat3 = new Set(
      categories
        .filter(
          (c) => c.level === 3 && c.parent && nextCat2.includes(c.parent._id),
        )
        .map((c) => c._id),
    );
    setCat3Ids((prev) => prev.filter((id) => validCat3.has(id)));
  };

  const handleCat2Change = (ids: string[]) => {
    setCat2Ids(ids);
    const validCat3 = new Set(
      categories
        .filter((c) => c.level === 3 && c.parent && ids.includes(c.parent._id))
        .map((c) => c._id),
    );
    setCat3Ids((prev) => prev.filter((id) => validCat3.has(id)));
  };

  // ── Set field helper
  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Load initial data
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/product/categories`, {
        headers: authHeaders(token),
      }).then((r) => r.json()),
      fetch(`${API_BASE}/supplier`, { headers: authHeaders(token) }).then((r) =>
        r.json(),
      ),
      fetch(`${API_BASE}/ebay/config?packageTypes=1&dimensionUnits=1`, {
        headers: authHeaders(token),
      }).then((r) => r.json()),
      fetch(`${API_BASE}/ebay/policies`, { headers: authHeaders(token) }).then(
        (r) => r.json(),
      ),
    ])
      .then(([catRes, suppRes, configRes, policiesRes]) => {
        setCategories(catRes.data?.list ?? []);
        setSuppliers((suppRes.data ?? []).filter((s: Supplier) => s.isActive));
        setPackageTypes(configRes.data?.packageTypes ?? []);
        setDimensionUnits(configRes.data?.dimensionUnits ?? []);
        setPaymentPolicies(policiesRes.data?.paymentPolicies ?? []);
        setReturnPolicies(policiesRes.data?.returnPolicies ?? []);
        setFulfillmentPolicies(policiesRes.data?.fulfillmentPolicies ?? []);
      })
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load form data.",
          variant: "destructive",
        }),
      )
      .finally(() => setPageLoading(false));
  }, [router, toast]);

  // ── Image upload (collect files locally, preview with object URLs)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;
    const previewUrls = files.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...previewUrls]);
    setImageMetadata((prev) => [
      ...prev,
      ...files.map((f) => ({
        title: f.name.replace(/\.[^/.]+$/, ""),
        altText: "",
        description: "",
      })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Validation
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product Name is required";
    if (!form.offerPrice || isNaN(Number(form.offerPrice)))
      e.offerPrice = "Offer Price is required";
    if (!form.skuCode.trim()) e.skuCode = "SKU Code is required";
    if (!form.price || isNaN(Number(form.price))) e.price = "Price is required";
    if (!form.weight || isNaN(Number(form.weight)))
      e.weight = "Weight is required";
    if (!form.supplierId) e.supplierId = "Supplier is required";
    if (cat1Ids.length === 0) e.cat1Ids = "Category 1L is required";
    if (imageFiles.length === 0)
      e.displayImage = "At least one image is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Form validity (for button disable)
  const isFormValid =
    form.name.trim() !== "" &&
    form.offerPrice !== "" &&
    !isNaN(Number(form.offerPrice)) &&
    form.skuCode.trim() !== "" &&
    form.price !== "" &&
    !isNaN(Number(form.price)) &&
    form.supplierId !== "" &&
    form.weight !== "" &&
    !isNaN(Number(form.weight)) &&
    cat1Ids.length > 0 &&
    imageFiles.length > 0;

  // ── Build multipart/form-data payload
  const buildFormData = (status: "draft" | "active") => {
    const fd = new FormData();
    const specifications = specRows
      .map((row) => {
        const key = (row[0] ?? "").trim();
        const values = row
          .slice(1)
          .map((value, ci) => ({
            column: `column-${ci + 1}`,
            value: (value ?? "").trim(),
          }))
          .filter((item) => item.value !== "");
        return key ? { key, values } : null;
      })
      .filter(
        (
          item,
        ): item is {
          key: string;
          values: { column: string; value: string }[];
        } => !!item,
      );

    fd.append("name", form.name);
    fd.append("description", description);
    fd.append("weight", form.weight);
    fd.append("price", form.price);
    if (form.quantity) fd.append("quantity", form.quantity);
    fd.append("categories", cat3Ids.join(","));
    fd.append("supplier", form.supplierId);
    fd.append("skuCode", form.skuCode);
    fd.append("offerPrice", form.offerPrice);
    fd.append("barcode", form.barcode);
    fd.append("ebayCategoryId", form.ebayCategoryId);
    fd.append("ebayEpid", form.ebayEPID);
    fd.append("ebayPackageType", form.ebayPackageType);
    fd.append("dimensionUnits", form.ebayDimensionUnit);
    fd.append("length", form.ebayLength);
    fd.append("width", form.ebayWidth);
    fd.append("height", form.ebayHeight);
    fd.append("ebayName", form.ebayName);
    fd.append("ebayDescription", ebayDescription);
    fd.append("ebayPrice", form.ebayPrice);
    fd.append("ebayPaymentPolicyId", form.ebayPaymentPolicyId);
    fd.append("ebayReturnPolicyId", form.ebayReturnPolicyId);
    fd.append("ebayShippingPolicyId", form.ebayFulfillmentPolicyId);
    fd.append("tags", "");
    if (form.displayPicAltText.trim())
      fd.append("displayPicAltText", form.displayPicAltText.trim());
    if (form.imagesAltText.trim())
      fd.append("imagesAltText", form.imagesAltText.trim());
    fd.append("hasFreeShipping", form.freeShipping || "false");
    fd.append("isActive", status === "active" ? "true" : "false");
    // Display picture
    const displayFile = imageFiles[displayImageIdx];
    if (displayFile) fd.append("displayPic", displayFile, displayFile.name);
    // Additional images
    imageFiles.forEach((file, i) => {
      if (i !== displayImageIdx) fd.append("images", file, file.name);
    });
    // Accessories & related — sent as comma-separated strings
    fd.append("accessories", selectedAccessories.join(","));
    fd.append("relatedProducts", selectedRelated.join(","));
    fd.append("specifications", JSON.stringify(specifications));
    return fd;
  };

  // ── Save
  const handleSave = async (status: "draft" | "active") => {
    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields.",
        variant: "destructive",
      });
      return;
    }
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    const setter = status === "draft" ? setSavingDraft : setSavingPub;
    setter(true);
    try {
      const res = await fetch(`${API_BASE}/product`, {
        method: "POST",
        headers: authHeaders(token),
        body: buildFormData(status),
      });
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to save product");
      }
      toast({
        title: "Success",
        description: `Product ${status === "draft" ? "saved as draft" : "published"} successfully.`,
        variant: "success" as any,
      });
      await seoRef.current?.triggerSave();
      router.push("/dashboard/products");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setter(false);
    }
  };

  const token = getToken() ?? "";

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a2b6b]" />
      </div>
    );
  }

  const TABS = [
    { key: "description", label: "Description" },
    { key: "specifications", label: "Specifications" },
    { key: "reviews", label: "Reviews" },
    { key: "related", label: "Related Products" },
    { key: "accessories", label: "Accessories" },
    { key: "ebayDescription", label: "eBay Description" },
    { key: "seo", label: "SEO" },
  ] as const;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/dashboard/products"
            className="font-semibold text-[#1a2b6b] hover:underline"
          >
            Products
          </Link>
          <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
          <span className="text-gray-700 font-medium">Add Product</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/products"
            className="h-9 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center"
          >
            Cancel
          </Link>
          <button
            onClick={() => handleSave("draft")}
            disabled={savingDraft || savingPub || !isFormValid}
            className="h-9 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingDraft && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save as Draft
          </button>
          <button
            onClick={() => handleSave("active")}
            disabled={savingDraft || savingPub || !isFormValid}
            className="h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingPub && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save to Pub
          </button>
        </div>
      </div>

      {/* Main Content: Image + Form */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image Upload */}
        <div className="flex-shrink-0 w-full lg:w-56 space-y-3">
          {/* Main preview */}
          <div className="w-full aspect-square border-2 border-[#1a2b6b]/30 rounded-xl overflow-hidden bg-gray-50 relative">
            {imagePreviews.length > 0 ? (
              <img
                src={imagePreviews[displayImageIdx] ?? imagePreviews[0]}
                alt="Main preview"
                className="w-full h-full object-contain p-3"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a2b6b]/5 transition-colors"
              >
                <Plus className="h-10 w-10 text-gray-400" />
                <p className="text-xs text-gray-400 mt-2">Click to upload</p>
              </div>
            )}
          </div>

          {/* All Images thumbnails */}
          {imagePreviews.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                All Images ({imagePreviews.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((preview, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setDisplayImageIdx(i);
                      setAttachForm(imageMetadata[i] ?? { title: imageFiles[i]?.name.replace(/\.[^/.]+$/, "") ?? "", altText: "", description: "" });
                      setAttachIdx(i);
                    }}
                    className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden cursor-pointer transition-colors ${
                      i === displayImageIdx
                        ? "border-[#1a2b6b]"
                        : "border-gray-200 hover:border-[#1a2b6b]/50"
                    }`}
                  >
                    <img
                      src={preview}
                      alt={`img-${i + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                    {i === displayImageIdx && (
                      <span className="absolute top-0.5 left-0.5 bg-green-500 text-white text-[9px] font-bold px-1 rounded leading-tight">
                        MAIN
                      </span>
                    )}
                    <span className="absolute bottom-0.5 left-0.5 bg-black/50 text-white text-[9px] px-1 rounded leading-tight">
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        URL.revokeObjectURL(imagePreviews[i]);
                        setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
                        setImagePreviews((prev) => {
                          const next = prev.filter((_, idx) => idx !== i);
                          if (displayImageIdx >= next.length)
                            setDisplayImageIdx(Math.max(0, next.length - 1));
                          return next;
                        });
                        setImageMetadata((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="h-2.5 w-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {/* Add more */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1a2b6b]/50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Form Fields — Product details (left) / eBay listing (right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-6">
          {/* ── Product Details column ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1a2b6b] border-b border-gray-100 pb-2">
              Product Details
            </h3>

            <Field label="Product Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? inputErrCls : inputCls}
              />
            </Field>
            <Field label="SKU code" required error={errors.skuCode}>
              <input
                value={form.skuCode}
                onChange={(e) => set("skuCode", e.target.value)}
                placeholder="Enter SKU code"
                className={errors.skuCode ? inputErrCls : inputCls}
              />
            </Field>
            <Field label="Offer Price" required error={errors.offerPrice}>
              <input
                value={form.offerPrice}
                onChange={(e) => set("offerPrice", e.target.value)}
                placeholder="Enter offer price"
                type="number"
                min="0"
                step="0.01"
                className={
                  errors.offerPrice ? numberInputErrCls : numberInputCls
                }
              />
            </Field>
            <Field label="Price" required error={errors.price}>
              <input
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="Enter price (e.g. 199.99)"
                type="number"
                min="0"
                step="0.01"
                className={errors.price ? numberInputErrCls : numberInputCls}
              />
            </Field>
            <Field label="Weight" required error={errors.weight}>
              <input
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
                placeholder="Enter weight (e.g. 1.5)"
                type="number"
                min="0"
                step="0.01"
                className={errors.weight ? numberInputErrCls : numberInputCls}
              />
            </Field>
            <Field label="Quantity">
              <input
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="Enter quantity (integer)"
                type="number"
                min="0"
                step="1"
                className={numberInputCls}
              />
            </Field>
            <Field label="Select Supplier" required error={errors.supplierId}>
              <Select
                value={form.supplierId || undefined}
                onValueChange={(v) => set("supplierId", v)}
              >
                <SelectTrigger
                  className={`w-full h-10 text-sm focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] ${
                    errors.supplierId ? "border-red-400" : "border-gray-300"
                  }`}
                >
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Free Shipping">
              <Select
                value={form.freeShipping || undefined}
                onValueChange={(v) => set("freeShipping", v)}
              >
                <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Barcode">
              <input
                value={form.barcode}
                onChange={(e) => set("barcode", e.target.value)}
                placeholder="Enter barcode (optional)"
                className={inputCls}
              />
            </Field>
            <Field label="Category 1L" required error={errors.cat1Ids}>
              <MultiSelect
                options={cat1Options}
                selected={cat1Ids}
                onChange={handleCat1Change}
                placeholder="Select categories..."
                error={!!errors.cat1Ids}
              />
            </Field>
            <Field label="Category 2L">
              <MultiSelect
                options={cat2Options}
                selected={cat2Ids}
                onChange={handleCat2Change}
                placeholder="Select categories..."
                disabled={cat1Ids.length === 0 || cat2Options.length === 0}
              />
            </Field>
            <Field label="Category 3L">
              <MultiSelect
                options={cat3Options}
                selected={cat3Ids}
                onChange={setCat3Ids}
                placeholder="Select categories..."
                disabled={cat2Ids.length === 0 || cat3Options.length === 0}
              />
            </Field>
            {/* <Field label="Display Pic Alt Text">
              <input
                value={form.displayPicAltText}
                onChange={(e) => set("displayPicAltText", e.target.value)}
                placeholder="Enter display picture alt text"
                className={inputCls}
              />
            </Field>
            <Field label="Images Alt Text">
              <input
                value={form.imagesAltText}
                onChange={(e) => set("imagesAltText", e.target.value)}
                placeholder="Enter gallery images alt text"
                className={inputCls}
              />
            </Field> */}
            <Field label="Display Picture" required error={errors.displayImage}>
              <Select
                value={
                  imageFiles.length === 0 ? undefined : String(displayImageIdx)
                }
                onValueChange={(v) => setDisplayImageIdx(Number(v))}
                disabled={imageFiles.length === 0}
              >
                <SelectTrigger
                  className={`w-full h-10 text-sm focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] disabled:opacity-50 ${
                    errors.displayImage ? "border-red-400" : "border-gray-300"
                  }`}
                >
                  <SelectValue placeholder="Upload an image first..." />
                </SelectTrigger>
                <SelectContent>
                  {imageFiles.map((file, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Image {i + 1} ({file.name.substring(0, 20)})
                      {i === displayImageIdx ? " (Main)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* ── eBay Listing column ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1a2b6b] border-b border-gray-100 pb-2">
              eBay Listing
            </h3>

            <Field label="eBay Category">
              <EbayCategoryPicker
                token={token!}
                value={form.ebayCategoryId}
                valuePath={ebayCategoryPath}
                onChange={(id, path) => {
                  set("ebayCategoryId", id);
                  setEbayCategoryPath(path);
                }}
              />
            </Field>
            <Field label="eBay EPID">
              <input
                value={form.ebayEPID}
                onChange={(e) => set("ebayEPID", e.target.value)}
                placeholder="Enter eBay EPID (optional)"
                className={inputCls}
              />
            </Field>
            <Field label="eBay Package Type">
              <Select
                value={form.ebayPackageType || undefined}
                onValueChange={(v) => set("ebayPackageType", v)}
              >
                <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]">
                  <SelectValue placeholder="Select package type..." />
                </SelectTrigger>
                <SelectContent>
                  {packageTypes.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="eBay Dimension Units">
              <Select
                value={form.ebayDimensionUnit || undefined}
                onValueChange={(v) => set("ebayDimensionUnit", v)}
              >
                <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]">
                  <SelectValue placeholder="Select dimension unit..." />
                </SelectTrigger>
                <SelectContent>
                  {dimensionUnits.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="eBay Length">
              <input
                value={form.ebayLength}
                onChange={(e) => set("ebayLength", e.target.value)}
                placeholder="Length"
                type="number"
                min="0"
                step="0.01"
                className={numberInputCls}
              />
            </Field>
            <Field label="eBay Width">
              <input
                value={form.ebayWidth}
                onChange={(e) => set("ebayWidth", e.target.value)}
                placeholder="Width"
                type="number"
                min="0"
                step="0.01"
                className={numberInputCls}
              />
            </Field>
            <Field label="eBay Height">
              <input
                value={form.ebayHeight}
                onChange={(e) => set("ebayHeight", e.target.value)}
                placeholder="Height"
                type="number"
                min="0"
                step="0.01"
                className={numberInputCls}
              />
            </Field>
            <Field label="eBay Name">
              <input
                value={form.ebayName}
                onChange={(e) => set("ebayName", e.target.value)}
                placeholder="eBay listing title"
                className={inputCls}
              />
            </Field>
            <Field label="eBay Price">
              <input
                value={form.ebayPrice}
                onChange={(e) => set("ebayPrice", e.target.value)}
                placeholder="eBay listing price"
                type="number"
                min="0"
                step="0.01"
                className={numberInputCls}
              />
            </Field>
            <Field label="eBay Payment Policy">
              <Select
                value={form.ebayPaymentPolicyId || undefined}
                onValueChange={(v) => set("ebayPaymentPolicyId", v)}
              >
                <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]">
                  <SelectValue placeholder="Select payment policy..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentPolicies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="eBay Return Policy">
              <Select
                value={form.ebayReturnPolicyId || undefined}
                onValueChange={(v) => set("ebayReturnPolicyId", v)}
              >
                <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]">
                  <SelectValue placeholder="Select return policy..." />
                </SelectTrigger>
                <SelectContent>
                  {returnPolicies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="eBay Shipping Policy">
              <Select
                value={form.ebayFulfillmentPolicyId || undefined}
                onValueChange={(v) => set("ebayFulfillmentPolicyId", v)}
              >
                <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]">
                  <SelectValue placeholder="Select shipping policy..." />
                </SelectTrigger>
                <SelectContent>
                  {fulfillmentPolicies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === t.key
                  ? "bg-[#1a2b6b] text-white border-[#1a2b6b]"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === "description" && (
            <RichTextEditor
              onChange={setDescription}
              placeholder="Enter product description..."
            />
          )}
          {activeTab === "specifications" && (
            <SpecificationsTab rows={specRows} setRows={setSpecRows} />
          )}
          {activeTab === "reviews" && (
            <p className="text-center text-sm text-gray-400 py-8">
              Reviews will be available once the product is created.
            </p>
          )}
          {activeTab === "related" && (
            <ProductSearchTab
              token={token}
              selected={selectedRelated}
              onToggle={(id) =>
                setSelectedRelated((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id],
                )
              }
            />
          )}
          {activeTab === "accessories" && (
            <ProductSearchTab
              token={token}
              selected={selectedAccessories}
              onToggle={(id) =>
                setSelectedAccessories((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id],
                )
              }
            />
          )}
          {activeTab === "ebayDescription" && (
            <RichTextEditor
              onChange={setEbayDescription}
              placeholder="Enter eBay description..."
            />
          )}
          {activeTab === "seo" && (
            <SeoTab
              ref={seoRef}
              productName={form.name}
              image={imagePreviews[displayImageIdx]}
            />
          )}
        </div>
      </div>
    </motion.div>

    {/* Attachment Details Modal */}
    {attachIdx !== null && imagePreviews[attachIdx] && (
      <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) setAttachIdx(null); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)" }} />
          <DialogPrimitive.Content
            onEscapeKeyDown={() => setAttachIdx(null)}
            onInteractOutside={() => setAttachIdx(null)}
            style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: "calc(100vw - 32px)", maxWidth: "768px", maxHeight: "80vh", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "12px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Attachment details</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {attachIdx === displayImageIdx ? (
                  <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", fontWeight: 500 }}>✓ Main Image</span>
                ) : (
                  <button type="button" onClick={() => setDisplayImageIdx(attachIdx)} style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "8px", border: "1px solid #1a2b6b", color: "#1a2b6b", background: "transparent", cursor: "pointer", fontWeight: 500 }}>Set as Main</button>
                )}
              </div>
            </div>
            {/* Body */}
            <div style={{ display: "flex", overflow: "hidden", maxHeight: "calc(80vh - 112px)" }}>
              {/* Left — image */}
              <div style={{ width: "42%", flexShrink: 0, backgroundColor: "#f5f6f8", borderRight: "1px solid #f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", gap: "8px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreviews[attachIdx]} alt={attachForm.altText || `Image ${attachIdx + 1}`} style={{ maxWidth: "100%", maxHeight: "42vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                <p style={{ fontSize: "10px", color: "#9ca3af", textAlign: "center", wordBreak: "break-all", lineHeight: 1.5, width: "100%" }}>{imageFiles[attachIdx]?.name ?? ""}</p>
              </div>
              {/* Right — fields + footer */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
                <div style={{ overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Alternative Text</label>
                    <input type="text" value={attachForm.altText} onChange={(e) => setAttachForm((f) => ({ ...f, altText: e.target.value }))} placeholder="Describe the image…" style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: "#1f2937", outline: "none", boxSizing: "border-box" }} />
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>Leave empty if purely decorative.</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</label>
                    <input type="text" value={attachForm.title} onChange={(e) => setAttachForm((f) => ({ ...f, title: e.target.value }))} placeholder="Image title…" style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: "#1f2937", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
                    <textarea value={attachForm.description} onChange={(e) => setAttachForm((f) => ({ ...f, description: e.target.value }))} placeholder="Add a caption or longer description…" rows={2} style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: "#1f2937", outline: "none", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>File Name</label>
                    <div style={{ padding: "8px 12px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "11px", color: "#6b7280", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imageFiles[attachIdx]?.name ?? ""}</div>
                  </div>
                </div>
                {/* Footer */}
                <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: "1px solid #f3f4f6", backgroundColor: "#fff", display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setAttachIdx(null)} style={{ flex: 1, height: "36px", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "14px", fontWeight: 500, color: "#4b5563", backgroundColor: "#fff", cursor: "pointer" }}>Cancel</button>
                  <button type="button" onClick={() => { setImageMetadata((prev) => { const next = [...prev]; next[attachIdx] = { ...attachForm }; return next; }); setAttachIdx(null); }} style={{ flex: 1, height: "36px", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#fff", backgroundColor: "#1a2b6b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>Save Details</button>
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )}
    </>
  );
}
