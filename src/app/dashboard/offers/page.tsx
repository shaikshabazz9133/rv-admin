"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

const OFFER_TYPES = [
  "Products Discount by Percentage for Limited Duration",
  "Products Discount by Fixed Amount for Limited Duration",
  "Category Discount by Percentage",
  "Sitewide Discount by Percentage",
  "Free Shipping Offer",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface OfferRecord {
  _id: string;
  name: string;
  products: Array<{ _id: string; name: string }>;
  type: string;
  discount: number;
  startDate: number;
  endDate: number;
  isActive: boolean;
  insertedAt: number;
}

interface ProductOption {
  _id: string;
  name: string;
  displayPic: string;
  price: number;
}

interface OfferForm {
  name: string;
  description: string;
  type: string;
  discount: number | "";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  products: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tsToDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyForm(): OfferForm {
  return {
    name: "",
    description: "",
    type: OFFER_TYPES[0],
    discount: "",
    startDate: "",
    endDate: "",
    products: [],
  };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Expired
    </span>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
const PER_PAGE_OPTIONS = [10, 25, 50];

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

  const visiblePages = (): (number | "...")[] => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
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
          {from}–{to} of {total}
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
                key={`d${i}`}
                className="w-7 text-center text-xs text-gray-400"
              >
                …
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OffersPage() {
  const { toast } = useToast();
  const router = useRouter();

  // List state
  const [view, setView] = useState<"list" | "form">("list");
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<OfferRecord | null>(null);
  const [editing, setEditing] = useState<OfferRecord | null>(null);

  // Form state
  const [form, setForm] = useState<OfferForm>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  // Products in form
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);

  // Debounce list search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch offers on list view
  useEffect(() => {
    if (view === "list") fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearch, view]);

  // Debounce product search — reset page on new search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
      setProductPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [productSearch]);

  // Fetch products when form is open or product page changes
  useEffect(() => {
    if (view === "form") fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProductSearch, view, productPage]);

  const getToken = () => sessionStorage.getItem("auth_token");

  const fetchOffers = async () => {
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        pageNo: String(page),
        pageSize: String(perPage),
      });
      const res = await fetch(`${API_BASE}/product/offers?${params}`, {
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
      });
      if (res.status === 401) {
        sessionStorage.clear();
        toast({
          title: "Session Expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Failed to load data");
      setOffers(json.data.records);
      setTotal(json.data.totalRecords);
      setTotalPages(json.data.totalPages || 1);
    } catch (err) {
      toast({
        title: "Failed to load offers",
        description:
          err instanceof Error ? err.message : "Check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const token = getToken();
    if (!token) return;
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({
        includeInactive: "1",
        search: debouncedProductSearch,
        pageNo: String(productPage),
        pageSize: "12",
      });
      const res = await fetch(`${API_BASE}/product/all?${params}`, {
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.status) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProducts(
        json.data.records.products.map((p: any) => ({
          _id: p._id,
          name: p.name,
          displayPic: p.displayPic,
          price: p.price,
        })),
      );
      setProductTotal(json.data.totalRecords);
      setProductTotalPages(json.data.totalPages || 1);
    } catch {
      // silent — products grid will show empty state
    } finally {
      setProductsLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setProductSearch("");
    setDebouncedProductSearch("");
    setProductPage(1);
    setTypeOpen(false);
    setView("form");
  };

  const openEdit = (o: OfferRecord) => {
    setEditing(o);
    setForm({
      name: o.name,
      description: "",
      type: o.type,
      discount: o.discount,
      startDate: tsToDate(o.startDate),
      endDate: tsToDate(o.endDate),
      products: o.products.map((p) => p._id),
    });
    setErrors({});
    setProductSearch("");
    setDebouncedProductSearch("");
    setProductPage(1);
    setTypeOpen(false);
    setView("form");
  };

  const clearError = (key: string) =>
    setErrors((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Offer name is required";
    if (!form.type) e.type = "Type of offer is required";
    if (form.discount === "" || Number(form.discount) <= 0)
      e.discount = "Enter a valid discount value";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = "End date must be after start date";
    if (form.products.length === 0) e.products = "Select at least one product";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setSubmitting(true);
    try {
      const baseBody = {
        name: form.name.trim(),
        description: form.description,
        type: form.type,
        discount: Number(form.discount),
        startDate: new Date(form.startDate + "T00:00:00").getTime(),
        endDate: new Date(form.endDate + "T23:59:59.999").getTime(),
        products: form.products,
      };
      const isEdit = !!editing;
      const body = isEdit ? { ...baseBody, offerId: editing!._id } : baseBody;
      const res = await fetch(`${API_BASE}/product/offers`, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status)
        throw new Error(
          json.message ||
            (isEdit ? "Failed to update offer" : "Failed to create offer"),
        );
      toast({
        title: isEdit
          ? "Offer updated successfully!"
          : "Offer created successfully!",
      });
      setView("list");
      setSearch("");
      setDebouncedSearch("");
      setPage(1);
    } catch (err) {
      toast({
        title: editing ? "Failed to update offer" : "Failed to create offer",
        description:
          err instanceof Error ? err.message : "Check your connection.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProduct = (id: string) => {
    setForm((f) => ({
      ...f,
      products: f.products.includes(id)
        ? f.products.filter((x) => x !== id)
        : [...f.products, id],
    }));
    clearError("products");
  };

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search offers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add New Offer
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b]">
                    Offer Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Discount
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                    Start Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                    End Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b] mx-auto" />
                    </td>
                  </tr>
                ) : offers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      No offers found.
                    </td>
                  </tr>
                ) : (
                  offers.map((o) => (
                    <tr
                      key={o._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {o.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs max-w-[260px]">
                        <span className="line-clamp-1">{o.type}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 text-xs">
                        {o.discount}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                        {formatDate(o.startDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                        {formatDate(o.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={o.isActive} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(o)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(o)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
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
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            onPage={setPage}
            onPerPage={setPerPage}
          />
        </div>

        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={(e) => {
                if (e.target === e.currentTarget) setDeleteTarget(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  Delete Offer?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Remove{" "}
                  <span className="font-semibold text-gray-800">
                    &ldquo;{deleteTarget.name}&rdquo;
                  </span>
                  ? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const token = getToken();
                      if (!token) return;
                      try {
                        const res = await fetch(
                          `${API_BASE}/product/offers?offerId=${deleteTarget._id}`,
                          {
                            method: "DELETE",
                            headers: {
                              authorization: `Bearer ${token}`,
                              "x-app-client": "ADMIN_PANEL",
                              accept: "application/json",
                            },
                          },
                        );
                        if (!res.ok)
                          throw new Error(`Server error (${res.status})`);
                        setOffers((prev) =>
                          prev.filter((x) => x._id !== deleteTarget._id),
                        );
                        toast({ title: "Offer deleted successfully!" });
                      } catch (err) {
                        toast({
                          title: "Failed to delete offer",
                          description:
                            err instanceof Error
                              ? err.message
                              : "Check your connection.",
                          variant: "destructive",
                        });
                      } finally {
                        setDeleteTarget(null);
                      }
                    }}
                    className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ─── FORM VIEW ─────────────────────────────────────────────────────────────
  const today = todayStr();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-[#1a2b6b]">
          <button onClick={() => setView("list")} className="hover:underline">
            Offers
          </button>
          <span className="text-gray-400 font-normal mx-2">→</span>
          <span className="text-gray-800">
            {editing ? "Edit Offer" : "Create New"}
          </span>
        </h2>
        <button
          onClick={() => setView("list")}
          className="h-9 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Back to Offers
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Row 1: Name, Type, Discount */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Offer Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Offer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter offer name"
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                clearError("name");
              }}
              className={`w-full h-10 px-3 border rounded-lg text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors ${errors.name ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Type of Offer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Type of Offer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {/* invisible backdrop to close dropdown on outside click */}
              {typeOpen && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setTypeOpen(false)}
                />
              )}
              <button
                type="button"
                onClick={() => setTypeOpen((o) => !o)}
                className={`relative z-20 w-full h-10 px-3 border rounded-lg text-sm text-gray-900 text-left bg-white flex items-center justify-between gap-2 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors ${errors.type ? "border-red-400" : "border-gray-200"}`}
              >
                <span className="truncate text-gray-800">{form.type}</span>
                <ChevronRight
                  className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${
                    typeOpen ? "-rotate-90" : "rotate-90"
                  }`}
                />
              </button>
              {typeOpen && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {OFFER_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, type: t }));
                        clearError("type");
                        setTypeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm leading-snug transition-colors ${
                        form.type === t
                          ? "bg-[#1a2b6b] !text-white font-semibold"
                          : "!text-gray-800 hover:bg-blue-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type}</p>
            )}
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Discount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Enter discount value"
              min={1}
              value={form.discount}
              onChange={(e) => {
                setForm((f) => ({
                  ...f,
                  discount: e.target.value === "" ? "" : Number(e.target.value),
                }));
                clearError("discount");
              }}
              className={`w-full h-10 px-3 border rounded-lg text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors ${errors.discount ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.discount && (
              <p className="text-red-500 text-xs mt-1">{errors.discount}</p>
            )}
          </div>
        </div>

        {/* Row 2: Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Duration <span className="text-red-500">*</span>
          </label>
          <div className="flex items-start gap-3 flex-wrap">
            <div>
              <input
                type="date"
                value={form.startDate}
                min={today}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((f) => ({
                    ...f,
                    startDate: val,
                    // clear endDate if it's now before the new startDate
                    endDate: f.endDate && f.endDate < val ? "" : f.endDate,
                  }));
                  clearError("startDate");
                }}
                className={`h-10 px-3 border rounded-lg text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors ${errors.startDate ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
              )}
            </div>
            <span className="text-gray-400 text-sm font-medium mt-2.5">to</span>
            <div>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || today}
                onChange={(e) => {
                  setForm((f) => ({ ...f, endDate: e.target.value }));
                  clearError("endDate");
                }}
                className={`h-10 px-3 border rounded-lg text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors ${errors.endDate ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Select Products */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Select Products <span className="text-red-500">*</span>
            </label>
            {form.products.length > 0 && (
              <span className="text-xs font-semibold text-[#1a2b6b] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                {form.products.length} selected
              </span>
            )}
          </div>
          {errors.products && (
            <p className="text-red-500 text-xs mb-2">{errors.products}</p>
          )}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors placeholder:text-gray-400"
            />
          </div>
          {productsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">
              No products found.
            </p>
          ) : (
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
              onClick={() => setTypeOpen(false)}
            >
              {products.map((p) => {
                const selected = form.products.includes(p._id);
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => toggleProduct(p._id)}
                    className={`relative text-left border-2 rounded-xl p-3 transition-all ${
                      selected
                        ? "border-[#1a2b6b] bg-blue-50/50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1a2b6b] flex items-center justify-center shadow">
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
                      </div>
                    )}
                    {/* Product image */}
                    <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center mb-2.5 overflow-hidden">
                      {p.displayPic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.displayPic}
                          alt={p.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <svg
                          className="w-8 h-8 text-gray-300"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">
                      {p.name}
                    </p>
                    <p className="text-xs text-[#1a2b6b] font-semibold mt-1">
                      ${p.price.toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Product grid pagination */}
          {productTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Page {productPage} of {productTotalPages} &middot;{" "}
                {productTotal} products
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage === 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setProductPage((p) => Math.min(productTotalPages, p + 1))
                  }
                  disabled={productPage === productTotalPages}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => setView("list")}
            disabled={submitting}
            className="h-10 px-6 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-10 px-6 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Update Offer" : "Create Offer"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
