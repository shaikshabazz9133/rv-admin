"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pause,
  Play,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

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

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type MainTab = "products" | "categories";
type SkuTab = "all" | "ebay" | "non-ebay";

interface ApiProduct {
  _id: string;
  name: string;
  displayPic?: string;
  images?: string[];
  skuCode?: string;
  weight?: number;
  price?: number;
  offerPrice?: number;
  isActive: boolean;
  quantity?: number;
  supplier?: { _id: string; name: string };
  category?: { _id: string; name: string };
}

interface Category {
  id: number;
  name: string;
  level: "L1" | "L2" | "L3";
  parentCategory: string;
  status: "Active" | "Paused";
  children?: Category[];
  expanded?: boolean;
}

// â”€â”€â”€ Category mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const initialCategories: Category[] = [
  {
    id: 1,
    name: "4WD ACC",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
    children: [
      {
        id: 11,
        name: "4WD Accessories",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
        expanded: false,
      },
      {
        id: 12,
        name: "4WD Awnings",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
      },
      {
        id: 13,
        name: "4WD Electrical",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
      },
      {
        id: 14,
        name: "4WD Equipments",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
      },
      {
        id: 15,
        name: "4WD Fridges",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
      },
    ],
  },
  {
    id: 2,
    name: "BOAT & MARINE",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
    children: [
      {
        id: 21,
        name: "Fishing",
        level: "L2",
        parentCategory: "BOAT & MARINE",
        status: "Active",
        expanded: false,
        children: [
          {
            id: 211,
            name: "Fishing Combos",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
          {
            id: 212,
            name: "Fishing Line",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
          {
            id: 213,
            name: "Fishing Reels",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
          {
            id: 214,
            name: "Fishing Tackle",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
          {
            id: 215,
            name: "Rod Holders",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "CAMPING RV",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
  },
  {
    id: 4,
    name: "CARAVAN RV",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
  },
  {
    id: 5,
    name: "ELECTRICAL",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
  },
  {
    id: 6,
    name: "FISHING1",
    level: "L1",
    parentCategory: "-",
    status: "Active",
  },
  { id: 7, name: "SALE", level: "L1", parentCategory: "-", status: "Active" },
  { id: 8, name: "test", level: "L1", parentCategory: "-", status: "Active" },
];

// â”€â”€â”€ Category helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function updateCategoryTree(
  cats: Category[],
  id: number,
  updater: (c: Category) => Category,
): Category[] {
  return cats.map((c) => {
    if (c.id === id) return updater(c);
    if (c.children)
      return { ...c, children: updateCategoryTree(c.children, id, updater) };
    return c;
  });
}

function deleteCategoryFromTree(cats: Category[], id: number): Category[] {
  return cats
    .filter((c) => c.id !== id)
    .map((c) =>
      c.children
        ? { ...c, children: deleteCategoryFromTree(c.children, id) }
        : c,
    );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1">{msg}</p>;
}

function validateCategory(form: {
  name: string;
  level: string;
  displayPriority: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Category name is required";
  if (!form.level) errors.level = "Category level is required";
  if (
    form.displayPriority &&
    (isNaN(Number(form.displayPriority)) || Number(form.displayPriority) < 0)
  )
    errors.displayPriority = "Enter a valid number";
  return errors;
}

// â”€â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  const visiblePages = () => {
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
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 rounded-b-xl">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 font-medium">Show</span>
        <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5">
          {PER_PAGE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => {
                onPerPage(n);
                onPage(1);
              }}
              className={`px-3 h-7 rounded-lg text-xs font-semibold transition-all ${
                n === perPage
                  ? "bg-[#1a2b6b] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#1a2b6b] hover:bg-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-1">
          {from}â€“{to} of {total}
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
        <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-0.5">
          {visiblePages().map((p, i) =>
            p === "..." ? (
              <span
                key={`dots-${i}`}
                className="w-7 text-center text-xs text-gray-400"
              >
                â€¦
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={`w-8 h-7 rounded-xl text-xs font-semibold transition-all ${
                  p === page
                    ? "bg-[#1a2b6b] text-white shadow-sm"
                    : "text-gray-500 hover:text-[#1a2b6b] hover:bg-white"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Modal Overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
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
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// â”€â”€â”€ Category Tree Rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CategoryRows({
  categories,
  depth,
  onToggle,
  onEdit,
  onDelete,
  onPause,
}: {
  categories: Category[];
  depth: number;
  onToggle: (id: number) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
  onPause: (id: number) => void;
}) {
  return (
    <>
      {categories.map((cat) => (
        <>
          <tr
            key={cat.id}
            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              cat.level === "L2"
                ? "bg-blue-50/40"
                : cat.level === "L3"
                  ? "bg-gray-50/60"
                  : ""
            }`}
          >
            <td className="px-4 py-3">
              <div
                className="flex items-center"
                style={{ paddingLeft: `${depth * 24}px` }}
              >
                {cat.children && cat.children.length > 0 ? (
                  <button
                    onClick={() => onToggle(cat.id)}
                    className="mr-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                  >
                    {cat.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="w-4 mr-2 flex-shrink-0" />
                )}
                <span className="font-medium text-gray-800 text-sm">
                  {cat.name}
                </span>
              </div>
            </td>
            <td className="px-4 py-3 text-gray-600 text-sm hidden sm:table-cell">
              {cat.level || "â€”"}
            </td>
            <td className="px-4 py-3 text-gray-600 text-sm hidden md:table-cell">
              {cat.parentCategory || "â€”"}
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
              <span
                className={`text-sm font-medium ${cat.status === "Active" ? "text-green-600" : "text-amber-500"}`}
              >
                {cat.status}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(cat)}
                  className="text-gray-400 hover:text-[#1a2b6b] transition-colors p-1"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(cat.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onPause(cat.id)}
                  className="text-gray-400 hover:text-amber-500 transition-colors p-1"
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
          {cat.expanded && cat.children && (
            <CategoryRows
              categories={cat.children}
              depth={depth + 1}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onPause={onPause}
            />
          )}
        </>
      ))}
    </>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // â”€â”€ Tab state
  const [activeTab, setActiveTab] = useState<MainTab>("products");
  const [skuTab, setSkuTab] = useState<SkuTab>("all");

  // â”€â”€ Products API state
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // â”€â”€ Modals
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // â”€â”€ Categories state (local)
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [categorySearch, setCategorySearch] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [pauseCategoryId, setPauseCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    level: "L1",
    tags: "",
    displayPriority: "0",
    image: null as string | null,
  });
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>(
    {},
  );
  const categoryImageRef = useRef<HTMLInputElement>(null);

  // â”€â”€ Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // â”€â”€ Reset page on SKU tab change
  useEffect(() => {
    setPage(1);
  }, [skuTab]);

  // â”€â”€ Fetch products
  const fetchProducts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        includeInactive: "1",
        pageNo: String(page),
        pageSize: String(perPage),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (skuTab === "ebay") params.set("ebaySkus", "1");
      if (skuTab === "non-ebay") params.set("ebaySkus", "0");

      const res = await fetch(`${API_BASE}/product/all?${params}`, {
        headers: authHeaders(token),
      });
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const json = await res.json();
      setProducts(json.data?.records?.products ?? []);
      setTotal(json.data?.totalRecords ?? 0);
      setTotalPages(json.data?.totalPages ?? 1);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, skuTab, router, toast]);

  useEffect(() => {
    if (activeTab === "products") fetchProducts();
  }, [fetchProducts, activeTab]);

  // â”€â”€ Delete product
  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setDeletingProduct(true);
    try {
      const res = await fetch(`${API_BASE}/product/${deleteProductId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Delete failed");
      }
      toast({ title: "Product deleted successfully." });
      setDeleteProductId(null);
      fetchProducts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingProduct(false);
    }
  };

  // â”€â”€ Toggle product active/pause
  const handleToggleStatus = async (product: ApiProduct) => {
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setTogglingId(product._id);
    try {
      const res = await fetch(`${API_BASE}/product/${product._id}`, {
        method: "PATCH",
        headers: jsonHeaders(token),
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Update failed");
      }
      toast({
        title: `Product ${!product.isActive ? "activated" : "paused"} successfully.`,
      });
      fetchProducts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // â”€â”€ Category helpers
  const openAddCategory = () => {
    setEditCategoryId(null);
    setCategoryForm({
      name: "",
      level: "L1",
      tags: "",
      displayPriority: "0",
      image: null,
    });
    setCategoryErrors({});
    setShowAddCategory(true);
  };
  const openEditCategory = (cat: Category) => {
    setEditCategoryId(cat.id);
    setCategoryForm({
      name: cat.name,
      level: cat.level,
      tags: "",
      displayPriority: "0",
      image: null,
    });
    setCategoryErrors({});
    setShowAddCategory(true);
  };
  const saveCategory = () => {
    const errors = validateCategory(categoryForm);
    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors);
      return;
    }
    if (editCategoryId !== null) {
      setCategories((prev) =>
        updateCategoryTree(prev, editCategoryId, (c) => ({
          ...c,
          name: categoryForm.name,
          level: categoryForm.level as "L1" | "L2" | "L3",
        })),
      );
      toast({ title: "Category updated!" });
    } else {
      setCategories((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: categoryForm.name,
          level: categoryForm.level as "L1" | "L2" | "L3",
          parentCategory: "-",
          status: "Active",
        },
      ]);
      toast({ title: "Category added!" });
    }
    setShowAddCategory(false);
  };
  const handleDeleteCategory = () => {
    if (deleteCategoryId === null) return;
    setCategories((prev) => deleteCategoryFromTree(prev, deleteCategoryId));
    setDeleteCategoryId(null);
    toast({ title: "Category deleted!" });
  };
  const handlePauseCategory = () => {
    if (pauseCategoryId === null) return;
    setCategories((prev) =>
      updateCategoryTree(prev, pauseCategoryId, (c) => ({
        ...c,
        status: "Paused",
      })),
    );
    setPauseCategoryId(null);
    toast({ title: "Category paused!" });
  };
  const handleCategoryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setCategoryForm((f) => ({ ...f, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RENDER
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 sm:p-6 space-y-4"
    >
      {/* â”€â”€ Main Tab Switcher */}
      <div className="flex">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-5 sm:px-8 py-2.5 text-sm font-medium rounded-l-md border transition-colors ${
            activeTab === "products"
              ? "bg-[#1a2b6b] text-white border-[#1a2b6b]"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-5 sm:px-8 py-2.5 text-sm font-medium rounded-r-md border-t border-r border-b transition-colors ${
            activeTab === "categories"
              ? "bg-[#1a2b6b] text-white border-[#1a2b6b]"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Categories
        </button>
      </div>

      {/* â”€â”€ Search + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 bg-white"
            placeholder={
              activeTab === "products" ? "Search products..." : "Search Here"
            }
            value={activeTab === "products" ? search : categorySearch}
            onChange={(e) =>
              activeTab === "products"
                ? setSearch(e.target.value)
                : setCategorySearch(e.target.value)
            }
          />
        </div>
        <Button
          className="bg-[#1a2b6b] hover:bg-[#142258] text-white px-6 sm:px-8 py-2.5 whitespace-nowrap"
          onClick={
            activeTab === "products"
              ? () => router.push("/dashboard/products/add")
              : openAddCategory
          }
        >
          Add New +
        </Button>
      </div>

      {/* â”€â”€ Products View */}
      {activeTab === "products" && (
        <>
          {/* SKU Filter Tabs */}
          <div className="flex gap-2">
            {(
              [
                { key: "all", label: "All SKUs" },
                { key: "ebay", label: "eBay SKUs" },
                { key: "non-ebay", label: "Non-eBay SKUs" },
              ] as { key: SkuTab; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setSkuTab(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  skuTab === t.key
                    ? "bg-[#1a2b6b] text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-700 w-16">
                      Image
                    </th>
                    <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-700">
                      Product Name
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap hidden lg:table-cell">
                      Supplier Name
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap hidden md:table-cell">
                      SKU Code
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap hidden xl:table-cell">
                      Available Quantity
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap hidden xl:table-cell">
                      Weight
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap hidden lg:table-cell">
                      Price
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap hidden xl:table-cell">
                      Offer Price
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                      Status
                    </th>
                    <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        <Loader2 className="h-7 w-7 animate-spin text-[#1a2b6b] mx-auto" />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-gray-400 text-sm"
                      >
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr
                        key={product._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 sm:px-4 py-3">
                          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {product.displayPic ? (
                              <img
                                src={product.displayPic}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gray-300 rounded" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <p className="font-medium text-gray-800 line-clamp-2 max-w-[200px] xl:max-w-xs">
                            {product.name}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-gray-600 hidden lg:table-cell">
                          {product.supplier?.name ?? "â€”"}
                        </td>
                        <td className="px-3 py-3 text-gray-600 hidden md:table-cell">
                          {product.skuCode ?? "â€”"}
                        </td>
                        <td className="px-3 py-3 text-gray-600 hidden xl:table-cell">
                          {product.quantity ?? "â€”"}
                        </td>
                        <td className="px-3 py-3 text-gray-600 hidden xl:table-cell">
                          {product.weight != null
                            ? `${product.weight} kg`
                            : "â€”"}
                        </td>
                        <td className="px-3 py-3 text-gray-800 hidden lg:table-cell">
                          {product.price != null ? `$ ${product.price}` : "â€”"}
                        </td>
                        <td className="px-3 py-3 text-gray-800 hidden xl:table-cell">
                          {product.offerPrice != null
                            ? `$ ${product.offerPrice}`
                            : "â€”"}
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span
                            className={`text-xs font-medium ${product.isActive ? "text-green-600" : "text-gray-400"}`}
                          >
                            {product.isActive ? "Active" : "Paused"}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/products/${product._id}/edit`,
                                )
                              }
                              className="text-gray-400 hover:text-[#1a2b6b] transition-colors p-1"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteProductId(product._id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(product)}
                              disabled={togglingId === product._id}
                              className="text-gray-400 hover:text-amber-500 transition-colors p-1 disabled:opacity-40"
                              title={product.isActive ? "Pause" : "Activate"}
                            >
                              {togglingId === product._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : product.isActive ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={perPage}
              onPage={setPage}
              onPerPage={setPerPage}
            />
          </div>
        </>
      )}

      {/* â”€â”€ Categories View */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Category Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                    Category Level
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                    Parent Category
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <CategoryRows
                  categories={
                    categorySearch
                      ? categories.filter((c) =>
                          c.name
                            .toLowerCase()
                            .includes(categorySearch.toLowerCase()),
                        )
                      : categories
                  }
                  depth={0}
                  onToggle={(id) =>
                    setCategories((prev) =>
                      updateCategoryTree(prev, id, (c) => ({
                        ...c,
                        expanded: !c.expanded,
                      })),
                    )
                  }
                  onEdit={openEditCategory}
                  onDelete={(id) => setDeleteCategoryId(id)}
                  onPause={(id) => setPauseCategoryId(id)}
                />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€ Delete Product Modal */}
      <AnimatePresence>
        {deleteProductId !== null && (
          <ModalOverlay onClose={() => setDeleteProductId(null)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#1a2b6b]">
                Delete Product?
              </h3>
              <button
                onClick={() => setDeleteProductId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-gray-700">
                Are you sure you want to delete this product?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 uppercase tracking-wide px-6"
                onClick={() => setDeleteProductId(null)}
                disabled={deletingProduct}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#1a2b6b] hover:bg-[#142258] text-white px-6"
                onClick={handleDeleteProduct}
                disabled={deletingProduct}
              >
                {deletingProduct ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* â”€â”€ Add / Edit Category Modal */}
      <AnimatePresence>
        {showAddCategory && (
          <ModalOverlay onClose={() => setShowAddCategory(false)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                {editCategoryId !== null ? "Edit Category" : "Add Category"}
              </h3>
              <button
                onClick={() => setShowAddCategory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div
                  className="w-full sm:w-48 h-44 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#1a2b6b] transition-colors overflow-hidden bg-gray-50 self-start"
                  onClick={() => categoryImageRef.current?.click()}
                >
                  {categoryForm.image ? (
                    <img
                      src={categoryForm.image}
                      alt="Category"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm text-center px-4 select-none">
                      <span className="block text-3xl mb-2">+</span>Add Image
                    </div>
                  )}
                  <input
                    ref={categoryImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCategoryImageChange}
                  />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1a2b6b] font-medium text-sm">
                      Category Name
                    </Label>
                    <Input
                      className="mt-1"
                      placeholder="Search Here"
                      value={categoryForm.name}
                      onChange={(e) => {
                        setCategoryForm((f) => ({
                          ...f,
                          name: e.target.value,
                        }));
                        if (categoryErrors.name)
                          setCategoryErrors((err) => {
                            const c = { ...err };
                            delete c.name;
                            return c;
                          });
                      }}
                    />
                    <FieldError msg={categoryErrors.name} />
                  </div>
                  <div>
                    <Label className="text-[#1a2b6b] font-medium text-sm">
                      Category Level
                    </Label>
                    <Select
                      value={categoryForm.level}
                      onValueChange={(v) =>
                        setCategoryForm((f) => ({ ...f, level: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L1">L1</SelectItem>
                        <SelectItem value="L2">L2</SelectItem>
                        <SelectItem value="L3">L3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1">
                    <Label className="text-[#1a2b6b] font-medium text-sm">
                      Tags
                    </Label>
                    <Textarea
                      className="mt-1 min-h-[80px] resize-none"
                      placeholder="Add tags..."
                      value={categoryForm.tags}
                      onChange={(e) =>
                        setCategoryForm((f) => ({ ...f, tags: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-[#1a2b6b] font-medium text-sm">
                      Display Priority
                    </Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min="0"
                      value={categoryForm.displayPriority}
                      onChange={(e) => {
                        setCategoryForm((f) => ({
                          ...f,
                          displayPriority: e.target.value,
                        }));
                        if (categoryErrors.displayPriority)
                          setCategoryErrors((err) => {
                            const c = { ...err };
                            delete c.displayPriority;
                            return c;
                          });
                      }}
                    />
                    <FieldError msg={categoryErrors.displayPriority} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-5 border-t border-gray-100 pt-4">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 uppercase tracking-wide px-6"
                onClick={() => setShowAddCategory(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 uppercase tracking-wide px-6"
                onClick={saveCategory}
              >
                Save
              </Button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* â”€â”€ Delete Category Modal */}
      <AnimatePresence>
        {deleteCategoryId !== null && (
          <ModalOverlay onClose={() => setDeleteCategoryId(null)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#1a2b6b]">
                Delete Category?
              </h3>
              <button
                onClick={() => setDeleteCategoryId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-gray-700">Are you sure?</p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 uppercase tracking-wide px-6"
                onClick={() => setDeleteCategoryId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#1a2b6b] hover:bg-[#142258] text-white px-6"
                onClick={handleDeleteCategory}
              >
                Delete
              </Button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* â”€â”€ Pause Category Modal */}
      <AnimatePresence>
        {pauseCategoryId !== null && (
          <ModalOverlay onClose={() => setPauseCategoryId(null)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#1a2b6b]">
                Pause Category?
              </h3>
              <button
                onClick={() => setPauseCategoryId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-gray-700">
                Are you sure you want to pause this category?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 uppercase tracking-wide px-6"
                onClick={() => setPauseCategoryId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#1a2b6b] hover:bg-[#142258] text-white px-6"
                onClick={handlePauseCategory}
              >
                Pause
              </Button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
