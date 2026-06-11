"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { resolveImg, imgUrl } from "@/lib/utils";

// ─── Auth helper ──────────────────────────────────────────────────────────────

function getToken() {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("auth_token") ?? "";
  }
  return "";
}

const BASE = "https://dev-backend.rvadventureaustralia.com.au";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewUser {
  _id: string;
  name: string;
  email: string;
}

interface ReviewProduct {
  _id: string;
  name: string;
  displayPic: { _id: string; url: string; altText?: string } | string;
  skuCode: string;
  price: number;
  offerPrice: number;
}

interface Review {
  _id: string;
  user: ReviewUser;
  product: ReviewProduct;
  rating: number;
  review?: string;
  isActive: boolean;
  insertedAt: number;
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({
  rating,
  max = 5,
  decimals = 1,
}: {
  rating: number;
  max?: number;
  decimals?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <Star
            key={i}
            className={`h-4 w-4 ${filled ? "fill-amber-400 text-amber-400" : half ? "fill-amber-200 text-amber-400" : "fill-gray-200 text-gray-300"}`}
          />
        );
      })}
      <span className="ml-1.5 text-sm font-semibold text-gray-700">
        {rating.toFixed(decimals)}
      </span>
    </div>
  );
}

// Product thumbnail with relative-URL resolution + load-error fallback
function ProductThumb({ src, alt }: { src?: unknown; alt?: string }) {
  const [errored, setErrored] = useState(false);
  const resolved = resolveImg(imgUrl(src));
  if (!resolved || errored) {
    return (
      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0" />
    );
  }
  return (
    <img
      src={resolved}
      alt={alt ?? ""}
      onError={() => setErrored(true)}
      className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
    />
  );
}

function formatReviewDate(ts: number) {
  return new Date(ts).toLocaleString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
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
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">
          {total === 0 ? (
            "0"
          ) : (
            <span className="font-semibold text-gray-800">
              {from}&ndash;{to}
            </span>
          )}{" "}
          of <span className="font-semibold text-gray-800">{total}</span>{" "}
          reviews
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Show</span>
          {PER_PAGE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => onPerPage(n)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                n === perPage
                  ? "bg-[#1a2b6b] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
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
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-8 h-7 rounded-xl text-xs font-semibold transition-all ${
                p === page
                  ? "bg-[#1a2b6b] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#1a2b6b] hover:bg-white"
              }`}
            >
              {p}
            </button>
          ))}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (productId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const fetchReviews = useCallback(
    async (pageNo: number, pageSize: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `${BASE}/api/product/ratings?pageNo=${pageNo}&pageSize=${pageSize}`,
          {
            headers: {
              authorization: `Bearer ${getToken()}`,
              "x-app-client": "ADMIN_PANEL",
              accept: "application/json",
            },
          },
        );
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const json = await res.json();
        const d = json?.data;
        setReviews(d?.records ?? []);
        setTotalPages(d?.totalPages ?? 1);
        setTotalRecords(d?.totalRecords ?? 0);
        setAvgRating(d?.avgRating ?? 0);
      } catch {
        toast({
          title: "Error",
          description: "Could not load reviews.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchReviews(page, perPage);
  }, [page, perPage, fetchReviews]);

  const handlePerPage = (n: number) => {
    setPerPage(n);
    setPage(1);
  };

  // Toggle a review's active status
  const handleToggleActive = async (review: Review) => {
    const newActive = !review.isActive;
    setTogglingId(review._id);
    // Optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r._id === review._id ? { ...r, isActive: newActive } : r,
      ),
    );
    try {
      const res = await fetch(`${BASE}/api/product/rating-status`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${getToken()}`,
          "content-type": "application/json",
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
        body: JSON.stringify({ ratingId: review._id, isActive: newActive }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      if (json?.status === false)
        throw new Error(json?.message || "Failed to update status");
      toast({
        title: newActive ? "Review activated" : "Review deactivated",
      });
    } catch {
      // Revert on failure
      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...r, isActive: !newActive } : r,
        ),
      );
      toast({
        title: "Error",
        description: "Could not update review status.",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.product?.name?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q)
    );
  });

  // Group reviews by product (preserving order)
  const groups: { product: ReviewProduct; reviews: Review[] }[] = [];
  const groupIndex = new Map<string, number>();
  for (const r of filtered) {
    const pid = r.product?._id ?? "unknown";
    if (!groupIndex.has(pid)) {
      groupIndex.set(pid, groups.length);
      groups.push({ product: r.product, reviews: [] });
    }
    groups[groupIndex.get(pid)!].reviews.push(r);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalRecords} review{totalRecords !== 1 ? "s" : ""}
            {avgRating > 0 && (
              <span className="ml-2 font-medium text-amber-600">
                &#9733; {avgRating.toFixed(2)} avg rating
              </span>
            )}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 bg-white text-gray-900"
            placeholder="Search by product or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            Loading reviews&hellip;
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            No reviews found.
          </div>
        ) : (
          groups.map((group, idx) => {
            const pid = group.product?._id ?? "unknown";
            const count = group.reviews.length;
            const avg =
              count > 0
                ? group.reviews.reduce((s, r) => s + r.rating, 0) / count
                : 0;
            const isCollapsed = collapsed.has(pid);
            return (
              <motion.div
                key={pid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Product header */}
                <button
                  onClick={() => toggleCollapse(pid)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <ProductThumb
                    src={group.product?.displayPic}
                    alt={group.product?.name}
                  />
                  <p className="flex-1 min-w-0 font-semibold text-gray-900 leading-snug truncate">
                    {group.product?.name ?? "Unknown Product"}
                  </p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StarRating rating={avg} />
                    <span className="text-sm text-gray-400">
                      {count} review{count !== 1 ? "s" : ""}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    />
                  </div>
                </button>

                {/* Reviews */}
                {!isCollapsed && (
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    {group.reviews.map((review) => {
                      const name = review.user?.name?.trim();
                      const initial =
                        name && name !== "-" ? name.charAt(0).toUpperCase() : "?";
                      return (
                        <div
                          key={review._id}
                          className="flex gap-3 p-4 bg-gray-50/40"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm flex-shrink-0 self-center">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">
                                  {name || "-"}
                                </p>
                                {review.user?.email && (
                                  <p className="text-xs text-gray-400">
                                    {review.user.email}
                                  </p>
                                )}
                                {review.review && (
                                  <p className="text-sm text-gray-700 mt-1.5">
                                    {review.review}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1.5">
                                  Reviewed on: {formatReviewDate(review.insertedAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <StarRating rating={review.rating} decimals={0} />
                                <Switch
                                  checked={review.isActive}
                                  onCheckedChange={() =>
                                    handleToggleActive(review)
                                  }
                                  disabled={togglingId === review._id}
                                  className="data-[state=checked]:bg-blue-500"
                                  aria-label="Toggle review visibility"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalRecords > 0 && !loading && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalRecords}
            perPage={perPage}
            onPage={setPage}
            onPerPage={handlePerPage}
          />
        </div>
      )}
    </motion.div>
  );
}
