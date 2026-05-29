"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, X, Loader2, Search, Trash2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

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
  rating?: number;
  ratingsCount?: number;
  images?: string[];
  displayPic?: string;
  category?: { _id: string; name: string };
  supplier?: { _id: string; name: string };
  isActive?: boolean;
  publishedToEbay?: boolean;
}

interface Rating {
  _id: string;
  rating: number;
  review?: string;
  user?: { name?: string; email?: string };
  insertedAt?: number;
}

interface ImageSlot {
  url: string;
  file?: File;
  isExisting: boolean;
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichTextEditor({
  onChange,
  placeholder,
  initialValue,
}: {
  onChange: (html: string) => void;
  placeholder?: string;
  initialValue?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initialSet = useRef(false);

  useEffect(() => {
    if (initialValue && ref.current && !initialSet.current) {
      ref.current.innerHTML = initialValue;
      initialSet.current = true;
    }
  }, [initialValue]);

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
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[160px] p-4 text-sm text-gray-700 outline-none [&:empty]:before:content-[attr(data-ph)] [&:empty]:before:text-gray-400"
        data-ph={placeholder ?? "Enter content here..."}
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
      />
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  selected,
  onToggle,
}: {
  product: ProductItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const img = product.displayPic || product.images?.[0];
  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer border-2 rounded-xl overflow-hidden transition-all ${selected ? "border-[#1a2b6b] shadow-md" : "border-gray-200 hover:border-gray-300"}`}
    >
      <div className="absolute top-2 left-2 z-10">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected ? "bg-[#1a2b6b] border-[#1a2b6b]" : "bg-white border-gray-300"}`}
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
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded" />
        )}
      </div>
      <div className="p-3 bg-white border-t border-gray-100">
        {product.skuCode && (
          <p className="text-[10px] text-gray-400 mb-0.5">{product.skuCode}</p>
        )}
        <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">
          {product.name}
        </h4>
        {product.supplier && (
          <p className="text-[10px] text-gray-500 mb-1">
            {product.supplier.name}
          </p>
        )}
        {product.offerPrice != null ? (
          <p className="text-sm font-bold text-gray-800">
            $ {product.offerPrice.toFixed(2)}
          </p>
        ) : product.price != null ? (
          <p className="text-sm font-bold text-gray-800">
            $ {product.price.toFixed(2)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Reviews Tab ─────────────────────────────────────────────────────────────
interface Rating {
  _id: string;
  rating: number;
  review?: string;
  user?: { name?: string; email?: string };
  insertedAt?: number;
}

function ReviewsTab({
  token,
  productId,
}: {
  token: string;
  productId: string;
}) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId || !token) return;
    setLoading(true);
    fetch(`${API_BASE}/product/ratings?productId=${productId}`, {
      headers: authHeaders(token),
    })
      .then((r) => r.json())
      .then((d) => {
        const raw = d?.data?.ratings ?? d?.data ?? [];
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.ratings)
          ? raw.ratings
          : [];
        setRatings(list);
      })
      .catch(() => setRatings([]))
      .finally(() => setLoading(false));
  }, [productId, token]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-8">
        No reviews yet for this product.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {ratings.map((r) => (
        <div
          key={r._id}
          className="border border-gray-200 rounded-xl p-4 bg-white"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {r.user?.name ?? r.user?.email ?? "Anonymous"}
              </p>
              {r.user?.email && r.user?.name && (
                <p className="text-xs text-gray-400">{r.user.email}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`w-4 h-4 ${s <= r.rating ? "text-amber-400" : "text-gray-200"}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
              <span className="text-xs text-gray-500 ml-1">{r.rating}/5</span>
            </div>
          </div>
          {r.review && <p className="text-sm text-gray-700">{r.review}</p>}
          {r.insertedAt && (
            <p className="text-xs text-gray-400 mt-2">
              {new Date(r.insertedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Product List Tab (Related Products / Accessories) ────────────────────────
const PAGE_SIZE = 25;

function ProductListTab({
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
      {/* Search */}
      <div className="relative mb-4 w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]"
        />
      </div>

      {/* Selected count */}
      {selected.length > 0 && (
        <p className="text-xs text-[#1a2b6b] font-medium mb-3">
          {selected.length} product(s) selected
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
        </div>
      ) : (
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
            <p className="col-span-5 text-center text-sm text-gray-400 py-8">
              No products found.
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            &ndash;
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
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || loading}
              className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
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
  const [browsePath, setBrowsePath] = useState<EbayCategory[]>([]);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || rootCats.length > 0) return;
    setLoadingCats(true);
    fetch(`${API_BASE}/ebay/categories`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => {
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

  useEffect(() => {
    if (open) {
      setBrowsePath([]);
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open]);

  const currentNode = browsePath[browsePath.length - 1] ?? null;
  const currentItems: EbayCategory[] = currentNode ? (currentNode.children ?? []) : rootCats;
  const filteredItems = search
    ? currentItems.filter((c) => c.categoryName.toLowerCase().includes(search.toLowerCase()))
    : currentItems;
  const isLeaf = (cat: EbayCategory) => !cat.children || cat.children.length === 0;

  const handleDrillDown = (cat: EbayCategory) => {
    if (isLeaf(cat)) handleSelect(cat);
    else {
      setBrowsePath((p) => [...p, cat]);
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  };
  const handleSelect = (cat: EbayCategory) => {
    const path = [...browsePath, cat].map((c) => ({ id: c.categoryId, name: c.categoryName }));
    onChange(cat.categoryId, path);
    setOpen(false);
  };
  const handleBreadcrumb = (idx: number) => {
    setBrowsePath((p) => (idx < 0 ? [] : p.slice(0, idx + 1)));
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const depth = browsePath.length;
  const levelLabel = depth === 0 ? "L1 \u2014 TOP LEVEL" : depth === 1 ? "L2 \u2014 SUB CATEGORIES" : `L${depth + 1} \u2014 LEAF CATEGORIES`;
  const displayName = value && valuePath.length > 0 ? valuePath[valuePath.length - 1].name : "";

  return (
    <>
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
      {valuePath.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mt-2">
          {valuePath.map((p, i) => (
            <>
              {i > 0 && <ChevronRight key={`arr-${p.id}`} className="h-3 w-3 text-gray-400 shrink-0" />}
              <span key={p.id} className={`text-xs px-2.5 py-1 rounded-full font-medium ${ i === valuePath.length - 1 ? "bg-[#1a2b6b] text-white" : "bg-[#1a2b6b]/10 text-[#1a2b6b]" }`}>{p.name}</span>
            </>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-semibold text-gray-900">Select eBay Category</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 pt-4 pb-0 flex items-center gap-1 flex-wrap shrink-0 min-h-[32px]">
              <button type="button" onClick={() => handleBreadcrumb(-1)} className={`text-sm font-medium px-1 py-0.5 rounded transition-colors ${ depth === 0 ? "text-gray-900 font-semibold pointer-events-none" : "text-[#1a2b6b] hover:underline" }`}>All Categories</button>
              {browsePath.map((b, i) => (
                <>
                  <ChevronRight key={`sep-${b.categoryId}`} className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  <button key={b.categoryId} type="button" onClick={() => handleBreadcrumb(i)} className={`text-sm font-medium px-1 py-0.5 rounded transition-colors ${ i === depth - 1 ? "text-gray-900 font-semibold pointer-events-none" : "text-[#1a2b6b] hover:underline" }`}>{b.categoryName}</button>
                </>
              ))}
            </div>
            <div className="px-6 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={currentNode ? `Search in "${currentNode.categoryName}"...` : "Search L1 categories..."} className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white" />
              </div>
            </div>
            <div className="px-6 pb-1 shrink-0">
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{levelLabel}</p>
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {loadingCats ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" /></div>
              ) : filteredItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No categories found.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredItems.map((cat) => {
                    const leaf = isLeaf(cat);
                    const count = cat.children?.length ?? 0;
                    return (
                      <div key={cat.categoryId} onClick={() => handleDrillDown(cat)} className="flex items-center justify-between py-3 px-3 -mx-1 rounded-lg hover:bg-[#1a2b6b]/5 cursor-pointer group transition-colors">
                        <span className="text-sm text-gray-700 font-medium select-none">{cat.categoryName}</span>
                        {leaf ? (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleSelect(cat); }} className="text-xs font-semibold text-[#1a2b6b] px-2.5 py-1 rounded-md hover:bg-[#1a2b6b]/10 transition-colors shrink-0">Select</button>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400 group-hover:text-[#1a2b6b] transition-colors shrink-0">
                            <span className="text-xs font-semibold">{count}</span>
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
                      placeholder="Value"
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

// ─── Main Edit Page ───────────────────────────────────────────────────────────
export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingPub, setSavingPub] = useState(false);
  const [addingToEbay, setAddingToEbay] = useState(false);
  const [removingFromEbay, setRemovingFromEbay] = useState(false);

  // ── eBay status
  const [isEbayListed, setIsEbayListed] = useState(false);

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
    cat1Id: "",
    cat2Id: "",
    cat3Id: "",
    displayPicAltText: "",
    imagesAltText: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Images: unified list of existing URLs + new file uploads
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);

  // ── Tab content
  const [activeTab, setActiveTab] = useState<
    | "description"
    | "specifications"
    | "reviews"
    | "related"
    | "accessories"
    | "ebayDescription"
  >("description");
  const [description, setDescription] = useState("");
  const [ebayDescription, setEbayDescription] = useState("");
  const [specRows, setSpecRows] = useState<string[][]>([[""]]);
  const [selectedRelated, setSelectedRelated] = useState<string[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [ebayCategoryPath, setEbayCategoryPath] = useState<{ id: string; name: string }[]>([]);

  // ── Derived category options
  const cat1Options = categories.filter((c) => c.level === 1 && c.isActive);
  const cat2Options = categories.filter(
    (c) => c.level === 2 && c.isActive && c.parent?._id === form.cat1Id,
  );
  const cat3Options = categories.filter(
    (c) => c.level === 3 && c.isActive && c.parent?._id === form.cat2Id,
  );

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Load product + supporting data
  useEffect(() => {
    if (!productId) return;
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/product?productId=${productId}`, {
        headers: authHeaders(token),
      }).then((r) => r.json()),
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
      fetch(`${API_BASE}/ebay/categories`, { headers: authHeaders(token) }).then(
        (r) => r.json(),
      ),
    ])
      .then(([productRes, catRes, suppRes, configRes, policiesRes, ebayCatsRes]) => {
        // Populate supporting data
        const allCats: Category[] = catRes.data?.list ?? [];
        setCategories(allCats);
        setSuppliers((suppRes.data ?? []).filter((s: Supplier) => s.isActive));
        setPackageTypes(configRes.data?.packageTypes ?? []);
        setDimensionUnits(configRes.data?.dimensionUnits ?? []);
        setPaymentPolicies(policiesRes.data?.paymentPolicies ?? []);
        setReturnPolicies(policiesRes.data?.returnPolicies ?? []);
        setFulfillmentPolicies(policiesRes.data?.fulfillmentPolicies ?? []);

        // Product data (handle both { data: {...} } and direct object)
        const p = productRes.data ?? productRes;

        // eBay status
        setIsEbayListed(!!(p.publishedToEbay || p.isEbayListed || p.ebayItemId));

        // Build images array: displayPic first (index 0), then other images
        const slots: ImageSlot[] = [];
        if (p.displayPic) slots.push({ url: p.displayPic, isExisting: true });
        const otherImages: string[] = (p.images ?? []).filter(
          (u: string) => u !== p.displayPic,
        );
        otherImages.forEach((url: string) =>
          slots.push({ url, isExisting: true }),
        );
        setImages(slots);
        setDisplayIdx(0);

        // Description & eBay description
        setDescription(p.description ?? "");
        setEbayDescription(p.ebayDescription ?? "");

        // Specifications
        if (Array.isArray(p.specifications) && p.specifications.length > 0) {
          setSpecRows(p.specifications);
        }

        // Related/accessories/reviews
        setSelectedRelated(
          (p.relatedProducts ?? []).map((x: any) =>
            typeof x === "string" ? x : x._id,
          ),
        );
        setSelectedAccessories(
          (p.accessories ?? []).map((x: any) =>
            typeof x === "string" ? x : x._id,
          ),
        );

        // Resolve category L1 / L2 / L3 from deepest category stored on product
        let cat1 = "",
          cat2 = "",
          cat3 = "";
        // API returns categories[] array; use deepest (last) entry
        const productCats: any[] = Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []);
        const productCatRaw = productCats[productCats.length - 1];
        const productCatId: string = productCatRaw?._id ?? (typeof productCatRaw === "string" ? productCatRaw : "");
        if (productCatId) {
          const cat = allCats.find((c) => c._id === productCatId);
          if (cat) {
            if (cat.level === 1) {
              cat1 = cat._id;
            } else if (cat.level === 2) {
              cat2 = cat._id;
              cat1 = cat.parent?._id ?? "";
            } else if (cat.level === 3) {
              cat3 = cat._id;
              cat2 = cat.parent?._id ?? "";
              const parent2 = allCats.find((c) => c._id === cat2);
              cat1 = parent2?.parent?._id ?? "";
            }
          }
        }

        setForm({
          name: p.name ?? "",
          skuCode: p.skuCode ?? "",
          offerPrice: p.offerPrice != null ? String(p.offerPrice) : "",
          barcode: p.barcode ?? "",
          ebayCategoryId: p.ebayCategoryId ?? "",
          ebayEPID: p.ebayEpid ?? p.ebayEPID ?? "",
          ebayPackageType: p.ebayPackageType ?? "",
          ebayDimensionUnit: p.dimensionUnits ?? p.ebayDimensionUnits ?? "",
          ebayLength: p.length != null ? String(p.length) : "",
          ebayWidth: p.width != null ? String(p.width) : "",
          ebayHeight: p.height != null ? String(p.height) : "",
          ebayName: p.ebayName ?? "",
          ebayPrice: p.ebayPrice != null ? String(p.ebayPrice) : "",
          ebayPaymentPolicyId: p.ebayPaymentPolicyId ?? "",
          ebayReturnPolicyId: p.ebayReturnPolicyId ?? "",
          ebayFulfillmentPolicyId:
            p.ebayShippingPolicyId ?? p.ebayFulfillmentPolicyId ?? "",
          price: p.price != null ? String(p.price) : "",
          supplierId:
            p.supplier?._id ??
            (typeof p.supplier === "string" ? p.supplier : ""),
          weight: p.weight != null ? String(p.weight) : "",
          quantity: p.quantity != null ? String(p.quantity) : "",
          freeShipping:
            p.hasFreeShipping != null ? String(p.hasFreeShipping) : "",
          cat1Id: cat1,
          cat2Id: cat2,
          cat3Id: cat3,
          displayPicAltText: p.displayPicAltText ?? "",
          imagesAltText: Array.isArray(p.imagesAltText)
            ? (p.imagesAltText[0] ?? "")
            : (p.imagesAltText ?? ""),
        });
        // Resolve eBay category path with real names from the tree
        if (p.ebayCategoryId) {
          const ebayCatTree: EbayCategory[] = Array.isArray(ebayCatsRes)
            ? ebayCatsRes
            : Array.isArray(ebayCatsRes?.data)
            ? ebayCatsRes.data
            : (ebayCatsRes?.data?.categories ?? ebayCatsRes?.categories ?? []);
          const targetId = String(p.ebayCategoryId);
          const findPath = (
            nodes: EbayCategory[],
            ancestors: { id: string; name: string }[],
          ): { id: string; name: string }[] | null => {
            for (const node of nodes) {
              const current = [...ancestors, { id: node.categoryId, name: node.categoryName }];
              if (node.categoryId === targetId) return current;
              if (node.children && node.children.length > 0) {
                const found = findPath(node.children, current);
                if (found) return found;
              }
            }
            return null;
          };
          const resolvedPath = findPath(ebayCatTree, []);
          setEbayCategoryPath(
            resolvedPath ?? [{ id: targetId, name: targetId }],
          );
        }
      })
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load product data.",
          variant: "destructive",
        }),
      )
      .finally(() => setPageLoading(false));
  }, [productId, router, toast]);

  // ── Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => [
      ...prev,
      { url: previewUrl, file, isExisting: false },
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Remove an image slot
  const removeImage = (idx: number) => {
    const slot = images[idx];
    if (slot.isExisting) {
      setRemovedUrls((prev) => [...prev, slot.url]);
    } else {
      URL.revokeObjectURL(slot.url);
    }
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (displayIdx >= next.length)
        setDisplayIdx(Math.max(0, next.length - 1));
      return next;
    });
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
    if (!form.cat1Id) e.cat1Id = "Category 1L is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Build FormData for PATCH
  const buildFormData = (status: "draft" | "active") => {
    const fd = new FormData();
    fd.append("productId", productId);
    fd.append("name", form.name);
    fd.append("description", description);
    fd.append("weight", form.weight);
    fd.append("price", form.price);
    if (form.quantity) fd.append("quantity", form.quantity);
    fd.append("categories", form.cat3Id || form.cat2Id || form.cat1Id);
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
    if (form.displayPicAltText.trim()) fd.append("displayPicAltText", form.displayPicAltText.trim());
    if (form.imagesAltText.trim()) fd.append("imagesAltText", form.imagesAltText.trim());
    fd.append("hasFreeShipping", form.freeShipping || "false");
    fd.append("isActive", status === "active" ? "true" : "false");

    // New display pic (only if a new file is selected as main)
    const displaySlot = images[displayIdx];
    if (displaySlot && !displaySlot.isExisting && displaySlot.file) {
      fd.append("displayPic", displaySlot.file, displaySlot.file.name);
    }

    // New additional images
    images.forEach((slot, i) => {
      if (!slot.isExisting && slot.file && i !== displayIdx) {
        fd.append("images", slot.file, slot.file.name);
      }
    });

    // Images to remove
    removedUrls.forEach((url) => fd.append("removeImages", url));

    // Accessories & related — comma-separated strings
    fd.append("accessories", selectedAccessories.join(","));
    fd.append("relatedProducts", selectedRelated.join(","));

    return fd;
  };

  // ── Save (draft / published)
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
        method: "PATCH",
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
      });
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

  // ── Add to eBay
  const handleAddToEbay = async () => {
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setAddingToEbay(true);
    try {
      const res = await fetch(`${API_BASE}/ebay/inventory`, {
        method: "POST",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to add to eBay");
      }
      setIsEbayListed(true);
      toast({ title: "Product added to eBay successfully." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAddingToEbay(false);
    }
  };

  // ── Remove from eBay
  const handleRemoveFromEbay = async () => {
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setRemovingFromEbay(true);
    try {
      const res = await fetch(
        `${API_BASE}/ebay/listing?productId=${productId}`,
        {
          method: "DELETE",
          headers: authHeaders(token),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to remove from eBay");
      }
      setIsEbayListed(false);
      toast({ title: "Product removed from eBay successfully." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setRemovingFromEbay(false);
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
  ] as const;

  const mainPreviewUrl = images[displayIdx]?.url ?? "";

  return (
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
          <span className="text-gray-700 font-medium">Edit Product</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/products"
            className="h-9 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center"
          >
            Cancel
          </Link>
          <button
            onClick={() => handleSave("draft")}
            disabled={savingDraft || savingPub}
            className="h-9 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingDraft && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save as Draft
          </button>
          <button
            onClick={handleAddToEbay}
            disabled={addingToEbay || removingFromEbay || isEbayListed}
            className="h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {addingToEbay && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Add to Ebay
          </button>
          <button
            onClick={handleRemoveFromEbay}
            disabled={addingToEbay || removingFromEbay || !isEbayListed}
            className="h-9 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removingFromEbay && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Remove from Ebay
          </button>
          <button
            onClick={() => handleSave("active")}
            disabled={savingDraft || savingPub}
            className="h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingPub && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save to Prod
          </button>
        </div>
      </div>

      {/* eBay status badge */}
      <div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isEbayListed
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-orange-50 text-orange-600 border-orange-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${isEbayListed ? "bg-green-500" : "bg-orange-400"}`}
          />
          {isEbayListed ? "Published to eBay" : "Not Published to eBay"}
        </span>
      </div>

      {/* Main Content: Image + Form */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image Upload */}
        <div className="flex-shrink-0 w-full lg:w-56 space-y-3">
          {/* Main preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square border-2 border-[#1a2b6b]/30 rounded-xl overflow-hidden bg-gray-50 relative cursor-pointer hover:border-[#1a2b6b]/60 transition-colors"
          >
            {mainPreviewUrl ? (
              <img
                src={mainPreviewUrl}
                alt="Main preview"
                className="w-full h-full object-contain p-3"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Plus className="h-10 w-10 text-gray-400" />
                <p className="text-xs text-gray-400 mt-2">Click to upload</p>
              </div>
            )}
          </div>

          {/* All Images thumbnails */}
          {images.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                All Images ({images.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {images.map((slot, i) => (
                  <div
                    key={i}
                    onClick={() => setDisplayIdx(i)}
                    className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden cursor-pointer transition-colors ${
                      i === displayIdx
                        ? "border-[#1a2b6b]"
                        : "border-gray-200 hover:border-[#1a2b6b]/50"
                    }`}
                  >
                    <img
                      src={slot.url}
                      alt={`img-${i + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                    {i === displayIdx && (
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
                        removeImage(i);
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
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Form Fields */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          {/* Row 1 */}
          <Field label="Product Name" required error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Enter product name"
              className={errors.name ? inputErrCls : inputCls}
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
              className={errors.offerPrice ? numberInputErrCls : numberInputCls}
            />
          </Field>

          {/* Row 2 */}
          <Field label="SKU code" required error={errors.skuCode}>
            <input
              value={form.skuCode}
              onChange={(e) => set("skuCode", e.target.value)}
              placeholder="Enter SKU code"
              className={errors.skuCode ? inputErrCls : inputCls}
            />
          </Field>
          <Field label="Barcode">
            <input
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
              placeholder="Enter barcode (optional)"
              className={inputCls}
            />
          </Field>

          {/* Row 3 */}
          <Field label="eBay Category">
            <EbayCategoryPicker
              token={token}
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

          {/* Row 4 */}
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
                  <SelectItem key={p} value={p}>{p}</SelectItem>
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
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Row 5 */}
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

          {/* Row 6 */}
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

          {/* Row 7 */}
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
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Row 8 */}
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
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Row 9 */}
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
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Row 10 */}
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
              placeholder="Enter quantity"
              type="number"
              min="0"
              step="1"
              className={numberInputCls}
            />
          </Field>

          {/* Row 11 */}
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

          {/* Row 12 */}
          <Field label="Category 1L" required error={errors.cat1Id}>
            <Select
              value={form.cat1Id || undefined}
              onValueChange={(v) => {
                set("cat1Id", v);
                set("cat2Id", "");
                set("cat3Id", "");
              }}
            >
              <SelectTrigger
                className={`w-full h-10 text-sm focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] ${
                  errors.cat1Id ? "border-red-400" : "border-gray-300"
                }`}
              >
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {cat1Options.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Category 2L">
            <Select
              value={form.cat2Id || undefined}
              onValueChange={(v) => {
                set("cat2Id", v);
                set("cat3Id", "");
              }}
              disabled={!form.cat1Id || cat2Options.length === 0}
            >
              <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] disabled:opacity-50">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {cat2Options.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Row 13 */}
          <Field label="Category 3L">
            <Select
              value={form.cat3Id || undefined}
              onValueChange={(v) => set("cat3Id", v)}
              disabled={!form.cat2Id || cat3Options.length === 0}
            >
              <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] disabled:opacity-50">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {cat3Options.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Display Pic Alt Text + Images Alt Text */}
          <Field label="Display Pic Alt Text">
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
          </Field>

          {/* Row 14 — Display Picture */}
          <Field label="Display Picture">
            <Select
              value={String(displayIdx)}
              onValueChange={(v) => setDisplayIdx(Number(v))}
              disabled={images.length === 0}
            >
              <SelectTrigger className="w-full h-10 text-sm border-gray-300 focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] disabled:opacity-50">
                <SelectValue placeholder="Upload an image first..." />
              </SelectTrigger>
              <SelectContent>
                {images.map((slot, i) => (
                  <SelectItem key={i} value={String(i)}>
                    Image {i + 1} ({slot.isExisting ? "existing" : "new"}){i === displayIdx ? " (Main)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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

        <div className="p-5">
          {activeTab === "description" && (
            <RichTextEditor
              onChange={setDescription}
              placeholder="Enter product description..."
              initialValue={description}
            />
          )}
          {activeTab === "specifications" && (
            <SpecificationsTab rows={specRows} setRows={setSpecRows} />
          )}
          {activeTab === "reviews" && (
            <ReviewsTab token={token} productId={productId} />
          )}
          {activeTab === "related" && (
            <ProductListTab
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
            <ProductListTab
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
              initialValue={ebayDescription}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
