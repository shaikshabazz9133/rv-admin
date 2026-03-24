"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

interface OrderRecord {
  _id: string;
  orderId: string;
  user: { _id: string; name: string; email: string };
  products: Array<{
    product: {
      record: { _id: string; name: string; displayPic: string };
      soldPrice: number;
      quantity: number;
    };
    accessories: unknown[];
    _id: string;
  }>;
  shippingAddress: { city: string; state: string; postalCode: string };
  billingAddress: { city: string; state: string; postalCode: string };
  shippingType: string;
  paymentMode: string;
  finalPrice: number;
  status: string;
  insertedAt: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAddress(addr: {
  city: string;
  state: string;
  postalCode: string;
}) {
  return `${addr.city}, ${addr.state}, ${addr.postalCode}`;
}

function formatPaymentMode(mode: string) {
  return mode.replace(/_/g, " ");
}

// ─── Status config ─────────────────────────────────────────────────────────────
const ALL_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

const statusConfig: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  Pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  Confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  Processing: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  Dispatched: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  Delivered: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  Cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as OrderStatus] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [activeStatus, setActiveStatus] = useState<OrderStatus>("Pending");
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, activeStatus, debouncedSearch]);

  const fetchOrders = async () => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageNo: String(page),
        pageSize: String(perPage),
        status: activeStatus,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`${API_BASE}/order/list?${params}`, {
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

      setRecords(json.data.records);
      setTotal(json.data.totalRecords);
      setTotalPages(json.data.totalPages || 1);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Please check your connection.";
      toast({
        title: "Failed to load orders",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTab = (s: OrderStatus) => {
    setActiveStatus(s);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-4"
    >
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9 bg-white"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1">
        {ALL_STATUSES.map((s) => {
          const isActive = activeStatus === s;
          return (
            <button
              key={s}
              onClick={() => handleTab(s)}
              className={`h-9 px-4 rounded-md text-sm font-medium transition-all border ${
                isActive
                  ? "bg-[#1a2b6b] text-white border-[#1a2b6b] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s}
              {isActive && total > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold bg-white/20 text-white">
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap">
                  Order ID
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                  Customer
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                  Billing Address
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                  Shipping Address
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden xl:table-cell whitespace-nowrap">
                  Payment Mode
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b] mx-auto" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No {activeStatus.toLowerCase()} orders found.
                  </td>
                </tr>
              ) : (
                records.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-[#1a2b6b]">
                        {order.orderId}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs font-medium text-gray-800">
                        {order.user.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs max-w-[160px]">
                      <span className="line-clamp-2">
                        {formatAddress(order.billingAddress)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs max-w-[160px]">
                      <span className="line-clamp-2">
                        {formatAddress(order.shippingAddress)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-semibold hidden md:table-cell text-xs whitespace-nowrap">
                      ${order.finalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden xl:table-cell text-xs font-medium">
                      {formatPaymentMode(order.paymentMode)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs whitespace-nowrap">
                      {formatDate(order.insertedAt)}
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
    </motion.div>
  );
}
