"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Save,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

// --- Tabs ---

const ALL_TABS = [
  { id: "about", label: "About Us", policy: "About Us" },
  { id: "privacy", label: "Privacy Policy", policy: "Privacy Policy" },
  {
    id: "terms",
    label: "Terms and Conditions",
    policy: "Terms and Conditions",
  },
  { id: "orders", label: "Orders and Returns", policy: "Orders and Returns" },
  { id: "address", label: "Address", policy: "Address" },
  { id: "invoice", label: "Invoice Address", policy: "Invoice Address" },
  { id: "spare", label: "Spare Parts", policy: null },
  { id: "bestsellers", label: "Best Sellers", policy: null },
  { id: "recommended", label: "Recommended Products", policy: null },
];

const EDITOR_IDS = new Set([
  "about",
  "privacy",
  "terms",
  "orders",
  "address",
  "invoice",
]);

// --- Types ---

interface PolicyRecord {
  _id: string;
  name: string;
  content: string;
  insertedAt: number;
}

interface SparePart {
  _id: string;
  name: string;
  url: string;
  insertedAt?: number;
  updatedAt?: number;
}

interface ProductRecord {
  _id: string;
  name: string;
  displayPic: string;
  price: number;
  offerPrice: number;
  rating: number;
  ratingsCount: number;
  isActive: boolean;
  recommended: boolean;
  bestSelling: boolean;
  qtySold: number;
}

// --- Toolbar Button ---

function ToolbarButton({
  onClick,
  title,
  children,
  active,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800",
        active && "bg-blue-50 text-blue-700",
      )}
    >
      {children}
    </button>
  );
}

// --- Rich Text Editor ---

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const exec = useCallback(
    (command: string, arg?: string) => {
      document.execCommand(command, false, arg);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    },
    [onChange],
  );

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 p-2">
        <select
          onChange={(e) => exec("formatBlock", e.target.value)}
          className="text-xs rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-500 hover:bg-gray-50 transition-colors outline-none mr-2"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <ToolbarButton onClick={() => exec("bold")} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")} title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton
          onClick={() => exec("insertUnorderedList")}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton onClick={() => exec("justifyLeft")} title="Align Left">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec("justifyCenter")}
          title="Align Center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyRight")} title="Align Right">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyFull")} title="Justify">
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          title="Insert Link"
        >
          <Link className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = window.prompt("Enter image URL:");
            if (url) exec("insertImage", url);
          }}
          title="Insert Image"
        >
          <Image className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec("formatBlock", "pre")}
          title="Code Block"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-blue-600 [&_a]:underline [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_strong]:font-bold"
      />
    </div>
  );
}

// --- Product Card ---

function ProductCard({
  product,
  selected,
  onToggle,
}: {
  product: ProductRecord;
  selected: boolean;
  onToggle: () => void;
}) {
  const stars = Math.round(product.rating);
  return (
    <div
      onClick={onToggle}
      className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${selected ? "border-[#1a2b6b] shadow-sm" : "border-gray-200"}`}
    >
      <div className="absolute top-3 left-3 z-10">
        <div
          className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${selected ? "bg-[#1a2b6b] border-[#1a2b6b]" : "bg-white border-gray-400"}`}
        >
          {selected && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
        {product.displayPic ? (
          <img
            src={product.displayPic}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">IMG</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-white">
        <div className="flex items-center gap-0.5 mb-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg
              key={s}
              className={`w-3 h-3 ${s <= stars ? "text-amber-400" : "text-gray-300"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-1">
          Reviews ({product.ratingsCount})
        </p>
        <p className="text-xs font-bold text-gray-900 leading-tight mb-2 line-clamp-3">
          {product.name}
        </p>
        <p className="text-xs text-gray-400 line-through">
          $ {product.price.toFixed(2)}
        </p>
        <p className="text-sm font-bold text-gray-900">
          $ {product.offerPrice.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// --- Modal ---

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-[#1a2b6b]">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// --- Pagination ---

function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPage,
  onPerPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 font-medium">Show</span>
        <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5">
          {[25, 50, 100].map((n) => (
            <button
              key={n}
              onClick={() => {
                onPerPage(n);
                onPage(1);
              }}
              className={`px-3 h-7 rounded-lg text-xs font-semibold transition-all ${n === perPage ? "bg-[#1a2b6b] text-white shadow-sm" : "text-gray-500 hover:text-[#1a2b6b] hover:bg-white"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-1">
          {from}&#x2013;{to} of {total}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-gray-600">
          {page} / {totalPages || 1}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function FooterOptionsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("about");

  // Auth
  const getToken = useCallback(() => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
      return null;
    }
    return token;
  }, [router]);

  const authHeaders = useCallback(
    (token: string) => ({
      authorization: `Bearer ${token}`,
      "x-app-client": "ADMIN_PANEL",
      accept: "application/json",
    }),
    [],
  );

  // Policy state
  const [policyCache, setPolicyCache] = useState<Record<string, PolicyRecord>>(
    {},
  );
  const [policyContent, setPolicyContent] = useState<Record<string, string>>(
    {},
  );
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);

  // Spare parts state
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [spareLoading, setSpareLoading] = useState(false);
  const [spareOpen, setSpareOpen] = useState(false);
  const [editingSpare, setEditingSpare] = useState<SparePart | null>(null);
  const [spareForm, setSpareForm] = useState({ name: "", url: "" });
  const [spareSaving, setSpareSaving] = useState(false);
  const [deleteSpare, setDeleteSpare] = useState<SparePart | null>(null);
  const [deleteSpareLoading, setDeleteSpareLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productPerPage, setProductPerPage] = useState(25);
  const [productTotal, setProductTotal] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [productsSaving, setProductsSaving] = useState(false);
  const [productsSaved, setProductsSaved] = useState(false);

  // Load policy
  const loadPolicy = useCallback(
    async (tabId: string) => {
      const tab = ALL_TABS.find((t) => t.id === tabId);
      if (!tab?.policy) return;
      if (policyCache[tabId]) {
        setPolicyContent((c) => ({
          ...c,
          [tabId]: policyCache[tabId].content,
        }));
        return;
      }
      const token = getToken();
      if (!token) return;
      setPolicyLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/terms-policies?policies=${encodeURIComponent(tab.policy)}`,
          {
            headers: authHeaders(token),
          },
        );
        if (res.status === 401) {
          sessionStorage.clear();
          router.push("/");
          return;
        }
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const json = await res.json();
        if (!json.status) throw new Error(json.message);
        const record: PolicyRecord = json.data[0];
        if (record) {
          setPolicyCache((c) => ({ ...c, [tabId]: record }));
          setPolicyContent((c) => ({ ...c, [tabId]: record.content }));
        }
      } catch (err: unknown) {
        toast({
          title: "Failed to load content",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setPolicyLoading(false);
      }
    },
    [policyCache, getToken, authHeaders, toast, router],
  );

  // Load spare parts
  const loadSpareParts = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setSpareLoading(true);
    try {
      const res = await fetch(`${API_BASE}/spare-parts`, {
        headers: authHeaders(token),
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message);
      setSpareParts(json.data);
    } catch (err: unknown) {
      toast({
        title: "Failed to load spare parts",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSpareLoading(false);
    }
  }, [getToken, authHeaders, toast, router]);

  // Load products
  const loadProducts = useCallback(
    async (tabId: string, pg: number, pgSize: number, search: string) => {
      const token = getToken();
      if (!token) return;
      const sort = tabId === "recommended" ? "RATING_DESC" : "SALES_DESC";
      setProductsLoading(true);
      try {
        const params = new URLSearchParams({
          includeInactive: "1",
          sort,
          pageNo: String(pg),
          pageSize: String(pgSize),
        });
        if (search) params.set("search", search);
        const res = await fetch(`${API_BASE}/product/all?${params}`, {
          headers: authHeaders(token),
        });
        if (res.status === 401) {
          sessionStorage.clear();
          router.push("/");
          return;
        }
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const json = await res.json();
        if (!json.status) throw new Error(json.message);
        const prods: ProductRecord[] = json.data.records.products ?? [];
        setProducts(prods);
        setProductTotal(json.data.totalRecords);
        setProductTotalPages(json.data.totalPages || 1);
        const flag = tabId === "recommended" ? "recommended" : "bestSelling";
        setSelectedIds(new Set(prods.filter((p) => p[flag]).map((p) => p._id)));
      } catch (err: unknown) {
        toast({
          title: "Failed to load products",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setProductsLoading(false);
      }
    },
    [getToken, authHeaders, toast, router],
  );

  // Tab change effect
  useEffect(() => {
    if (EDITOR_IDS.has(activeTab)) {
      loadPolicy(activeTab);
    } else if (activeTab === "spare") {
      loadSpareParts();
    } else if (activeTab === "bestsellers" || activeTab === "recommended") {
      setProductPage(1);
      setProductSearch("");
      setDebouncedProductSearch("");
      setSelectedIds(new Set());
      loadProducts(activeTab, 1, productPerPage, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Debounce product search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
      setProductPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [productSearch]);

  // Reload on page/perPage/search
  useEffect(() => {
    if (activeTab === "bestsellers" || activeTab === "recommended") {
      loadProducts(
        activeTab,
        productPage,
        productPerPage,
        debouncedProductSearch,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productPage, productPerPage, debouncedProductSearch]);

  // Save policy
  const handlePolicySave = async () => {
    const tab = ALL_TABS.find((t) => t.id === activeTab);
    if (!tab?.policy) return;
    const token = getToken();
    if (!token) return;
    setPolicySaving(true);
    try {
      const body = {
        name: tab.policy!,
        content: policyContent[activeTab] ?? "",
      };
      const res = await fetch(`${API_BASE}/terms-policies`, {
        method: "PUT",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Save failed");
      setPolicyCache((c) => ({
        ...c,
        [activeTab]: {
          ...(c[activeTab] ?? { _id: "", name: tab.policy!, insertedAt: 0 }),
          content: policyContent[activeTab] ?? "",
        },
      }));
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 2500);
      toast({
        title: "Content saved",
        description: `${tab.label} updated successfully.`,
      });
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPolicySaving(false);
    }
  };

  // Spare save
  const handleSaveSpare = async () => {
    if (!spareForm.name.trim() || !spareForm.url.trim()) return;
    const token = getToken();
    if (!token) return;
    setSpareSaving(true);
    try {
      const body = editingSpare
        ? JSON.stringify({
            sparepartId: editingSpare._id,
            name: spareForm.name,
            url: spareForm.url,
          })
        : JSON.stringify({ name: spareForm.name, url: spareForm.url });
      const res = await fetch(`${API_BASE}/spare-parts`, {
        method: editingSpare ? "PATCH" : "POST",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body,
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Save failed");
      setSpareOpen(false);
      toast({
        title: editingSpare ? "Spare part updated" : "Spare part added",
      });
      loadSpareParts();
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSpareSaving(false);
    }
  };

  // Spare delete
  const handleDeleteSpare = async () => {
    if (!deleteSpare) return;
    const token = getToken();
    if (!token) return;
    setDeleteSpareLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/spare-parts?sparepartId=${deleteSpare._id}`,
        {
          method: "DELETE",
          headers: authHeaders(token),
        },
      );
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Delete failed");
      setSpareParts((p) => p.filter((x) => x._id !== deleteSpare._id));
      setDeleteSpare(null);
      toast({ title: "Spare part deleted" });
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteSpareLoading(false);
    }
  };

  // Save product selections
  const handleSaveProducts = async () => {
    const token = getToken();
    if (!token) return;
    const endpoint =
      activeTab === "recommended" ? "recommended" : "best-selling";
    setProductsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/product/${endpoint}`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Save failed");
      setProductsSaved(true);
      setTimeout(() => setProductsSaved(false), 2500);
      toast({ title: "Saved", description: "Product selections updated." });
      loadProducts(
        activeTab,
        productPage,
        productPerPage,
        debouncedProductSearch,
      );
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setProductsSaving(false);
    }
  };

  // Render tab content
  const renderContent = () => {
    if (EDITOR_IDS.has(activeTab)) {
      const tab = ALL_TABS.find((t) => t.id === activeTab)!;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{tab.label}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Edit the content displayed in the {tab.label.toLowerCase()}{" "}
                section
              </p>
            </div>
            <button
              onClick={handlePolicySave}
              disabled={policySaving || policyLoading}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 ${policySaved ? "bg-green-600" : "bg-[#1a2b6b] hover:bg-[#142258]"}`}
            >
              {policySaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : policySaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Content
                </>
              )}
            </button>
          </div>
          {policyLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-[#1a2b6b]" />
            </div>
          ) : (
            <RichTextEditor
              value={policyContent[activeTab] ?? ""}
              onChange={(v) =>
                setPolicyContent((c) => ({ ...c, [activeTab]: v }))
              }
            />
          )}
        </div>
      );
    }

    if (activeTab === "spare") {
      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingSpare(null);
                setSpareForm({ name: "", url: "" });
                setSpareOpen(true);
              }}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" /> Add New +
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Spare Part Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Redirect to Page
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {spareLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b] mx-auto" />
                    </td>
                  </tr>
                ) : spareParts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      No spare parts added yet.
                    </td>
                  </tr>
                ) : (
                  spareParts.map((sp) => (
                    <tr
                      key={sp._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {sp.name}
                      </td>
                      <td className="px-4 py-3 text-[#1a2b6b] text-xs max-w-xs">
                        <a
                          href={sp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline truncate block"
                        >
                          {sp.url}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingSpare(sp);
                              setSpareForm({ name: sp.name, url: sp.url });
                              setSpareOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteSpare(sp)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === "bestsellers" || activeTab === "recommended") {
      const title =
        activeTab === "bestsellers"
          ? "Best Selling Products"
          : "Recommended Products";
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {selectedIds.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedIds.size} product{selectedIds.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
            )}
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
            />
          </div>
          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-[#1a2b6b]" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  selected={selectedIds.has(p._id)}
                  onToggle={() =>
                    setSelectedIds((ids) => {
                      const next = new Set(ids);
                      if (next.has(p._id)) next.delete(p._id);
                      else next.add(p._id);
                      return next;
                    })
                  }
                />
              ))}
            </div>
          )}
          <Pagination
            page={productPage}
            totalPages={productTotalPages}
            total={productTotal}
            perPage={productPerPage}
            onPage={setProductPage}
            onPerPage={setProductPerPage}
          />
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={handleSaveProducts}
              disabled={productsSaving}
              className={`flex items-center gap-1.5 h-10 px-6 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 ${productsSaved ? "bg-green-600" : "bg-[#1a2b6b] hover:bg-[#142258]"}`}
            >
              {productsSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : productsSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save {title}
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-4"
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex flex-wrap gap-1.5">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== activeTab) {
                  setActiveTab(tab.id);
                  setPolicySaved(false);
                  setProductsSaved(false);
                }
              }}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border rounded-lg transition-all whitespace-nowrap ${
                tab.id === activeTab
                  ? "bg-[#1a2b6b] text-white border-[#1a2b6b] shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#1a2b6b]/40 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        {renderContent()}
      </div>

      <AnimatePresence>
        {spareOpen && (
          <Modal
            title={editingSpare ? "Edit Spare Part" : "Add New Spare Part"}
            onClose={() => {
              if (!spareSaving) setSpareOpen(false);
            }}
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#1a2b6b] mb-2">
                  Spare Part Name
                </label>
                <input
                  type="text"
                  placeholder="Enter spare part name"
                  value={spareForm.name}
                  onChange={(e) =>
                    setSpareForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1a2b6b] mb-2">
                  Redirect URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={spareForm.url}
                  onChange={(e) =>
                    setSpareForm((f) => ({ ...f, url: e.target.value }))
                  }
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setSpareOpen(false)}
                disabled={spareSaving}
                className="h-9 px-5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 uppercase tracking-wide"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveSpare}
                disabled={
                  spareSaving || !spareForm.name.trim() || !spareForm.url.trim()
                }
                className="h-9 px-5 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 uppercase tracking-wide flex items-center gap-1.5"
              >
                {spareSaving && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                SAVE
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteSpare && (
          <Modal
            title="Delete Spare Part"
            onClose={() => {
              if (!deleteSpareLoading) setDeleteSpare(null);
            }}
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  &ldquo;{deleteSpare.name}&rdquo;
                </span>
                ?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteSpare(null)}
                  disabled={deleteSpareLoading}
                  className="h-9 px-5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSpare}
                  disabled={deleteSpareLoading}
                  className="h-9 px-5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleteSpareLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
