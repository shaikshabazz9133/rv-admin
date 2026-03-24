"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ContactForm {
  _id: string;
  name: string;
  countryCode: string;
  mobile: string;
  email: string;
  message: string;
  replySent: boolean;
  insertedAt: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Per-page options ──────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

// ─── Pagination ────────────────────────────────────────────────────────────────

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
                key={`dots-${i}`}
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

export default function EnquiryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [records, setRecords] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchEnquiries();
  }, [page, perPage, debouncedSearch]);

  const fetchEnquiries = async () => {
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
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`${API_BASE}/contact-forms?${params}`, {
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
    } catch (err: any) {
      toast({
        title: "Failed to load enquiries",
        description: err.message || "Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6"
    >
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 bg-white"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                  Mobile
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                  Message
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b] mx-auto" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                records.map((enq) => (
                  <tr
                    key={enq._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1a2b6b]/10 flex items-center justify-center text-[#1a2b6b] font-bold text-xs flex-shrink-0">
                          {enq.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[120px]">
                          {enq.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs truncate max-w-[180px]">
                      {enq.email}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell whitespace-nowrap text-xs">
                      {enq.countryCode} {enq.mobile}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      <span className="line-clamp-1 max-w-[220px] text-xs">
                        {enq.message}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell whitespace-nowrap text-xs">
                      {formatDate(enq.insertedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          enq.replySent
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {enq.replySent ? "Replied" : "New"}
                      </span>
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
