"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Trash2,
  Plus,
  Upload,
  ImageIcon,
  X,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("auth_token");
}

function authHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "x-app-client": "ADMIN_PANEL",
    accept: "application/json",
  };
}

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ShippingRow {
  stateId: string;
  groupId: string;
  state: string;
  zone: string;
  postalCodes: string[];
  basePrice: number;
  pricePerKg: number;
  expressBasePrice: number;
  expressPricePerKg: number;
}

interface Banner {
  _id: string;
  image: string;
  url: string;
  isActive: boolean;
  insertedAt: number;
}

interface BankInfo {
  _id: string;
  bankName: string;
  bsb: string;
  accountNumber: string;
  description: string;
  insertedAt?: number;
}

// ─── Zone colours ──────────────────────────────────────────────────────────────

const zoneStyle: Record<string, string> = {
  Local: "bg-green-100 text-green-700",
  Metro: "bg-blue-100  text-blue-700",
  Remote: "bg-amber-100 text-amber-700",
  Capital: "bg-orange-100 text-orange-700",
};

// ─── Reusable Modal ────────────────────────────────────────────────────────────

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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
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

function ModalFooter({
  onCancel,
  onSave,
  saving,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
      <button
        onClick={onCancel}
        disabled={saving}
        className="h-9 px-5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors uppercase tracking-wide disabled:opacity-50"
      >
        CANCEL
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="h-9 px-5 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors uppercase tracking-wide disabled:opacity-50 flex items-center gap-2"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        SAVE
      </button>
    </div>
  );
}

// ─── Field helper ──────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1a2b6b] mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors";
const inputErrCls =
  "w-full h-10 px-3 border border-red-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors";
const readonlyCls =
  "w-full h-10 px-3 border border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-500 flex items-center";

// ─── Shared Pagination ─────────────────────────────────────────────────────────

function TablePagination({
  page,
  totalPages,
  perPage,
  perPageOptions,
  onPage,
  onPerPage,
}: {
  page: number;
  totalPages: number;
  perPage: number;
  perPageOptions: number[];
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {perPageOptions.map((n) => (
          <button
            key={n}
            onClick={() => {
              onPerPage(n);
              onPage(1);
            }}
            className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all ${
              perPage === n
                ? "bg-white shadow text-[#1a2b6b]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#1a2b6b] hover:border-[#1a2b6b]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1 bg-gray-100 rounded-2xl px-2 py-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                p === page
                  ? "bg-[#1a2b6b] text-white shadow"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#1a2b6b] hover:border-[#1a2b6b]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Shipping Tab ──────────────────────────────────────────────────────────────

function ShippingTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [rows, setRows] = useState<ShippingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editRow, setEditRow] = useState<ShippingRow | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShippingRow | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const paged = rows.slice((page - 1) * perPage, page * perPage);

  const loadCharges = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/supplier/charges`, {
        headers: authHeaders(token),
      });
      if (res.status === 401) { router.push("/"); return; }
      const d = await res.json();
      if (d.status && Array.isArray(d.data)) {
        const flattened: ShippingRow[] = [];
        for (const state of d.data) {
          for (const group of state.groups) {
            flattened.push({
              stateId: state._id,
              groupId: group._id,
              state: state.state,
              zone: group.name,
              postalCodes: group.postalCodes ?? [],
              basePrice: group.basePrice,
              pricePerKg: group.pricePerKg,
              expressBasePrice: group.expressBasePrice,
              expressPricePerKg: group.expressPricePerKg,
            });
          }
        }
        setRows(flattened);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load shipping charges.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => { loadCharges(); }, [loadCharges]);

  const openEdit = (row: ShippingRow) => {
    setEditRow({ ...row });
    setErrors({});
    setOpen(true);
  };

  const validate = (): boolean => {
    if (!editRow) return false;
    const e: Record<string, string> = {};
    if (isNaN(editRow.basePrice) || editRow.basePrice < 0)
      e.basePrice = "Must be a valid non-negative number";
    if (isNaN(editRow.pricePerKg) || editRow.pricePerKg < 0)
      e.pricePerKg = "Must be a valid non-negative number";
    if (isNaN(editRow.expressBasePrice) || editRow.expressBasePrice < 0)
      e.expressBasePrice = "Must be a valid non-negative number";
    if (isNaN(editRow.expressPricePerKg) || editRow.expressPricePerKg < 0)
      e.expressPricePerKg = "Must be a valid non-negative number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!editRow || !validate()) return;
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/supplier/charges`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify({
          stateId: editRow.stateId,
          groupId: editRow.groupId,
          name: editRow.zone,
          postalCodes: editRow.postalCodes,
          basePrice: editRow.basePrice,
          pricePerKg: editRow.pricePerKg,
          expressBasePrice: editRow.expressBasePrice,
          expressPricePerKg: editRow.expressPricePerKg,
        }),
      });
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) throw new Error("Save failed");
      setRows((r) => r.map((x) => x.groupId === editRow.groupId ? editRow : x));
      setOpen(false);
      toast({ title: "Saved", description: "Shipping price updated.", variant: "success" as any });
    } catch {
      toast({ title: "Error", description: "Failed to save shipping price.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ShippingRow) => {
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/supplier/charges/${row.stateId}/groups/${row.groupId}`,
        { method: "DELETE", headers: authHeaders(token) }
      );
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) throw new Error("Delete failed");
      setRows((r) => r.filter((x) => x.groupId !== row.groupId));
      setDeleteTarget(null);
      toast({ title: "Deleted", description: "Shipping zone removed.", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Failed to delete shipping zone.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap">
                  State Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  Destination Zone
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap hidden md:table-cell">
                  Total Zip Codes
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell whitespace-nowrap">
                  Std Base ($)
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell whitespace-nowrap">
                  Std /kg ($)
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden xl:table-cell whitespace-nowrap">
                  Exp Base ($)
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden xl:table-cell whitespace-nowrap">
                  Exp /kg ($)
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((row) => (
                <tr key={row.groupId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 text-xs font-medium whitespace-nowrap">
                    {row.state}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${zoneStyle[row.zone] || "bg-gray-100 text-gray-600"}`}
                    >
                      {row.zone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs hidden md:table-cell">
                    {row.postalCodes.length.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-800 text-xs font-semibold hidden lg:table-cell whitespace-nowrap">
                    ${row.basePrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell whitespace-nowrap">
                    ${row.pricePerKg.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-800 text-xs font-semibold hidden xl:table-cell whitespace-nowrap">
                    ${row.expressBasePrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell whitespace-nowrap">
                    ${row.expressPricePerKg.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(row)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(row)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    No shipping data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        perPageOptions={[10, 25, 50]}
        onPage={setPage}
        onPerPage={setPerPage}
      />

      {/* Edit Modal */}
      <AnimatePresence>
        {open && editRow && (
          <Modal title="Edit Shipping Price" onClose={() => setOpen(false)}>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="State">
                  <div className={readonlyCls}>{editRow.state}</div>
                </Field>
                <Field label="Destination Zone">
                  <div className={readonlyCls}>{editRow.zone}</div>
                </Field>
                <Field label="Total Postal Codes">
                  <div className={readonlyCls}>{editRow.postalCodes.length} codes</div>
                </Field>
                <div />
                <Field label="Standard Shipping Base Price ($AUD)" error={errors.basePrice}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editRow.basePrice}
                    onChange={(e) =>
                      setEditRow({ ...editRow, basePrice: parseFloat(e.target.value) || 0 })
                    }
                    className={errors.basePrice ? inputErrCls : inputCls}
                  />
                </Field>
                <Field label="Standard Shipping Per kg Price ($AUD)" error={errors.pricePerKg}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editRow.pricePerKg}
                    onChange={(e) =>
                      setEditRow({ ...editRow, pricePerKg: parseFloat(e.target.value) || 0 })
                    }
                    className={errors.pricePerKg ? inputErrCls : inputCls}
                  />
                </Field>
                <Field label="Express Shipping Base Price ($AUD)" error={errors.expressBasePrice}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editRow.expressBasePrice}
                    onChange={(e) =>
                      setEditRow({ ...editRow, expressBasePrice: parseFloat(e.target.value) || 0 })
                    }
                    className={errors.expressBasePrice ? inputErrCls : inputCls}
                  />
                </Field>
                <Field label="Express Shipping Per kg Price ($AUD)" error={errors.expressPricePerKg}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editRow.expressPricePerKg}
                    onChange={(e) =>
                      setEditRow({ ...editRow, expressPricePerKg: parseFloat(e.target.value) || 0 })
                    }
                    className={errors.expressPricePerKg ? inputErrCls : inputCls}
                  />
                </Field>
              </div>
              {editRow.postalCodes.length > 0 && (
                <Field label="Postal Codes (read-only)">
                  <div className="w-full px-3 py-2 border border-gray-100 rounded-lg text-xs bg-gray-50 text-gray-500 max-h-32 overflow-y-auto leading-5">
                    {editRow.postalCodes.join(", ")}
                  </div>
                </Field>
              )}
            </div>
            <ModalFooter onCancel={() => setOpen(false)} onSave={handleSave} saving={saving} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <Modal title="Delete Shipping Zone" onClose={() => setDeleteTarget(null)}>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Delete{" "}
                <span className="font-semibold text-gray-900">
                  {deleteTarget.state} – {deleteTarget.zone}
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="h-9 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleting}
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Banner Images Tab ─────────────────────────────────────────────────────────

function BannersTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ url: "" });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const totalPages = Math.max(1, Math.ceil(banners.length / perPage));
  const paged = banners.slice((page - 1) * perPage, page * perPage);

  const loadBanners = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/carousel-pics`, {
        headers: authHeaders(token),
      });
      if (res.status === 401) { router.push("/"); return; }
      const d = await res.json();
      if (d.status && Array.isArray(d.data)) setBanners(d.data);
    } catch {
      toast({ title: "Error", description: "Failed to load banners.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => { loadBanners(); }, [loadBanners]);

  const openUpload = () => {
    setUploadForm({ url: "" });
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setUploadOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setFilePreview(null); return; }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      e.target.value = "";
      setFilePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadSave = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "Image required", description: "Please select an image to upload.", variant: "destructive" });
      return;
    }
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("url", uploadForm.url);
      const res = await fetch(`${API_BASE}/carousel-pics`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
        body: fd,
      });
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) throw new Error("Upload failed");
      await loadBanners();
      setUploadOpen(false);
      toast({ title: "Uploaded", description: "Banner image uploaded successfully.", variant: "success" as any });
    } catch {
      toast({ title: "Error", description: "Failed to upload banner.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setTogglingId(banner._id);
    try {
      const res = await fetch(`${API_BASE}/carousel-pics`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify({ picId: banner._id, isActive: !banner.isActive }),
      });
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) throw new Error("Toggle failed");
      setBanners((b) =>
        b.map((x) => x._id === banner._id ? { ...x, isActive: !x.isActive } : x)
      );
    } catch {
      toast({ title: "Error", description: "Failed to update banner status.", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (banner: Banner) => {
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/carousel-pics?picId=${banner._id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) throw new Error("Delete failed");
      setBanners((b) => b.filter((x) => x._id !== banner._id));
      setDeleteTarget(null);
      toast({ title: "Deleted", description: "Banner removed.", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Failed to delete banner.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={openUpload}
          className="flex items-center gap-2 h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4" /> Upload
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
                  Redirect URL
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((banner) => (
                <tr key={banner._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="h-14 w-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {banner.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={banner.image}
                          alt="Banner"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs">
                    {banner.url ? (
                      <span className="text-[#1a2b6b] break-all line-clamp-2">
                        {banner.url}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">No URL</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        banner.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDeleteTarget(banner)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(banner)}
                        disabled={togglingId === banner._id}
                        className={`p-1.5 rounded-lg transition-colors ${
                          banner.isActive
                            ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                        }`}
                        title={banner.isActive ? "Deactivate" : "Activate"}
                      >
                        {togglingId === banner._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : banner.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    No banners uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        perPageOptions={[5, 10, 25]}
        onPage={setPage}
        onPerPage={setPerPage}
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadOpen && (
          <Modal title="Upload Banner Image" onClose={() => setUploadOpen(false)}>
            <div className="p-6 space-y-4">
              <Field label="Redirect URL (optional)">
                <input
                  type="url"
                  placeholder="https://..."
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({ url: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Banner Image *">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-video max-h-60 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-[#1a2b6b]/50 hover:bg-gray-100 transition-colors overflow-hidden"
                >
                  {filePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-400">
                        Click to select image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WebP up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </Field>
            </div>
            <ModalFooter
              onCancel={() => setUploadOpen(false)}
              onSave={handleUploadSave}
              saving={saving}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <Modal title="Delete Banner" onClose={() => setDeleteTarget(null)}>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this banner image? This cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="h-9 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleting}
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Bank Info Tab ─────────────────────────────────────────────────────────────

function BankTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editBank, setEditBank] = useState<Partial<BankInfo> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankInfo | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const totalPages = Math.max(1, Math.ceil(banks.length / perPage));
  const paged = banks.slice((page - 1) * perPage, page * perPage);

  const loadBanks = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bank-info`, {
        headers: authHeaders(token),
      });
      if (res.status === 401) { router.push("/"); return; }
      const d = await res.json();
      if (d.status) {
        const data = Array.isArray(d.data) ? d.data : d.data ? [d.data] : [];
        setBanks(data.filter(Boolean));
      }
    } catch {
      toast({ title: "Error", description: "Failed to load bank info.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => { loadBanks(); }, [loadBanks]);

  const emptyForm = (): Partial<BankInfo> => ({
    _id: "",
    bankName: "",
    accountNumber: "",
    bsb: "",
    description: "",
  });

  const openAdd = () => {
    setEditBank(emptyForm());
    setErrors({});
    setOpen(true);
  };

  const openEdit = (b: BankInfo) => {
    setEditBank({ ...b });
    setErrors({});
    setOpen(true);
  };

  const validate = (): boolean => {
    if (!editBank) return false;
    const e: Record<string, string> = {};
    if (!editBank.bankName?.trim()) e.bankName = "Bank name is required";
    if (!editBank.accountNumber?.trim()) e.accountNumber = "Account number is required";
    if (!editBank.bsb?.trim()) e.bsb = "BSB is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!editBank || !validate()) return;
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        _id: editBank._id ?? "",
        bankName: editBank.bankName!.trim(),
        bsb: editBank.bsb!.trim(),
        accountNumber: editBank.accountNumber!.trim(),
        description: (editBank.description ?? "").trim(),
      };
      if (editBank._id && editBank.insertedAt) {
        body.insertedAt = editBank.insertedAt;
      }
      const res = await fetch(`${API_BASE}/bank-info`, {
        method: "POST",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) throw new Error("Save failed");
      const d = await res.json();
      if (editBank._id) {
        setBanks((b) =>
          b.map((x) =>
            x._id === editBank._id
              ? { ...x, bankName: body.bankName as string, bsb: body.bsb as string, accountNumber: body.accountNumber as string, description: body.description as string }
              : x
          )
        );
      } else {
        const newRecord: BankInfo = d.data ?? { ...body, _id: String(Date.now()) } as BankInfo;
        setBanks((b) => [...b, newRecord]);
      }
      setOpen(false);
      toast({ title: "Saved", description: "Bank info saved.", variant: "success" as any });
    } catch {
      toast({ title: "Error", description: "Failed to save bank info.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: BankInfo) => {
    const token = getToken();
    if (!token) { router.push("/"); return; }
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/bank-info?id=${b._id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) throw new Error("Delete failed");
      setBanks((bk) => bk.filter((x) => x._id !== b._id));
      setDeleteTarget(null);
      toast({ title: "Deleted", description: "Bank info removed.", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Failed to delete bank info.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Add New +
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-[#1a2b6b]">
                  Bank Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                  Account Number
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                  BSB
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                  Description
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((bank) => (
                <tr key={bank._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {bank.bankName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 hidden sm:table-cell">
                    {bank.accountNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 hidden md:table-cell">
                    {bank.bsb}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {bank.description}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(bank)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(bank)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    No bank accounts added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        perPageOptions={[5, 10, 25]}
        onPage={setPage}
        onPerPage={setPerPage}
      />

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {open && editBank !== null && (
          <Modal
            title={editBank._id ? "Edit Bank Info" : "Add Bank Info"}
            onClose={() => setOpen(false)}
          >
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bank Name *" error={errors.bankName}>
                  <input
                    type="text"
                    placeholder="Enter bank name"
                    value={editBank.bankName || ""}
                    onChange={(e) =>
                      setEditBank((b) => ({ ...b, bankName: e.target.value }))
                    }
                    className={errors.bankName ? inputErrCls : inputCls}
                  />
                </Field>
                <Field label="Account Number *" error={errors.accountNumber}>
                  <input
                    type="text"
                    placeholder="Enter account number"
                    value={editBank.accountNumber || ""}
                    onChange={(e) =>
                      setEditBank((b) => ({ ...b, accountNumber: e.target.value }))
                    }
                    className={errors.accountNumber ? inputErrCls : inputCls}
                  />
                </Field>
                <Field label="BSB *" error={errors.bsb}>
                  <input
                    type="text"
                    placeholder="Enter BSB"
                    value={editBank.bsb || ""}
                    onChange={(e) =>
                      setEditBank((b) => ({ ...b, bsb: e.target.value }))
                    }
                    className={errors.bsb ? inputErrCls : inputCls}
                  />
                </Field>
                <Field label="Description">
                  <input
                    type="text"
                    placeholder="Enter description"
                    value={editBank.description || ""}
                    onChange={(e) =>
                      setEditBank((b) => ({ ...b, description: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
            <ModalFooter onCancel={() => setOpen(false)} onSave={handleSave} saving={saving} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <Modal title="Delete Bank Info" onClose={() => setDeleteTarget(null)}>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Delete{" "}
                <span className="font-semibold text-gray-900">
                  {deleteTarget.bankName}
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="h-9 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleting}
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────────

const SETTINGS_TABS = [
  { id: "shipping", label: "Shipping Prices" },
  { id: "banners", label: "Banner Images" },
  { id: "bank", label: "Bank Info" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("shipping");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-4"
    >
      {/* Tab Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex flex-wrap gap-1.5">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-medium border rounded-lg transition-all whitespace-nowrap ${
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

      {/* Content */}
      <div>
        {activeTab === "shipping" && <ShippingTab />}
        {activeTab === "banners" && <BannersTab />}
        {activeTab === "bank" && <BankTab />}
      </div>
    </motion.div>
  );
}
