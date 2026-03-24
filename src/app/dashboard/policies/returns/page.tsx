"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

function getToken() {
  return typeof window !== "undefined" ? sessionStorage.getItem("auth_token") : null;
}

function authHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "x-app-client": "ADMIN_PANEL",
    accept: "application/json",
    "content-type": "application/json",
  };
}

interface ReturnPolicy {
  id: string;
  name: string;
  description: string;
  acceptReturns: boolean;
  returnPeriod?: number;
  returnShippingCostPayer?: string;
  marketplaceId: string;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white";
const inputErrCls =
  "w-full h-10 px-3 border border-red-400 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200 transition-colors bg-white";
const selectCls =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white";

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
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-t-xl border-b border-gray-200 sticky top-0 z-10">
          <h3 className="text-base font-bold text-[#1a2b6b]">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Pagination({
  page,
  totalPages,
  perPage,
  onPage,
  onPerPage,
}: {
  page: number;
  totalPages: number;
  perPage: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {[5, 10, 25].map((n) => (
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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ReturnForm {
  id?: string;
  name: string;
  description: string;
  acceptReturns: boolean;
  returnPeriod: number;
  returnShippingCostPayer: string;
  isEdit: boolean;
}

export default function ReturnPoliciesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [policies, setPolicies] = useState<ReturnPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReturnPolicy | null>(null);
  const [form, setForm] = useState<ReturnForm>({
    name: "",
    description: "",
    acceptReturns: false,
    returnPeriod: 14,
    returnShippingCostPayer: "SELLER",
    isEdit: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const totalPages = Math.max(1, Math.ceil(policies.length / perPage));
  const paged = policies.slice((page - 1) * perPage, page * perPage);

  const loadPolicies = useCallback(() => {
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/ebay/return-policy/list`, {
      headers: authHeaders(token),
    })
      .then((r) => {
        if (r.status === 401) {
          router.push("/");
          throw new Error("401");
        }
        return r.json();
      })
      .then((d) => setPolicies(d.data || []))
      .catch((err) => {
        if (err.message !== "401")
          toast({
            title: "Error",
            description: "Failed to load return policies",
            variant: "destructive",
          });
      })
      .finally(() => setLoading(false));
  }, [router, toast]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const openAdd = () => {
    setForm({
      name: "",
      description: "",
      acceptReturns: false,
      returnPeriod: 14,
      returnShippingCostPayer: "SELLER",
      isEdit: false,
    });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (p: ReturnPolicy) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || "",
      acceptReturns: p.acceptReturns,
      returnPeriod: p.returnPeriod ?? 14,
      returnShippingCostPayer: p.returnShippingCostPayer || "SELLER",
      isEdit: true,
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const base: Record<string, any> = {
      name: form.name,
      description: form.description,
      acceptReturns: form.acceptReturns,
    };
    if (form.acceptReturns) {
      base.returnPeriod = form.returnPeriod;
      base.returnShippingCostPayer = form.returnShippingCostPayer;
    }
    if (!form.isEdit) {
      base.marketplaceId = "EBAY_AU";
    }
    return base;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (form.isEdit && form.id) {
        res = await fetch(`${API_BASE}/ebay/return-policy/${form.id}`, {
          method: "PATCH",
          headers: authHeaders(token),
          body: JSON.stringify(buildPayload()),
        });
      } else {
        res = await fetch(`${API_BASE}/ebay/return-policy`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify(buildPayload()),
        });
      }
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to save");
      }
      toast({
        title: "Success",
        description: `Return policy ${form.isEdit ? "updated" : "created"} successfully.`,
        variant: "success" as any,
      });
      setOpen(false);
      loadPolicies();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save policy",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: ReturnPolicy) => {
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/ebay/return-policy/${p.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to delete");
      }
      toast({
        title: "Deleted",
        description: "Return policy deleted.",
        variant: "destructive",
      });
      setDeleteTarget(null);
      loadPolicies();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete policy",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Return Policies</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-9 px-4 bg-[#1a2b6b] hover:bg-[#142258] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Policy
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#1a2b6b]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-700 hidden sm:table-cell">
                    Description
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-700 hidden md:table-cell">
                    Accept Returns
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-700 hidden lg:table-cell">
                    Return Period
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-700 hidden xl:table-cell">
                    Shipping Cost Payer
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((policy) => (
                  <tr
                    key={policy.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {policy.name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs hidden sm:table-cell max-w-xs truncate">
                      {policy.description || "—"}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          policy.acceptReturns
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {policy.acceptReturns ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 hidden lg:table-cell">
                      {policy.acceptReturns && policy.returnPeriod
                        ? `${policy.returnPeriod} Days`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 hidden xl:table-cell">
                      {policy.acceptReturns
                        ? policy.returnShippingCostPayer || "—"
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(policy)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a2b6b] hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(policy)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {policies.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-gray-400"
                    >
                      No return policies yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          onPage={setPage}
          onPerPage={setPerPage}
        />
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {open && (
          <Modal
            title={form.isEdit ? "Edit Return Policy" : "Add Return Policy"}
            onClose={() => setOpen(false)}
          >
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter policy name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={errors.name ? inputErrCls : inputCls}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Enter description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors bg-white resize-none"
                  rows={4}
                />
              </div>

              {/* Accept Returns */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.acceptReturns}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, acceptReturns: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-gray-300 accent-[#1a2b6b]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Accept Returns
                </span>
              </label>

              {/* Conditional fields */}
              {form.acceptReturns && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Returns Within
                    </label>
                    <select
                      value={form.returnPeriod}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          returnPeriod: Number(e.target.value),
                        }))
                      }
                      className={selectCls}
                    >
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={60}>60 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Return Shipping Cost Payer
                    </label>
                    <select
                      value={form.returnShippingCostPayer}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          returnShippingCostPayer: e.target.value,
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="BUYER">BUYER</option>
                      <option value="SELLER">SELLER</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setOpen(false)}
                className="h-9 px-5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors uppercase tracking-wide"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-5 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-lg text-sm font-semibold transition-colors uppercase tracking-wide flex items-center gap-2 disabled:opacity-70"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                SAVE
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <Modal title="Delete Policy" onClose={() => setDeleteTarget(null)}>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-6">
                Delete{" "}
                <span className="font-semibold text-gray-900">
                  {deleteTarget.name}
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="h-9 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleting}
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
