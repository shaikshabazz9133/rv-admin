"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ImagePlus,
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  ListOrdered,
  Eraser,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import SeoTab, { type SeoTabHandle } from "@/components/SeoTab";
import AttachmentDetailsModal from "@/components/AttachmentDetailsModal";
import { resolveImg, imgUrl } from "@/lib/utils";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  _id: string;
  name: string;
  description?: string;
  insertedAt?: number;
}

interface Blog {
  _id: string;
  title: string;
  description: string;
  category: { _id: string; name: string };
  image?: string;
  imageAltText?: string;
  insertedAt?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const PER_PAGE_OPTIONS = [10, 25, 50];

// ─── Pagination Component ──────────────────────────────────────────────────────
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
          </>
        )}
        <span className="text-xs text-gray-400 ml-1">
          {from}&#8211;{to} of {total}
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
                &#8230;
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
          disabled={page === totalPages || totalPages === 0}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#1a2b6b] hover:text-[#1a2b6b] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function BlogsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"categories" | "blogs">(
    "categories",
  );
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const blogSeoRef = useRef<SeoTabHandle>(null);

  // ── Categories state ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [catFormLoading, setCatFormLoading] = useState(false);
  const [deleteCatLoading, setDeleteCatLoading] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [catPage, setCatPage] = useState(1);
  const [catTotal, setCatTotal] = useState(0);
  const [catTotalPages, setCatTotalPages] = useState(1);
  const [catPerPage, setCatPerPage] = useState(10);

  // ── Blogs state ──
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogCatFilter, setBlogCatFilter] = useState("");
  const [blogMonthFilter, setBlogMonthFilter] = useState("");
  const [deleteBlog, setDeleteBlog] = useState<Blog | null>(null);
  const [deleteBlogLoading, setDeleteBlogLoading] = useState(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [blogDetailLoading, setBlogDetailLoading] = useState(false);
  const [blogFormLoading, setBlogFormLoading] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: "",
    imageAltText: "",
    categoryId: "",
    image: null as File | null,
    imagePreview: "",
    imageId: undefined as string | undefined,
    imageTitle: "",
    imageDescription: "",
  });
  const [blogAttachOpen, setBlogAttachOpen] = useState(false);
  const [blogPage, setBlogPage] = useState(1);
  const [blogTotal, setBlogTotal] = useState(0);
  const [blogTotalPages, setBlogTotalPages] = useState(1);
  const [blogPerPage, setBlogPerPage] = useState(10);
  const [editorHasContent, setEditorHasContent] = useState(false);

  const descRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descImgInputRef = useRef<HTMLInputElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startW: number;
    img: HTMLImageElement;
  } | null>(null);
  // Bounding box of the currently selected description image (relative to editor)
  const [imgBox, setImgBox] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // ── Auth ──
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

  // ── Fetch categories ──
  const fetchCategories = useCallback(
    async (pg: number, perPage: number) => {
      const token = getToken();
      if (!token) return;
      setCatLoading(true);
      try {
        const params = new URLSearchParams({
          pageNo: String(pg),
          pageSize: String(perPage),
        });
        const res = await fetch(`${API_BASE}/blog/category/list?${params}`, {
          headers: authHeaders(token),
        });
        if (res.status === 401) {
          sessionStorage.clear();
          router.push("/");
          return;
        }
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.message || `Server error (${res.status})`);
        setCategories(
          json.data?.records ??
            json.data?.details?.records ??
            json.data ??
            json.records ??
            [],
        );
        setCatTotal(
          json.data?.totalRecords ??
            json.data?.details?.totalRecords ??
            json.totalRecords ??
            0,
        );
        setCatTotalPages(
          json.data?.totalPages ??
            json.data?.details?.totalPages ??
            json.totalPages ??
            1,
        );
      } catch (err: unknown) {
        toast({
          title: "Failed to load categories",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setCatLoading(false);
      }
    },
    [getToken, authHeaders, toast, router],
  );

  // ── Fetch blogs ──
  const fetchBlogs = useCallback(
    async (
      pg: number,
      catFilter: string,
      monthFilter: string,
      perPage: number,
    ) => {
      const token = getToken();
      if (!token) return;
      setBlogsLoading(true);
      try {
        const params = new URLSearchParams({
          pageNo: String(pg),
          pageSize: String(perPage),
          needConfig: "true",
        });
        if (catFilter) params.set("categoryId", catFilter);
        if (monthFilter) {
          // API expects: month=May 2026
          const opt = monthOptions.find((m) => m.value === monthFilter);
          if (opt) params.set("month", opt.label);
        }
        const res = await fetch(`${API_BASE}/blog/list?${params}`, {
          headers: authHeaders(token),
        });
        if (res.status === 401) {
          sessionStorage.clear();
          router.push("/");
          return;
        }
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.message || `Server error (${res.status})`);
        setBlogs(json.data?.details?.records ?? []);
        setBlogTotal(json.data?.details?.totalRecords ?? 0);
        setBlogTotalPages(json.data?.details?.totalPages ?? 1);
      } catch (err: unknown) {
        toast({
          title: "Failed to load blogs",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setBlogsLoading(false);
      }
    },
    [getToken, authHeaders, toast, router],
  );

  // ── Effects ──
  useEffect(() => {
    fetchCategories(catPage, catPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catPage, catPerPage]);

  useEffect(() => {
    if (activeTab === "blogs" && view === "list") {
      fetchBlogs(blogPage, blogCatFilter, blogMonthFilter, blogPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, view, blogPage, blogCatFilter, blogMonthFilter, blogPerPage]);

  // Set editor content when form view opens
  useEffect(() => {
    if (!descRef.current) return;
    setImgBox(null);
    selectedImgRef.current = null;
    if (view === "add") {
      descRef.current.innerHTML = "";
      setEditorHasContent(false);
    } else if (view === "edit" && editBlog) {
      const desc = editBlog.description ?? "";
      descRef.current.innerHTML = desc;
      setEditorHasContent(
        /<img/i.test(desc) || desc.replace(/<[^>]*>/g, "").trim().length > 0,
      );
    }
  }, [view, editBlog]);

  // ── Category CRUD ──
  const openAddCat = () => {
    setCatForm({ name: "", description: "" });
    setEditCat(null);
    setShowCatModal(true);
  };

  const openEditCat = (c: Category) => {
    setCatForm({ name: c.name, description: c.description ?? "" });
    setEditCat(c);
    setShowCatModal(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    const token = getToken();
    if (!token) return;
    setCatFormLoading(true);
    try {
      const body = editCat
        ? {
            categoryId: editCat._id,
            name: catForm.name,
            description: catForm.description,
          }
        : { name: catForm.name, description: catForm.description };
      const res = await fetch(`${API_BASE}/blog/category`, {
        method: editCat ? "PATCH" : "POST",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch {
        /* empty */
      }
      if (!res.ok || json?.status === false)
        throw new Error((json?.message as string) || "Failed");
      toast({
        title: `Category ${editCat ? "updated" : "added"} successfully`,
      });
      setShowCatModal(false);
      fetchCategories(catPage, catPerPage);
    } catch (err: unknown) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCatFormLoading(false);
    }
  };

  const handleDeleteCat = async () => {
    if (!deleteCat) return;
    const token = getToken();
    if (!token) return;
    setDeleteCatLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/blog/category?categoryId=${deleteCat._id}`,
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
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch {
        /* empty */
      }
      if (!res.ok || json?.status === false)
        throw new Error(
          (json?.message as string) || `Server error (${res.status})`,
        );
      toast({ title: "Category deleted successfully" });
      setDeleteCat(null);
      fetchCategories(catPage, catPerPage);
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteCatLoading(false);
    }
  };

  // ── Blog CRUD ──
  const openAddBlog = () => {
    setEditBlog(null);
    setBlogForm({
      title: "",
      imageAltText: "",
      categoryId: "",
      image: null,
      imagePreview: "",
      imageId: undefined,
      imageTitle: "",
      imageDescription: "",
    });
    setView("add");
  };

  const openEditBlog = async (b: Blog) => {
    const token = getToken();
    if (!token) return;
    setEditBlog(b);
    setBlogDetailLoading(true);
    setView("edit");
    try {
      const res = await fetch(
        `${API_BASE}/blog/details?blogId=${b._id}`,
        { headers: authHeaders(token) },
      );
      const json = await res.json();
      if (!res.ok || json?.status === false)
        throw new Error((json?.message as string) || `Server error (${res.status})`);
      const detail: Blog = json.data;
      setEditBlog(detail);
      const rawImg = detail.image as unknown;
      const imgId = rawImg && typeof rawImg === "object" ? (rawImg as Record<string, unknown>)._id as string : undefined;
      setBlogForm({
        title: detail.title ?? "",
        imageAltText: (rawImg && typeof rawImg === "object" ? (rawImg as Record<string, unknown>).altText as string : undefined) ?? detail.imageAltText ?? "",
        categoryId: detail.category?._id ?? "",
        image: null,
        imagePreview: imgUrl(detail.image),
        imageId: imgId,
        imageTitle: rawImg && typeof rawImg === "object" ? (rawImg as Record<string, unknown>).title as string ?? "" : "",
        imageDescription: rawImg && typeof rawImg === "object" ? (rawImg as Record<string, unknown>).description as string ?? "" : "",
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to load blog details",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      setView("list");
      setEditBlog(null);
    } finally {
      setBlogDetailLoading(false);
    }
  };

  const handleImageChange = (file: File) => {
    const filenameTitle = file.name.replace(/\.[^/.]+$/, "");
    setBlogForm((f) => ({
      ...f,
      image: file,
      imagePreview: URL.createObjectURL(file),
      imageId: undefined,
      imageTitle: filenameTitle,
    }));
  };

  const handleSaveBlog = async () => {
    if (!blogForm.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!blogForm.imageAltText.trim()) {
      toast({ title: "Image alt text is required", variant: "destructive" });
      return;
    }
    if (!blogForm.categoryId) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }
    const desc = descRef.current?.innerHTML ?? "";
    const token = getToken();
    if (!token) return;
    setBlogFormLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", blogForm.title);
      fd.append("description", desc);
      fd.append("categoryId", blogForm.categoryId);
      fd.append("imageAltText", blogForm.imageAltText);
      if (editBlog) fd.append("blogId", editBlog._id);
      if (blogForm.image) fd.append("image", blogForm.image);
      const res = await fetch(`${API_BASE}/blog`, {
        method: editBlog ? "PATCH" : "POST",
        headers: authHeaders(token),
        body: fd,
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch {
        /* empty */
      }
      if (!res.ok || json?.status === false)
        throw new Error((json?.message as string) || "Failed");
      toast({ title: `Blog ${editBlog ? "updated" : "added"} successfully` });
      await blogSeoRef.current?.triggerSave();
      setEditBlog(null);
      setView("list");
      fetchBlogs(1, blogCatFilter, blogMonthFilter, blogPerPage);
    } catch (err: unknown) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBlogFormLoading(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!deleteBlog) return;
    const token = getToken();
    if (!token) return;
    setDeleteBlogLoading(true);
    try {
      const res = await fetch(`${API_BASE}/blog?blogId=${deleteBlog._id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch {
        /* empty */
      }
      if (!res.ok || json?.status === false)
        throw new Error(
          (json?.message as string) || `Server error (${res.status})`,
        );
      toast({ title: "Blog deleted successfully" });
      setDeleteBlog(null);
      fetchBlogs(blogPage, blogCatFilter, blogMonthFilter, blogPerPage);
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteBlogLoading(false);
    }
  };

  // ── Rich text editor helpers ──
  const execCmd = (cmd: string, value?: string) => {
    descRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  // Insert an image into the description editor (inline, like product description)
  const handleDescImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        execCmd(
          "insertHTML",
          `<img src="${result}" alt="" style="max-width:100%;height:auto;border-radius:6px;margin:6px 0;" />`,
        );
        setEditorHasContent(true);
      }
    };
    reader.readAsDataURL(file);
    if (descImgInputRef.current) descImgInputRef.current.value = "";
  };

  // ── Image resize (click an image, then drag the corner handle) ──
  const syncImgBox = (img: HTMLImageElement) => {
    const wrap = editorWrapRef.current;
    if (!wrap) return;
    const wr = wrap.getBoundingClientRect();
    const ir = img.getBoundingClientRect();
    setImgBox({
      top: ir.top - wr.top,
      left: ir.left - wr.left,
      width: ir.width,
      height: ir.height,
    });
  };

  const clearImgSelection = () => {
    selectedImgRef.current = null;
    setImgBox(null);
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      selectedImgRef.current = img;
      syncImgBox(img);
    } else {
      clearImgSelection();
    }
  };

  const startResize = (e: React.PointerEvent) => {
    const img = selectedImgRef.current;
    if (!img) return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX,
      startW: img.getBoundingClientRect().width,
      img,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const moveResize = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r) return;
    const maxW = (editorWrapRef.current?.clientWidth ?? 9999) - 24;
    const w = Math.max(40, Math.min(r.startW + (e.clientX - r.startX), maxW));
    r.img.style.width = `${Math.round(w)}px`;
    r.img.style.height = "auto";
    syncImgBox(r.img);
  };

  const endResize = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
  };

  // ── Month options ──
  const currentMonthIndex = new Date().getMonth();
  const monthOptions = [
    {
      label: `${MONTHS[currentMonthIndex]} ${CURRENT_YEAR}`,
      value: `${CURRENT_YEAR}-${String(currentMonthIndex + 1).padStart(2, "0")}`,
    },
  ];

  // ─── Blog Add / Edit Form ────────────────────────────────────────────────────
  if (activeTab === "blogs" && (view === "add" || view === "edit")) {
    // Show full-page loader while fetching edit details
    if (blogDetailLoading) {
      return (
        <div className="min-h-full bg-[#f0f2f8] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a2b6b]" />
        </div>
      );
    }
    return (
      <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-full bg-[#f0f2f8] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f0f2f8]">
          <h2 className="text-lg font-bold text-[#1a2b6b]">
            {view === "edit" ? "Edit Blog" : "Add New Blog"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setView("list");
                setEditBlog(null);
              }}
              disabled={blogFormLoading}
              className="h-9 px-5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBlog}
              disabled={blogFormLoading}
              className="h-9 px-6 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {blogFormLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>

        {/* Form body */}
        <div className="flex-1 px-6 pb-6">
          <div className="flex gap-5">
            {/* Left — image upload */}
            <div className="w-56 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Blog Image
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) handleImageChange(f);
                }}
                className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#1a2b6b] hover:bg-blue-50/30 transition-colors overflow-hidden bg-white"
              >
                {blogForm.imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImg(blogForm.imagePreview)}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                      <Plus className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 text-center px-3">
                      Click or drag to upload
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageChange(f);
                }}
              />
              {blogForm.imagePreview && (
                <div className="mt-1.5 flex gap-3">
                  <button
                    onClick={() => setBlogAttachOpen(true)}
                    className="text-xs text-[#1a2b6b] hover:underline"
                  >
                    Edit attachment details
                  </button>
                  <button
                    onClick={() =>
                      setBlogForm((f) => ({
                        ...f,
                        image: null,
                        imagePreview: "",
                        imageId: undefined,
                      }))
                    }
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>

            {/* Right — fields */}
            <div className="flex-1 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={blogForm.title}
                  onChange={(e) =>
                    setBlogForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Enter blog title"
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                />
              </div>

              {/* Image Alt Text */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Image Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  value={blogForm.imageAltText}
                  onChange={(e) =>
                    setBlogForm((f) => ({ ...f, imageAltText: e.target.value }))
                  }
                  placeholder="Enter image alt text"
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={blogForm.categoryId}
                    onChange={(e) =>
                      setBlogForm((f) => ({ ...f, categoryId: e.target.value }))
                    }
                    className="w-full h-10 px-3 pr-8 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors appearance-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Description — rich text editor */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1a2b6b]/20 focus-within:border-[#1a2b6b] transition-colors">
                  {/* Toolbar */}
                  <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 flex-wrap">
                    <select
                      defaultValue="p"
                      onChange={(e) => {
                        execCmd("formatBlock", e.target.value);
                      }}
                      className="h-7 px-2 text-xs border border-gray-200 rounded mr-1 text-gray-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="p">Normal</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                    </select>
                    {[
                      {
                        cmd: "bold",
                        icon: <Bold className="h-3.5 w-3.5" />,
                        title: "Bold",
                      },
                      {
                        cmd: "italic",
                        icon: <Italic className="h-3.5 w-3.5" />,
                        title: "Italic",
                      },
                      {
                        cmd: "underline",
                        icon: <Underline className="h-3.5 w-3.5" />,
                        title: "Underline",
                      },
                    ].map((t) => (
                      <button
                        key={t.cmd}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          execCmd(t.cmd);
                        }}
                        title={t.title}
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {t.icon}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        execCmd("insertOrderedList");
                      }}
                      title="Ordered List"
                      className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        execCmd("insertUnorderedList");
                      }}
                      title="Unordered List"
                      className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const url = window.prompt("Enter URL:");
                        if (url) execCmd("createLink", url);
                      }}
                      title="Insert Link"
                      className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        descImgInputRef.current?.click();
                      }}
                      title="Insert Image"
                      className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      ref={descImgInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDescImagePick}
                    />
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        execCmd("removeFormat");
                      }}
                      title="Clear Formatting"
                      className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Editor area */}
                  <div ref={editorWrapRef} className="relative">
                    <div
                      ref={descRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="min-h-[220px] p-3 text-sm text-gray-800 outline-none"
                      onClick={handleEditorClick}
                      onInput={(e) => {
                        clearImgSelection();
                        const el = e.currentTarget;
                        setEditorHasContent(
                          el.querySelector("img") !== null ||
                            el.innerHTML.replace(/<[^>]*>/g, "").trim().length >
                              0,
                        );
                      }}
                    />
                    {!editorHasContent && (
                      <p className="absolute top-3 left-3 text-sm text-gray-400 pointer-events-none select-none">
                        Write blog content...
                      </p>
                    )}
                    {imgBox && (
                      <div
                        className="absolute border-2 border-[#1a2b6b] rounded pointer-events-none"
                        style={{
                          top: imgBox.top,
                          left: imgBox.left,
                          width: imgBox.width,
                          height: imgBox.height,
                        }}
                      >
                        <div
                          onPointerDown={startResize}
                          onPointerMove={moveResize}
                          onPointerUp={endResize}
                          title="Drag to resize"
                          className="pointer-events-auto absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#1a2b6b] border-2 border-white rounded-sm cursor-nwse-resize shadow"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* SEO Details */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-[#1a2b6b] mb-4">SEO Details</p>
            <SeoTab
              ref={blogSeoRef}
              key={editBlog?._id ?? "new-blog"}
              productName={blogForm.title}
              urlPrefix="/blog"
              image={blogForm.imagePreview || undefined}
            />
          </div>
        </div>
      </motion.div>

      {/* Blog Attachment Details — add/edit view */}
      {blogAttachOpen && blogForm.imagePreview && (
        <AttachmentDetailsModal
          imageUrl={blogForm.imagePreview}
          imageId={blogForm.imageId}
          initialTitle={blogForm.imageTitle}
          initialAltText={blogForm.imageAltText}
          initialDescription={blogForm.imageDescription}
          onClose={() => setBlogAttachOpen(false)}
          onSaved={(data) => setBlogForm((f) => ({ ...f, imageAltText: data.altText, imageTitle: data.title, imageDescription: data.description }))}
        />
      )}
    </>
    );
  }

  // ─── List View ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-4"
    >
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["categories", "blogs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#1a2b6b] text-[#1a2b6b]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab === "categories" ? "Categories" : "Blogs"}
          </button>
        ))}
      </div>

      {/* ── Categories Tab ── */}
      {activeTab === "categories" && (
        <>
          <div className="flex justify-end">
            <button
              onClick={openAddCat}
              className="h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b]">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {catLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b] mx-auto" />
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-12 text-center text-gray-400"
                      >
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr
                        key={c._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {c.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-xs">
                          <span className="line-clamp-2">
                            {c.description || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditCat(c)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteCat(c)}
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
              page={catPage}
              totalPages={catTotalPages}
              total={catTotal}
              perPage={catPerPage}
              onPage={(p) => setCatPage(p)}
              onPerPage={(n) => {
                setCatPerPage(n);
                setCatPage(1);
              }}
            />
          </div>
        </>
      )}

      {/* ── Blogs Tab ── */}
      {activeTab === "blogs" && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category filter */}
            <div className="relative">
              <select
                value={blogCatFilter}
                onChange={(e) => {
                  setBlogCatFilter(e.target.value);
                  setBlogPage(1);
                }}
                className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] appearance-none min-w-[160px]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Month filter */}
            <div className="relative">
              <select
                value={blogMonthFilter}
                onChange={(e) => {
                  setBlogMonthFilter(e.target.value);
                  setBlogPage(1);
                }}
                className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] appearance-none min-w-[160px]"
              >
                <option value="">All Months</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Clear filters */}
            {(blogCatFilter || blogMonthFilter) && (
              <button
                onClick={() => {
                  setBlogCatFilter("");
                  setBlogMonthFilter("");
                  setBlogPage(1);
                }}
                className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}

            <div className="flex-1" />

            <button
              onClick={openAddBlog}
              className="h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Blog
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b]">
                      Image
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                      Category
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blogsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b] mx-auto" />
                      </td>
                    </tr>
                  ) : blogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-12 text-center text-gray-400"
                      >
                        No blogs found.
                      </td>
                    </tr>
                  ) : (
                    blogs.map((b) => (
                      <tr
                        key={b._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {b.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveImg(imgUrl(b.image))}
                              alt={b.title}
                              className="w-12 h-12 object-contain rounded-lg border border-gray-100 bg-gray-50 p-0.5"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ImagePlus className="h-4 w-4 text-gray-300" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                          <span className="line-clamp-2">{b.title}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                            {b.category?.name ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditBlog(b)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteBlog(b)}
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

            {/* Blogs pagination */}
            <Pagination
              page={blogPage}
              totalPages={blogTotalPages}
              total={blogTotal}
              perPage={blogPerPage}
              onPage={(p) => setBlogPage(p)}
              onPerPage={(n) => {
                setBlogPerPage(n);
                setBlogPage(1);
              }}
            />
          </div>
        </>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {/* Category Add/Edit modal */}
        {showCatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => {
              if (e.target === e.currentTarget && !catFormLoading)
                setShowCatModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-[#1a2b6b] text-lg">
                  {editCat ? "Edit Category" : "Add Category"}
                </h3>
                <button
                  onClick={() => setShowCatModal(false)}
                  disabled={catFormLoading}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={catForm.name}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Enter category name"
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={catForm.description}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Enter description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setShowCatModal(false)}
                  disabled={catFormLoading}
                  className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCat}
                  disabled={catFormLoading}
                  className="flex-1 h-10 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {catFormLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Category modal */}
        {deleteCat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleteCatLoading)
                setDeleteCat(null);
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
                Delete Category?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Remove{" "}
                <span className="font-semibold text-gray-800">
                  {deleteCat.name}
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteCat(null)}
                  disabled={deleteCatLoading}
                  className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCat}
                  disabled={deleteCatLoading}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteCatLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Blog modal */}
        {deleteBlog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleteBlogLoading)
                setDeleteBlog(null);
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
                Delete Blog?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Remove{" "}
                <span className="font-semibold text-gray-800 line-clamp-1">
                  {deleteBlog.title}
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteBlog(null)}
                  disabled={deleteBlogLoading}
                  className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBlog}
                  disabled={deleteBlogLoading}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteBlogLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blog Attachment Details */}
      {blogAttachOpen && blogForm.imagePreview && (
        <AttachmentDetailsModal
          imageUrl={blogForm.imagePreview}
          imageId={blogForm.imageId}
          initialTitle={blogForm.imageTitle}
          initialAltText={blogForm.imageAltText}
          initialDescription={blogForm.imageDescription}
          onClose={() => setBlogAttachOpen(false)}
          onSaved={(data) => setBlogForm((f) => ({ ...f, imageAltText: data.altText, imageTitle: data.title, imageDescription: data.description }))}
        />
      )}
    </motion.div>
  );
}
