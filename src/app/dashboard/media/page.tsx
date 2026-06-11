"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Search,
  LayoutGrid,
  List,
  ImageOff,
  CloudUpload,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { resolveImg, imgUrl } from "@/lib/utils";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";
const PER_PAGE = 20;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface MediaItem {
  _id: string;
  imageId?: string;
  title: string;
  description?: string;
  altText?: string;
  image?: string;
  imageUrl?: string;
  url?: string;
  fileUrl?: string;
  key?: string;
  fileName?: string;
  filename?: string;
  name?: string;
}

// Resolve the S3 key / filename to display
function getKeyName(item: MediaItem): string {
  if (item.key) return item.key;
  if (item.fileName) return item.fileName;
  if (item.filename) return item.filename;
  // Fall back to extracting the filename from the URL
  const src = getImageUrl(item);
  if (!src) return "";
  try {
    const pathname = new URL(src).pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
  } catch {
    return src.split("/").pop() ?? "";
  }
}

function getImageUrl(item: MediaItem): string {
  const raw = item.imageUrl ?? item.image ?? item.url ?? item.fileUrl ?? item;
  return resolveImg(imgUrl(raw) || raw);
}

function getId(item: MediaItem): string {
  return item._id ?? item.imageId ?? "";
}

// ─── Drag-and-Drop Upload Zone ─────────────────────────────────────────────────
function UploadZone({
  preview,
  onFile,
  onClear,
}: {
  preview: string;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative w-full h-52 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
          ${dragging
            ? "border-[#1a2b6b] bg-blue-50 scale-[1.01]"
            : preview
            ? "border-gray-200 bg-gray-50 hover:border-[#1a2b6b]"
            : "border-gray-300 bg-gray-50 hover:border-[#1a2b6b] hover:bg-blue-50/30"
          }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/35 transition-all flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100">
              <Upload className="h-6 w-6 text-white" />
              <span className="text-white text-sm font-semibold">Click to change</span>
            </div>
          </>
        ) : (
          <>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${dragging ? "bg-[#1a2b6b]/10" : "bg-gray-100"}`}>
              <CloudUpload className={`h-7 w-7 transition-colors ${dragging ? "text-[#1a2b6b]" : "text-gray-400"}`} />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {dragging ? "Drop to upload" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WEBP supported</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {preview && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Remove image
        </button>
      )}
    </div>
  );
}

// ─── Grid Card ─────────────────────────────────────────────────────────────────
function GridCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MediaItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const src = getImageUrl(item);
  const [imgError, setImgError] = useState(false);
  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white hover:border-[#1a2b6b]/40 hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* Image area — fixed height, image contained so full image is always visible */}
      <div className="relative w-full h-40 bg-[#f4f5f7] flex items-center justify-center overflow-hidden">
        {src && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={item.altText || item.title}
            className="w-full h-full object-contain p-1"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 gap-1">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs text-gray-400">No image</span>
          </div>
        )}
        {/* Action buttons — appear on hover */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg bg-white/95 shadow flex items-center justify-center text-gray-600 hover:text-[#1a2b6b] transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-white/95 shadow flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* Label area — title + key name always visible */}
      <div className="px-2.5 py-2 border-t border-gray-100 space-y-0.5">
        <p className="text-xs font-semibold text-gray-800 truncate leading-tight" title={item.title}>
          {item.title}
        </p>
        {(() => {
          const key = getKeyName(item);
          return key ? (
            <p className="text-[10px] text-gray-400 truncate font-mono leading-tight" title={key}>
              {key}
            </p>
          ) : null;
        })()}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MediaPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", altText: "", image: null as File | null, imagePreview: "" });

  // Delete modal
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sentinel ref for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Ref to track in-flight page so observer doesn't double-fire
  const fetchingPageRef = useRef<number | null>(null);

  // ── Auth ──
  const getToken = useCallback(() => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) { router.push("/"); return null; }
    return token;
  }, [router]);

  const authHeaders = useCallback((token: string) => ({
    authorization: `Bearer ${token}`,
    "x-app-client": "ADMIN_PANEL",
    accept: "application/json",
  }), []);

  // ── Fetch a page and append/replace ──
  const fetchPage = useCallback(async (pg: number, searchStr: string, replace: boolean) => {
    const token = getToken();
    if (!token) return;
    if (fetchingPageRef.current === pg) return;
    fetchingPageRef.current = pg;

    if (replace) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ pageNo: String(pg), pageSize: String(PER_PAGE) });
      if (searchStr.trim()) params.set("search", searchStr.trim());

      const res = await fetch(`${API_BASE}/image/list?${params}`, { headers: authHeaders(token) });
      if (res.status === 401) { sessionStorage.clear(); router.push("/"); return; }

      const json = await res.json();
      console.log("[Media] page", pg, json);
      if (!res.ok) throw new Error(json?.message || `Server error (${res.status})`);

      const records: MediaItem[] =
        json.data?.details?.records ??
        json.data?.records ??
        (Array.isArray(json.data) ? json.data : null) ??
        json.records ??
        [];

      const tot: number =
        json.data?.details?.totalRecords ??
        json.data?.totalRecords ??
        json.totalRecords ??
        0;

      const totalPgs: number =
        json.data?.details?.totalPages ??
        json.data?.totalPages ??
        json.totalPages ??
        1;

      setItems((prev) => replace ? records : [...prev, ...records]);
      setTotal(tot);
      setHasMore(pg < totalPgs && records.length > 0);
      setPage(pg);
    } catch (err: unknown) {
      toast({
        title: "Failed to load media",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      fetchingPageRef.current = null;
      if (replace) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  }, [getToken, authHeaders, toast, router]);

  // Initial load / search reset
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1, search, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // IntersectionObserver — fires when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingInitial) {
          fetchPage(page + 1, search, false);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadingInitial, page, search, fetchPage]);

  // ── Search ──
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // ── Open Add ──
  const openAdd = () => {
    setEditItem(null);
    setForm({ title: "", description: "", altText: "", image: null, imagePreview: "" });
    setShowModal(true);
  };

  // ── Open Edit ──
  const openEdit = (item: MediaItem) => {
    setEditItem(item);
    setForm({ title: item.title ?? "", description: item.description ?? "", altText: item.altText ?? "", image: null, imagePreview: getImageUrl(item) });
    setShowModal(true);
  };

  // ── Save ──
  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    if (!editItem && !form.image) { toast({ title: "Image is required", variant: "destructive" }); return; }
    const token = getToken();
    if (!token) return;
    setFormLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("altText", form.altText.trim());
      if (editItem) fd.append("imageId", getId(editItem));
      if (form.image) fd.append("image", form.image);

      const res = await fetch(`${API_BASE}/image`, {
        method: editItem ? "PATCH" : "POST",
        headers: authHeaders(token),
        body: fd,
      });
      if (res.status === 401) { sessionStorage.clear(); router.push("/"); return; }
      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch { /* empty */ }
      if (!res.ok || json?.status === false) throw new Error((json?.message as string) || "Failed");

      toast({ title: `Media ${editItem ? "updated" : "added"} successfully` });
      setShowModal(false);
      // Reload from page 1
      setItems([]);
      setPage(1);
      setHasMore(true);
      fetchPage(1, search, true);
    } catch (err: unknown) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteItem) return;
    const token = getToken();
    if (!token) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/image?imageId=${getId(deleteItem)}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (res.status === 401) { sessionStorage.clear(); router.push("/"); return; }
      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch { /* empty */ }
      if (!res.ok || json?.status === false) throw new Error((json?.message as string) || `Server error (${res.status})`);
      toast({ title: "Media deleted successfully" });
      setDeleteItem(null);
      setItems([]);
      setPage(1);
      setHasMore(true);
      fetchPage(1, search, true);
    } catch (err: unknown) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a2b6b]">Media Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} file{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openAdd}
          className="h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Media File
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-[#1a2b6b] text-white shadow-sm" : "text-gray-500 hover:text-[#1a2b6b]"}`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-[#1a2b6b] text-white shadow-sm" : "text-gray-500 hover:text-[#1a2b6b]"}`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1" />

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search media..."
              className="h-9 pl-9 pr-3 w-56 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
            />
          </div>
          <button type="submit" className="h-9 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setSearch(""); }}
              className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loadingInitial ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#1a2b6b]" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ImageOff className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No media found</p>
            {search && <p className="text-sm text-gray-400 mt-1">Try a different search term</p>}
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <GridCard
                key={getId(item)}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => setDeleteItem(item)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b]">Image</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Key / File</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Alt Text</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Description</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const src = getImageUrl(item);
                  return (
                    <tr key={getId(item)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={item.altText || item.title} className="w-14 h-14 object-cover rounded-lg border border-gray-100 bg-gray-50" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ImageOff className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px]">
                        <span className="line-clamp-2">{item.title}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] hidden sm:table-cell font-mono">
                        <span className="line-clamp-2">{getKeyName(item) || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] hidden md:table-cell">
                        <span className="line-clamp-2">{item.altText || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] hidden lg:table-cell">
                        <span className="line-clamp-2">{item.description || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteItem(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Infinite scroll sentinel + loading indicator */}
        {!loadingInitial && (
          <div ref={sentinelRef} className="flex items-center justify-center py-6">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />}
            {!loadingMore && !hasMore && items.length > 0 && (
              <p className="text-xs text-gray-400">All {total} file{total !== 1 ? "s" : ""} loaded</p>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {/* Add / Edit Modal */}
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget && !formLoading) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="font-bold text-[#1a2b6b] text-lg">
                  {editItem ? "Edit Media" : "Add Media File"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Image {!editItem && <span className="text-red-500">*</span>}
                  </label>
                  <UploadZone
                    preview={form.imagePreview}
                    onFile={(f) => setForm((prev) => ({ ...prev, image: f, imagePreview: URL.createObjectURL(f) }))}
                    onClear={() => setForm((prev) => ({ ...prev, image: null, imagePreview: "" }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Enter title"
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Alt Text</label>
                  <input
                    value={form.altText}
                    onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
                    placeholder="Enter alt text"
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Enter description"
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                  className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={formLoading}
                  className="flex-1 h-10 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirm Modal */}
        {deleteItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget && !deleteLoading) setDeleteItem(null); }}
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
              <h3 className="font-bold text-gray-900 text-lg mb-1">Delete Media?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Remove <span className="font-semibold text-gray-800">{deleteItem.title}</span>? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteItem(null)}
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
                  {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
