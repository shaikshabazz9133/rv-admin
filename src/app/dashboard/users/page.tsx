"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Pencil,
  Trash2,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Eye,
  KeyRound,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  countryCode?: string;
  mobile?: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  insertedAt: number;
  orders: number;
}

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  countryCode?: string;
  mobile?: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  insertedAt: number;
  addresses: unknown[];
}

interface UserOrder {
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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  return `${addr.city}, ${addr.state} ${addr.postalCode}`;
}

function formatPaymentMode(mode: string) {
  return mode.replace(/_/g, " ");
}

// â”€â”€â”€ Order status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const orderStatusConfig: Record<string, { bg: string; text: string }> = {
  Pending: { bg: "bg-amber-100", text: "text-amber-700" },
  Confirmed: { bg: "bg-blue-100", text: "text-blue-700" },
  Processing: { bg: "bg-purple-100", text: "text-purple-700" },
  Dispatched: { bg: "bg-cyan-100", text: "text-cyan-700" },
  Delivered: { bg: "bg-green-100", text: "text-green-700" },
  Cancelled: { bg: "bg-red-100", text: "text-red-700" },
};

function OrderStatusBadge({ status }: { status: string }) {
  const c = orderStatusConfig[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded text-xs font-semibold ${c.bg} ${c.text}`}
    >
      {status}
    </span>
  );
}

// â”€â”€â”€ Avatar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const hue = (name.charCodeAt(0) * 47 + 30) % 360;
  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: `hsl(${hue}, 55%, 45%)` }}
    >
      {initials}
    </div>
  );
}

// â”€â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  onPerPage?: (n: number) => void;
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5">
        {onPerPage && (
          <>
            <span className="text-xs text-gray-400 font-medium">Show</span>
            <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5">
              {PER_PAGE_OPTIONS.map((n) => (
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
          </>
        )}
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
                key={`d${i}`}
                className="w-7 text-center text-xs text-gray-400"
              >
                â€¦
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={`w-8 h-7 rounded-xl text-xs font-semibold transition-all ${p === page ? "bg-[#1a2b6b] text-white shadow-sm" : "text-gray-500 hover:text-[#1a2b6b] hover:bg-white"}`}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();

  // â”€â”€ List state â”€â”€
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // â”€â”€ Detail state â”€â”€
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // â”€â”€ Orders state (in detail view) â”€â”€
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPerPage, setOrderPerPage] = useState(25);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderSearch, setOrderSearch] = useState("");

  // â”€â”€ Edit state â”€â”€
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", mobile: "" });
  const [editLoading, setEditLoading] = useState(false);

  // â”€â”€ Modal state â”€â”€
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UserRecord | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserRecord | null>(null);

  // â”€â”€ Auth helper â”€â”€
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

  // â”€â”€ Debounce search â”€â”€
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // â”€â”€ Fetch users list â”€â”€
  const fetchUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        pageNo: String(page),
        pageSize: String(perPage),
      });
      const res = await fetch(`${API_BASE}/user/all?${params}`, {
        headers: authHeaders(token),
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
      if (!json.status) throw new Error(json.message || "Failed to load users");
      setUsers(json.data.records);
      setTotal(json.data.totalRecords);
      setTotalPages(json.data.totalPages || 1);
    } catch (err: unknown) {
      toast({
        title: "Failed to load users",
        description:
          err instanceof Error ? err.message : "Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, getToken, authHeaders, router, toast]);

  useEffect(() => {
    if (view === "list") fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearch, view]);

  // â”€â”€ Fetch user detail â”€â”€
  const fetchUserDetail = useCallback(
    async (userId: string) => {
      const token = getToken();
      if (!token) return;
      setDetailLoading(true);
      try {
        const res = await fetch(`${API_BASE}/user?userId=${userId}`, {
          headers: authHeaders(token),
        });
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const json = await res.json();
        if (!json.status) throw new Error(json.message);
        setUserDetail(json.data);
      } catch (err: unknown) {
        toast({
          title: "Failed to load user details",
          description:
            err instanceof Error
              ? err.message
              : "Please check your connection.",
          variant: "destructive",
        });
      } finally {
        setDetailLoading(false);
      }
    },
    [getToken, authHeaders, toast],
  );

  // â”€â”€ Fetch user orders â”€â”€
  const fetchUserOrders = useCallback(
    async (userId: string, pg = 1, pgSize = 25) => {
      const token = getToken();
      if (!token) return;
      setOrdersLoading(true);
      try {
        const params = new URLSearchParams({
          userId,
          pageNo: String(pg),
          pageSize: String(pgSize),
          status: "Pending,Confirmed,Processing,Dispatched,Cancelled",
        });
        const res = await fetch(`${API_BASE}/order/list?${params}`, {
          headers: authHeaders(token),
        });
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const json = await res.json();
        if (!json.status) throw new Error(json.message);
        setOrders(json.data.records);
        setOrderTotal(json.data.totalRecords);
        setOrderTotalPages(json.data.totalPages || 1);
      } catch (err: unknown) {
        toast({
          title: "Failed to load user orders",
          description:
            err instanceof Error
              ? err.message
              : "Please check your connection.",
          variant: "destructive",
        });
      } finally {
        setOrdersLoading(false);
      }
    },
    [getToken, authHeaders, toast],
  );

  const openDetail = (u: UserRecord, editMode = false) => {
    setSelectedUser(u);
    setView("detail");
    setIsEditing(editMode);
    setEditForm({ name: u.name, mobile: u.mobile ?? "" });
    setOrders([]);
    setOrderPage(1);
    setOrderTotal(0);
    setOrderTotalPages(1);
    setOrderSearch("");
    fetchUserDetail(u._id);
    fetchUserOrders(u._id, 1, orderPerPage);
  };

  useEffect(() => {
    if (view === "detail" && selectedUser) {
      fetchUserOrders(selectedUser._id, orderPage, orderPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderPage, orderPerPage]);

  // â”€â”€ Edit (name + mobile) â”€â”€
  const handleUpdate = async () => {
    if (!selectedUser) return;
    const token = getToken();
    if (!token) return;
    setEditLoading(true);
    try {
      const fd = new FormData();
      fd.append("userId", selectedUser._id);
      fd.append("name", editForm.name);
      fd.append("mobile", editForm.mobile);
      const res = await fetch(`${API_BASE}/user`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
        body: fd,
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Update failed");
      // Update local list
      const updated: UserRecord = {
        ...selectedUser,
        name: editForm.name,
        mobile: editForm.mobile,
      };
      setSelectedUser(updated);
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? updated : u)),
      );
      setUserDetail((prev) =>
        prev ? { ...prev, name: editForm.name, mobile: editForm.mobile } : prev,
      );
      setIsEditing(false);
      toast({ title: "User updated successfully" });
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // â”€â”€ Toggle active/blocked â”€â”€
  const handleToggle = async () => {
    if (!toggleTarget) return;
    const token = getToken();
    if (!token) return;
    setToggleLoading(true);
    try {
      const fd = new FormData();
      fd.append("userId", toggleTarget._id);
      fd.append("isActive", String(!toggleTarget.isActive));
      const res = await fetch(`${API_BASE}/user`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
        body: fd,
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Update failed");
      const updated: UserRecord = {
        ...toggleTarget,
        isActive: !toggleTarget.isActive,
      };
      setUsers((prev) =>
        prev.map((u) => (u._id === toggleTarget._id ? updated : u)),
      );
      if (selectedUser?._id === toggleTarget._id) {
        setSelectedUser(updated);
        setUserDetail((prev) =>
          prev ? { ...prev, isActive: !toggleTarget.isActive } : prev,
        );
      }
      toast({
        title: `User ${updated.isActive ? "activated" : "deactivated"} successfully`,
      });
      setToggleTarget(null);
    } catch (err: unknown) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setToggleLoading(false);
    }
  };

  // â”€â”€ Delete â”€â”€
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = getToken();
    if (!token) return;
    setDeleteLoading(true);
    try {
      const params = new URLSearchParams({
        userId: deleteTarget._id,
        email: deleteTarget.email,
      });
      const res = await fetch(`${API_BASE}/user?${params}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Delete failed");
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setTotal((t) => t - 1);
      toast({ title: "User deleted successfully" });
      setDeleteTarget(null);
      if (view === "detail") {
        setView("list");
        setSelectedUser(null);
        setUserDetail(null);
      }
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // â”€â”€ Filtered orders for search (client-side within loaded page) â”€â”€
  const filteredOrders = orders.filter(
    (o) =>
      o.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      formatAddress(o.billingAddress)
        .toLowerCase()
        .includes(orderSearch.toLowerCase()),
  );

  // â”€â”€â”€ LIST VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 space-y-4"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-white"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b]">
                    User Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                    Email Id
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                    Mobile Number
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                    No of Orders
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b] mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} />
                          <span className="font-medium text-gray-900 text-sm">
                            {u.name}
                          </span>
                          {!u.isActive && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">
                              Blocked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs hidden sm:table-cell">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
                        {u.mobile
                          ? `${u.countryCode ?? ""} ${u.mobile}`.trim()
                          : "â€”"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 text-sm hidden lg:table-cell">
                        {u.orders}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetail(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDetail(u, true)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setToggleTarget(u)}
                            className={`p-1.5 rounded-lg transition-colors ${!u.isActive ? "text-green-500 bg-green-50 hover:bg-green-100" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"}`}
                            title={u.isActive ? "Block" : "Activate"}
                          >
                            {u.isActive ? (
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

        {/* Delete modal */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={(e) => {
                if (e.target === e.currentTarget && !deleteLoading)
                  setDeleteTarget(null);
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
                  Delete User?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Remove{" "}
                  <span className="font-semibold text-gray-800">
                    {deleteTarget.name}
                  </span>{" "}
                  ({deleteTarget.email})?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleteLoading}
                    className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleteLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle active modal */}
        <AnimatePresence>
          {toggleTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={(e) => {
                if (e.target === e.currentTarget && !toggleLoading)
                  setToggleTarget(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${toggleTarget.isActive ? "bg-amber-100" : "bg-green-100"}`}
                >
                  {toggleTarget.isActive ? (
                    <Pause className="h-6 w-6 text-amber-600" />
                  ) : (
                    <Play className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  {toggleTarget.isActive ? "Block User?" : "Activate User?"}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {toggleTarget.isActive ? "Block" : "Activate"}{" "}
                  <span className="font-semibold text-gray-800">
                    {toggleTarget.name}
                  </span>
                  ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setToggleTarget(null)}
                    disabled={toggleLoading}
                    className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleToggle}
                    disabled={toggleLoading}
                    className={`flex-1 h-10 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${toggleTarget.isActive ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700"}`}
                  >
                    {toggleLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {toggleTarget.isActive ? "Block" : "Activate"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // â”€â”€â”€ DETAIL VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!selectedUser) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-bold text-[#1a2b6b]">
          <button
            onClick={() => {
              setView("list");
              setSelectedUser(null);
              setUserDetail(null);
              setIsEditing(false);
            }}
            className="hover:underline"
          >
            Users
          </button>
          <span className="text-gray-400 font-normal mx-2">--&gt;</span>
          <span className="text-gray-700 font-mono text-sm">
            {selectedUser._id}
          </span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setView("list");
              setSelectedUser(null);
              setUserDetail(null);
              setIsEditing(false);
            }}
            className="h-9 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to Users
          </button>
          <button
            onClick={() => setResetTarget(selectedUser)}
            className="h-9 px-3 bg-[#1a2b6b] hover:bg-[#142258] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <KeyRound className="h-3.5 w-3.5" /> Reset Password
          </button>
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={editLoading}
                className="h-9 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={editLoading}
                className="h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {editLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Update
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditForm({
                  name: selectedUser.name,
                  mobile: selectedUser.mobile ?? "",
                });
                setIsEditing(true);
              }}
              className="h-9 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* User info card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        {detailLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#1a2b6b]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                User Id
              </p>
              <p className="text-xs text-gray-700 font-mono break-all">
                {selectedUser._id}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                User Name
              </p>
              {isEditing ? (
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full h-8 px-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                />
              ) : (
                <p className="text-sm text-gray-900 font-medium">
                  {userDetail?.name ?? selectedUser.name}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Email</p>
              <p className="text-sm text-gray-700">
                {userDetail?.email ?? selectedUser.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Mobile Number
              </p>
              {isEditing ? (
                <input
                  value={editForm.mobile}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, mobile: e.target.value }))
                  }
                  className="w-full h-8 px-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                  placeholder="Mobile number"
                />
              ) : (
                <p className="text-sm text-gray-700">
                  {userDetail?.mobile
                    ? `${userDetail.countryCode ?? ""} ${userDetail.mobile}`.trim()
                    : "â€”"}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Role</p>
              <p className="text-sm text-gray-700">
                {userDetail?.role ?? selectedUser.role}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Status</p>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded font-semibold ${(userDetail?.isActive ?? selectedUser.isActive) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
              >
                {(userDetail?.isActive ?? selectedUser.isActive)
                  ? "Active"
                  : "Blocked"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Email Verified
              </p>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded font-semibold ${(userDetail?.isEmailVerified ?? selectedUser.isEmailVerified) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
              >
                {(userDetail?.isEmailVerified ?? selectedUser.isEmailVerified)
                  ? "Verified"
                  : "Not Verified"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Joined</p>
              <p className="text-sm text-gray-700">
                {formatDate(userDetail?.insertedAt ?? selectedUser.insertedAt)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#1a2b6b]">
            Orders ({orderTotal})
          </p>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-gray-50"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b]">
                  Order ID
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                  Billing Address
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                  Shipping Address
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                  Payment Mode
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ordersLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b] mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1a2b6b]">
                      {o.orderId}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs hidden sm:table-cell max-w-[150px]">
                      <span className="line-clamp-2">
                        {formatAddress(o.billingAddress)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell max-w-[150px]">
                      <span className="line-clamp-2">
                        {formatAddress(o.shippingAddress)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-semibold text-xs whitespace-nowrap">
                      ${o.finalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">
                      {formatPaymentMode(o.paymentMode)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell whitespace-nowrap">
                      {formatDate(o.insertedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={orderPage}
          totalPages={orderTotalPages}
          total={orderTotal}
          perPage={orderPerPage}
          onPage={setOrderPage}
          onPerPage={setOrderPerPage}
        />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleteLoading)
                setDeleteTarget(null);
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
                Delete User?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Remove{" "}
                <span className="font-semibold text-gray-800">
                  {deleteTarget.name}
                </span>
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteLoading}
                  className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {resetTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setResetTarget(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="h-6 w-6 text-[#1a2b6b]" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">
                Reset Password?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Send a password reset email to{" "}
                <span className="font-semibold text-gray-800">
                  {resetTarget.email}
                </span>
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResetTarget(null)}
                  className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setResetTarget(null)}
                  className="flex-1 h-10 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Send Reset Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
