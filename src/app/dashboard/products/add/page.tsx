"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, X, Loader2, Search, Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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
interface ProductItem {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  images?: string[];
  thumbnail?: string;
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
            const url = window.prompt("Enter image URL:");
            if (url) exec("insertImage", url);
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
  const img = product.images?.[0] || product.thumbnail;
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
        <div className="flex items-center gap-0.5 mb-1">
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
          <span className="text-xs text-gray-400 ml-1">Reviews (0)</span>
        </div>
        <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">
          {product.name}
        </h4>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-1">
            {product.description.replace(/<[^>]+>/g, "")}
          </p>
        )}
        {product.price != null && (
          <p className="text-sm font-bold text-gray-800">
            $ {product.price.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Product Search Tab ───────────────────────────────────────────────────────
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
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      setLoading(true);
      fetch(
        `${API_BASE}/product?search=${encodeURIComponent(q)}&page=1&limit=20`,
        { headers: authHeaders(token) },
      )
        .then((r) => r.json())
        .then((d) => setProducts(d.data?.products ?? d.data ?? []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    },
    [token],
  );

  useEffect(() => {
    search("");
  }, [search]);

  const handleSearch = (v: string) => {
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 400);
  };

  return (
    <div>
      <div className="relative mb-4 w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b]"
        />
      </div>
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
    </div>
  );
}

// ─── Input helpers ────────────────────────────────────────────────────────────
const inputCls =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white";
const inputErrCls =
  "w-full h-10 px-3 border border-red-400 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200 transition-colors bg-white";
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingPub, setSavingPub] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [displayImageIdx, setDisplayImageIdx] = useState(0);

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
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);

  // ── Derived category levels (flat list filtered by level + parent)
  const cat1Options = categories.filter((c) => c.level === 1 && c.isActive);
  const cat2Options = categories.filter(
    (c) => c.level === 2 && c.isActive && c.parent?._id === form.cat1Id,
  );
  const cat3Options = categories.filter(
    (c) => c.level === 3 && c.isActive && c.parent?._id === form.cat2Id,
  );

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

  // ── Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
        },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      const url: string = data.data?.url ?? data.data ?? data.url ?? "";
      if (url) setImages((prev) => [...prev, url]);
      else throw new Error("No image URL in response");
    } catch {
      toast({
        title: "Upload Failed",
        description: "Could not upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
    if (images.length === 0) e.displayImage = "At least one image is required";
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
    form.cat1Id !== "" &&
    images.length > 0;

  // ── Build payload
  const buildPayload = (status: "draft" | "active") => ({
    name: form.name,
    skuCode: form.skuCode,
    ...(form.offerPrice && { offerPrice: parseFloat(form.offerPrice) }),
    ...(form.barcode && { barcode: form.barcode }),
    price: parseFloat(form.price),
    weight: parseFloat(form.weight),
    supplierId: form.supplierId,
    ...(form.quantity && { quantity: parseInt(form.quantity) }),
    ...(form.freeShipping && { freeShipping: form.freeShipping === "true" }),
    ...(form.cat1Id && { category1Id: form.cat1Id }),
    ...(form.cat2Id && { category2Id: form.cat2Id }),
    ...(form.cat3Id && { category3Id: form.cat3Id }),
    categoryId: form.cat3Id || form.cat2Id || form.cat1Id,
    ...(form.ebayEPID && { ebayEPID: form.ebayEPID }),
    ...(form.ebayPackageType && { ebayPackageType: form.ebayPackageType }),
    ...(form.ebayDimensionUnit && {
      ebayDimensionUnit: form.ebayDimensionUnit,
    }),
    ...(form.ebayLength && { ebayLength: parseFloat(form.ebayLength) }),
    ...(form.ebayWidth && { ebayWidth: parseFloat(form.ebayWidth) }),
    ...(form.ebayHeight && { ebayHeight: parseFloat(form.ebayHeight) }),
    ...(form.ebayName && { ebayName: form.ebayName }),
    ...(form.ebayPrice && { ebayPrice: parseFloat(form.ebayPrice) }),
    ...(form.ebayPaymentPolicyId && {
      ebayPaymentPolicyId: form.ebayPaymentPolicyId,
    }),
    ...(form.ebayReturnPolicyId && {
      ebayReturnPolicyId: form.ebayReturnPolicyId,
    }),
    ...(form.ebayFulfillmentPolicyId && {
      ebayFulfillmentPolicyId: form.ebayFulfillmentPolicyId,
    }),
    images,
    displayImage: images[displayImageIdx] ?? images[0] ?? "",
    description,
    ebayDescription,
    specifications: specRows,
    relatedProducts: selectedRelated,
    accessories: selectedAccessories,
    reviews: selectedReviews,
    status,
  });

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
        headers: jsonHeaders(token),
        body: JSON.stringify(buildPayload(status)),
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
  ] as const;

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
            {images.length > 0 ? (
              <img
                src={images[displayImageIdx] ?? images[0]}
                alt="Main preview"
                className="w-full h-full object-contain p-3"
              />
            ) : uploadingImg ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
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
          {images.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                All Images ({images.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setDisplayImageIdx(i)}
                    className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden cursor-pointer transition-colors ${
                      i === displayImageIdx
                        ? "border-[#1a2b6b]"
                        : "border-gray-200 hover:border-[#1a2b6b]/50"
                    }`}
                  >
                    <img
                      src={img}
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
                        setImages((prev) => {
                          const next = prev.filter((_, idx) => idx !== i);
                          if (displayImageIdx >= next.length)
                            setDisplayImageIdx(Math.max(0, next.length - 1));
                          return next;
                        });
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="h-2.5 w-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {/* Add more */}
                <div
                  onClick={() => !uploadingImg && fileInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1a2b6b]/50 transition-colors"
                >
                  {uploadingImg ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Plus className="h-5 w-5 text-gray-400" />
                  )}
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
              className={errors.offerPrice ? inputErrCls : inputCls}
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
          <Field label="eBay EPID">
            <input
              value={form.ebayEPID}
              onChange={(e) => set("ebayEPID", e.target.value)}
              placeholder="Enter eBay EPID (optional)"
              className={inputCls}
            />
          </Field>
          <Field label="eBay Package Type">
            <div className="relative">
              <select
                value={form.ebayPackageType}
                onChange={(e) => set("ebayPackageType", e.target.value)}
                className={selectCls}
              >
                <option value=""></option>
                {packageTypes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* Row 4 */}
          <Field label="eBay Dimension Units">
            <div className="relative">
              <select
                value={form.ebayDimensionUnit}
                onChange={(e) => set("ebayDimensionUnit", e.target.value)}
                className={selectCls}
              >
                <option value=""></option>
                {dimensionUnits.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="eBay Length">
            <input
              value={form.ebayLength}
              onChange={(e) => set("ebayLength", e.target.value)}
              placeholder="Length"
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
            />
          </Field>

          {/* Row 5 */}
          <Field label="eBay Width">
            <input
              value={form.ebayWidth}
              onChange={(e) => set("ebayWidth", e.target.value)}
              placeholder="Width"
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
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
              className={inputCls}
            />
          </Field>

          {/* Row 6 */}
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
              className={inputCls}
            />
          </Field>

          {/* Row 7 */}
          <Field label="eBay Payment Policy">
            <div className="relative">
              <select
                value={form.ebayPaymentPolicyId}
                onChange={(e) => set("ebayPaymentPolicyId", e.target.value)}
                className={selectCls}
              >
                <option value="">Select payment policy...</option>
                {paymentPolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="eBay Return Policy">
            <div className="relative">
              <select
                value={form.ebayReturnPolicyId}
                onChange={(e) => set("ebayReturnPolicyId", e.target.value)}
                className={selectCls}
              >
                <option value="">Select return policy...</option>
                {returnPolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* Row 8 */}
          <Field label="eBay Shipping Policy">
            <div className="relative">
              <select
                value={form.ebayFulfillmentPolicyId}
                onChange={(e) => set("ebayFulfillmentPolicyId", e.target.value)}
                className={selectCls}
              >
                <option value="">Select shipping policy...</option>
                {fulfillmentPolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="Price" required error={errors.price}>
            <input
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="Enter price (e.g. 199.99)"
              type="number"
              min="0"
              step="0.01"
              className={errors.price ? inputErrCls : inputCls}
            />
          </Field>

          {/* Row 9 */}
          <Field label="Select Supplier" required error={errors.supplierId}>
            <div className="relative">
              <select
                value={form.supplierId}
                onChange={(e) => set("supplierId", e.target.value)}
                className={
                  errors.supplierId
                    ? `${inputErrCls} cursor-pointer appearance-none`
                    : `${selectCls}`
                }
              >
                <option value=""></option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="Weight" required error={errors.weight}>
            <input
              value={form.weight}
              onChange={(e) => set("weight", e.target.value)}
              placeholder="Enter weight (e.g. 1.5)"
              type="number"
              min="0"
              step="0.01"
              className={errors.weight ? inputErrCls : inputCls}
            />
          </Field>

          {/* Row 10 */}
          <Field label="Quantity">
            <input
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              placeholder="Enter quantity (integer)"
              type="number"
              min="0"
              step="1"
              className={inputCls}
            />
          </Field>
          <Field label="Free Shipping">
            <div className="relative">
              <select
                value={form.freeShipping}
                onChange={(e) => set("freeShipping", e.target.value)}
                className={selectCls}
              >
                <option value=""></option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* Row 11 — Category 1L + 2L */}
          <Field label="Category 1L" required error={errors.cat1Id}>
            <div className="relative">
              <select
                value={form.cat1Id}
                onChange={(e) => {
                  set("cat1Id", e.target.value);
                  set("cat2Id", "");
                  set("cat3Id", "");
                }}
                className={
                  errors.cat1Id
                    ? `${inputErrCls} cursor-pointer appearance-none`
                    : selectCls
                }
              >
                <option value=""></option>
                {cat1Options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="Category 2L">
            <div className="relative">
              <select
                value={form.cat2Id}
                onChange={(e) => {
                  set("cat2Id", e.target.value);
                  set("cat3Id", "");
                }}
                disabled={!form.cat1Id || cat2Options.length === 0}
                className={`${selectCls} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value=""></option>
                {cat2Options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* Row 12 — Category 3L + Display Picture */}
          <Field label="Category 3L">
            <div className="relative">
              <select
                value={form.cat3Id}
                onChange={(e) => set("cat3Id", e.target.value)}
                disabled={!form.cat2Id || cat3Options.length === 0}
                className={`${selectCls} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value=""></option>
                {cat3Options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="Display Picture" required error={errors.displayImage}>
            <div className="relative">
              <select
                value={displayImageIdx}
                onChange={(e) => setDisplayImageIdx(Number(e.target.value))}
                disabled={images.length === 0}
                className={`${
                  errors.displayImage ? inputErrCls : selectCls
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {images.length === 0 ? (
                  <option value="">Upload an image first...</option>
                ) : (
                  images.map((img, i) => {
                    const filename =
                      img.split("/").pop()?.substring(0, 18) ??
                      `Image ${i + 1}`;
                    return (
                      <option key={i} value={i}>
                        Image {i + 1} ({filename}...)
                        {i === displayImageIdx ? " (Current)" : ""}
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>
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
            <ProductSearchTab
              token={token}
              selected={selectedReviews}
              onToggle={(id) =>
                setSelectedReviews((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id],
                )
              }
            />
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
        </div>
      </div>
    </motion.div>
  );
}
