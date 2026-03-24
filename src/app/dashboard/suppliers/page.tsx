"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

const AU_STATES = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
];

const COUNTRIES = ["Australia"];

interface Supplier {
  _id: string;
  name: string;
  code: string;
  email: string;
  mobile: string;
  countryCode: string;
  country: string;
  state: string;
  address: string;
  description?: string;
  taxNumber?: string;
  logo?: string;
  banner?: string;
  isActive: boolean;
  insertedAt?: number;
  productsCount?: number;
}

interface FormState {
  name: string;
  code: string;
  email: string;
  countryCode: string;
  mobile: string;
  country: string;
  state: string;
  address: string;
  description: string;
  taxNumber: string;
  logo: File | null;
  banner: File | null;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  code: "",
  email: "",
  countryCode: "61",
  mobile: "",
  country: "Australia",
  state: "",
  address: "",
  description: "",
  taxNumber: "",
  logo: null,
  banner: null,
};

function getToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("auth_token") ?? "";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-AU");
  } catch {
    return dateStr;
  }
}

function RequiredStar() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

function FileField({
  label,
  required,
  value,
  onChange,
  error,
  existingUrl,
}: {
  label: string;
  required?: boolean;
  value: File | null;
  onChange: (f: File | null) => void;
  error?: string;
  existingUrl?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold text-[#1a2b6b]">
        {label}
        {required && <RequiredStar />}
      </Label>
      {existingUrl && !value && (
        <div className="flex items-center gap-2 mb-1">
          <img
            src={existingUrl}
            alt="current"
            className="h-10 w-10 rounded object-cover border border-input"
          />
          <span className="text-xs text-muted-foreground">Current image</span>
        </div>
      )}
      <div
        className={`flex items-center border rounded-md overflow-hidden cursor-pointer ${error ? "border-red-400" : "border-input"}`}
        onClick={() => ref.current?.click()}
      >
        <span className="px-3 py-2 border-r text-sm bg-muted text-foreground font-medium whitespace-nowrap">
          Choose File
        </span>
        <span className="px-3 py-2 text-sm text-muted-foreground flex-1 truncate">
          {value ? value.name : "No file chosen"}
        </span>
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [holdTarget, setHoldTarget] = useState<Supplier | null>(null);
  const [holding, setHolding] = useState(false);
  const [existingLogo, setExistingLogo] = useState("");
  const [existingBanner, setExistingBanner] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { toast } = useToast();

  const fetchSuppliers = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch(`${API_BASE}/supplier`, {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${getToken()}`,
          "x-app-client": "ADMIN_PANEL",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      setSuppliers(list);
    } catch {
      toast({
        title: "Error",
        description: "Could not load suppliers.",
        variant: "destructive",
      });
    } finally {
      setListLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.state ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Supplier name is required.";
    if (!form.code.trim()) errs.code = "Supplier code is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email))
      errs.email =
        "Please enter a valid email address (e.g. name@example.com).";
    if (!form.mobile.trim()) errs.mobile = "Mobile number is required.";
    else if (!MOBILE_REGEX.test(form.mobile))
      errs.mobile = "Mobile number must be exactly 10 digits.";
    if (!form.country) errs.country = "Country is required.";
    if (!form.state) errs.state = "State is required.";
    if (!form.address.trim()) errs.address = "Address is required.";
    if (!editingId && !form.logo) errs.logo = "Logo is required.";
    setErrors(errs);
    const firstError = Object.values(errs)[0];
    if (firstError) {
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      return false;
    }
    return true;
  }

  function isFormValid(): boolean {
    if (!form.name.trim()) return false;
    if (!form.code.trim()) return false;
    if (!form.email.trim() || !EMAIL_REGEX.test(form.email)) return false;
    if (!form.mobile.trim() || !MOBILE_REGEX.test(form.mobile)) return false;
    if (!form.country) return false;
    if (!form.state) return false;
    if (!form.address.trim()) return false;
    if (!editingId && !form.logo) return false;
    return true;
  }

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setExistingLogo("");
    setExistingBanner("");
    setFormKey((k) => k + 1);
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s._id);
    setForm({
      name: s.name,
      code: s.code,
      email: s.email,
      countryCode: s.countryCode ?? "61",
      mobile: s.mobile ?? "",
      country: s.country ?? "Australia",
      state: s.state ?? "",
      address: s.address ?? "",
      description: s.description ?? "",
      taxNumber: s.taxNumber ?? "",
      logo: null,
      banner: null,
    });
    setErrors({});
    setExistingLogo(s.logo ?? "");
    setExistingBanner(s.banner ?? "");
    setFormKey((k) => k + 1);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("code", form.code);
      fd.append("email", form.email);
      fd.append("countryCode", form.countryCode);
      fd.append("mobile", form.mobile);
      fd.append("country", form.country);
      fd.append("state", form.state);
      fd.append("address", form.address);
      fd.append(
        "description",
        form.description.trim() || "Description about the supplier",
      );
      fd.append("taxNumber", form.taxNumber.trim() || "123456");
      if (editingId) {
        fd.append("supplierId", editingId);
        if (form.logo) {
          fd.append("logo", form.logo);
        } else {
          fd.append("keepExistingLogo", "true");
        }
        if (form.banner) {
          fd.append("banner", form.banner);
        } else {
          fd.append("keepExistingBanner", "true");
        }
      } else {
        if (form.logo) fd.append("logo", form.logo);
        if (form.banner) fd.append("banner", form.banner);
      }
      const res = await fetch(`${API_BASE}/supplier`, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          authorization: `Bearer ${getToken()}`,
          "x-app-client": "ADMIN_PANEL",
        },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Request failed");
      }
      toast({
        title: editingId ? "Supplier Updated" : "Supplier Added",
        description: `${form.name} has been ${editingId ? "updated" : "added"} successfully.`,
        variant: "success" as any,
      });
      setOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmHold = async () => {
    if (!holdTarget) return;
    setHolding(true);
    try {
      const fd = new FormData();
      fd.append("supplierId", holdTarget._id);
      fd.append("isActive", String(!holdTarget.isActive));
      const res = await fetch(`${API_BASE}/supplier`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${getToken()}`,
          "x-app-client": "ADMIN_PANEL",
        },
        body: fd,
      });
      if (!res.ok) throw new Error("Request failed");
      toast({
        title: holdTarget.isActive ? "Supplier Paused" : "Supplier Resumed",
        description: `${holdTarget.name} has been ${holdTarget.isActive ? "paused" : "resumed"}.`,
        variant: "success" as any,
      });
      setHoldTarget(null);
      fetchSuppliers();
    } catch {
      toast({
        title: "Error",
        description: "Could not update supplier status.",
        variant: "destructive",
      });
    } finally {
      setHolding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/supplier?supplierId=${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: {
            authorization: `Bearer ${getToken()}`,
            "x-app-client": "ADMIN_PANEL",
          },
        },
      );
      if (!res.ok) throw new Error("Request failed");
      toast({
        title: "Supplier Deleted",
        description: `${deleteTarget.name} has been deleted.`,
        variant: "destructive",
      });
      setDeleteTarget(null);
      fetchSuppliers();
    } catch {
      toast({
        title: "Error",
        description: "Could not delete supplier.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <p className="text-muted-foreground text-sm">
          Manage your product suppliers and vendors.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Here"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={openAdd}
                className="gap-1.5 bg-[#1a2b6b] hover:bg-[#152356] text-white shrink-0"
              >
                <Plus className="h-4 w-4" /> Add New +
              </Button>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white dark:bg-card border-b">
                    <TableHead className="font-bold text-foreground">
                      Supplier Name
                    </TableHead>
                    <TableHead className="font-bold text-foreground">
                      Supplier Code
                    </TableHead>
                    <TableHead className="font-bold text-foreground">
                      State
                    </TableHead>
                    <TableHead className="font-bold text-foreground">
                      Start Date
                    </TableHead>
                    <TableHead className="font-bold text-foreground text-center">
                      No Of Products
                    </TableHead>
                    <TableHead className="font-bold text-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No suppliers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((s) => (
                      <TableRow
                        key={s._id}
                        className={!s.isActive ? "opacity-50" : ""}
                      >
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.code}
                        </TableCell>
                        <TableCell className="text-[#1a7ae2] font-medium">
                          {s.state}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.insertedAt
                            ? formatDate(new Date(s.insertedAt).toISOString())
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.productsCount ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => openEdit(s)}
                              title="Edit"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => setDeleteTarget(s)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              className={`transition-colors ${!s.isActive ? "text-orange-500" : "text-muted-foreground hover:text-orange-500"}`}
                              onClick={() => setHoldTarget(s)}
                              title={s.isActive ? "Pause" : "Resume"}
                            >
                              {s.isActive ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <rect
                                    x="6"
                                    y="4"
                                    width="4"
                                    height="16"
                                    rx="1"
                                  />
                                  <rect
                                    x="14"
                                    y="4"
                                    width="4"
                                    height="16"
                                    rx="1"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!listLoading && filtered.length > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                perPage={perPage}
                onPage={setPage}
                onPerPage={(n) => {
                  setPerPage(n);
                  setPage(1);
                }}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add / Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!saving) setOpen(v);
        }}
      >
        <DialogContent
          key={formKey}
          className="max-w-4xl max-h-[90vh] overflow-y-auto p-0"
        >
          <DialogHeader className="px-6 py-5 bg-[#1a2b6b] rounded-t-2xl">
            <DialogTitle className="text-white text-xl font-bold">
              {editingId ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1a2b6b]">
                  Supplier Name <RequiredStar />
                </Label>
                <Input
                  placeholder="Enter supplier name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={`text-gray-900 ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1a2b6b]">
                  Supplier Code <RequiredStar />
                </Label>
                <Input
                  placeholder="Enter supplier code"
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value)}
                  className={`text-gray-900 ${errors.code ? "border-red-400" : ""}`}
                />
                {errors.code && (
                  <p className="text-xs text-red-500">{errors.code}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1a2b6b]">
                  Supplier E-Mail <RequiredStar />
                </Label>
                <Input
                  type="email"
                  placeholder="Enter supplier email"
                  value={form.email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setField("email", val);
                    if (val && !EMAIL_REGEX.test(val)) {
                      setErrors((prev) => ({
                        ...prev,
                        email:
                          "Please enter a valid email address (e.g. name@example.com).",
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`text-gray-900 ${errors.email ? "border-red-400" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1a2b6b]">
                  Supplier Contact <RequiredStar />
                </Label>
                <Input
                  placeholder="Enter contact number"
                  value={form.mobile}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setField("mobile", val);
                    if (val.length > 0 && val.length < 10) {
                      setErrors((prev) => ({
                        ...prev,
                        mobile: `Contact number must be exactly 10 digits (${val.length}/10 entered).`,
                      }));
                    } else if (val.length === 10) {
                      setErrors((prev) => ({ ...prev, mobile: undefined }));
                    }
                  }}
                  className={`text-gray-900 ${errors.mobile ? "border-red-400" : ""}`}
                />
                {errors.mobile && (
                  <p className="text-xs text-red-500">{errors.mobile}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1a2b6b]">
                  Supplier Country <RequiredStar />
                </Label>
                <Select
                  value={form.country}
                  onValueChange={(v) => setField("country", v)}
                >
                  <SelectTrigger
                    className={`text-gray-900 ${errors.country ? "border-red-400" : ""}`}
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-xs text-red-500">{errors.country}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1a2b6b]">
                  Supplier State <RequiredStar />
                </Label>
                <Select
                  value={form.state}
                  onValueChange={(v) => setField("state", v)}
                >
                  <SelectTrigger
                    className={`text-gray-900 ${errors.state ? "border-red-400" : ""}`}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {AU_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-xs text-red-500">{errors.state}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1a2b6b]">
                  Supplier Address <RequiredStar />
                </Label>
                <Textarea
                  placeholder="Enter supplier address"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className={`resize-none h-[90px] text-gray-900 ${errors.address ? "border-red-400" : ""}`}
                />
                {errors.address && (
                  <p className="text-xs text-red-500">{errors.address}</p>
                )}
              </div>
              <FileField
                label="Supplier Logo"
                required
                value={form.logo}
                onChange={(f) => setField("logo", f)}
                error={errors.logo}
                existingUrl={existingLogo}
              />
              <FileField
                label="Upload Banner Image"
                value={form.banner}
                onChange={(f) => setField("banner", f)}
                existingUrl={existingBanner}
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="uppercase tracking-wide text-xs font-bold px-6 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isFormValid()}
              className="bg-[#1a2b6b] hover:bg-[#152356] text-white uppercase tracking-wide text-xs font-bold px-6 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingId ? "Updating..." : "Saving..."}
                </>
              ) : editingId ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause / Resume Confirm */}
      <Dialog
        open={!!holdTarget}
        onOpenChange={(v) => {
          if (!v && !holding) setHoldTarget(null);
        }}
      >
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="px-5 py-4 bg-[#1a2b6b] rounded-t-2xl">
            <DialogTitle className="text-white text-lg font-bold">
              {holdTarget?.isActive
                ? "Hold the Supplier Products?"
                : "Resume the Supplier Products?"}
            </DialogTitle>
          </DialogHeader>
          <p className="px-5 py-6 text-sm text-gray-700 leading-relaxed">
            {holdTarget?.isActive
              ? `Are you sure you want to pause ${holdTarget.name}?`
              : `Are you sure you want to resume ${holdTarget?.name}?`}
          </p>
          <DialogFooter className="px-5 py-4 border-t bg-gray-50 rounded-b-2xl gap-2">
            <Button
              variant="outline"
              onClick={() => setHoldTarget(null)}
              disabled={holding}
              className="uppercase tracking-wide text-xs font-bold px-6 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmHold}
              disabled={holding}
              className="bg-[#1a2b6b] hover:bg-[#152356] text-white uppercase tracking-wide text-xs font-bold px-6"
            >
              {holding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : holdTarget?.isActive ? (
                "Hold"
              ) : (
                "Resume"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v && !deleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="px-5 py-4 bg-[#1a2b6b] rounded-t-2xl">
            <DialogTitle className="text-white text-lg font-bold">
              Delete Supplier?
            </DialogTitle>
          </DialogHeader>
          <p className="px-5 py-6 text-sm text-gray-700 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              {deleteTarget?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter className="px-5 py-4 border-t bg-gray-50 rounded-b-2xl gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="uppercase tracking-wide text-xs font-bold px-6 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white uppercase tracking-wide text-xs font-bold px-6"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
