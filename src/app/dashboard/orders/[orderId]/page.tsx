"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  StickyNote,
  RefreshCw,
  XCircle,
  Loader2,
  Package,
  Star,
  CheckCircle2,
  Clock,
  Truck,
  Ban,
  ShoppingBag,
  Info,
  MapPin,
  PieChart,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { resolveImg } from "@/lib/utils";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

interface ProductRecord {
  _id: string;
  name: string;
  displayPic: string;
  skuCode: string;
  rating: number;
}

interface OrderProduct {
  product: {
    record: ProductRecord;
    soldPrice: number;
    quantity: number;
  };
  accessories: unknown[];
  _id: string;
}

interface Address {
  label: string;
  name: string;
  email: string;
  countryCode: string;
  mobile: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  _id: string;
}

interface HistoryEntry {
  status: string;
  _id: string;
  insertedAt: number;
  courierName?: string;
  trackingId?: string;
}

interface RemarkEntry {
  message: string;
  _id: string;
  insertedAt: number;
}

interface OrderDetail {
  _id: string;
  user: { _id: string; name: string; email: string };
  orderId: string;
  invoiceNo: string;
  products: OrderProduct[];
  shippingAddress: Address;
  billingAddress: Address;
  shippingType: string;
  paymentMode: string;
  history: HistoryEntry[];
  productsPrice: number;
  discount: number;
  shippingCharges: number;
  taxAmount: number;
  finalPrice: number;
  refund: number;
  status: string;
  paymentStatus: string;
  remarks: RemarkEntry[];
  courierName?: string;
  trackingId?: string;
  insertedAt: number;
  updatedAt: number;
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

function formatPaymentMode(mode: string) {
  return mode.replace(/_/g, " ");
}

// ─── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<
  OrderStatus,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ReactNode;
  }
> = {
  Pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  Confirmed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Processing: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
  Dispatched: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    dot: "bg-cyan-500",
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  Delivered: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Cancelled: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    icon: <Ban className="w-3.5 h-3.5" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as OrderStatus] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.icon}
      {status}
    </span>
  );
}

// ─── Section Card ───────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
        {icon && <span className="text-[#1a2b6b]">{icon}</span>}
        <h3 className="text-sm font-semibold text-[#1a2b6b]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Info Row ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-36 shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-800 flex-1">{value}</span>
    </div>
  );
}

// ─── Order Timeline ────────────────────────────────────────────────────────────
type TEntry =
  | {
      kind: "status";
      _id: string;
      status: string;
      insertedAt: number;
      courierName?: string;
      trackingId?: string;
    }
  | { kind: "remark"; _id: string; message: string; insertedAt: number };

function OrderTimeline({
  history,
  remarks,
  courierName,
  trackingId,
}: {
  history: HistoryEntry[];
  remarks: RemarkEntry[];
  courierName?: string;
  trackingId?: string;
}) {
  const entries: TEntry[] = [
    ...history.map((h) => ({
      kind: "status" as const,
      _id: h._id,
      status: h.status,
      insertedAt: h.insertedAt,
      // Prefer courier/tracking stored on the history entry; fall back to order-level
      courierName: h.courierName ?? courierName,
      trackingId: h.trackingId ?? trackingId,
    })),
    ...remarks.map((r) => ({
      kind: "remark" as const,
      _id: r._id,
      message: r.message,
      insertedAt: r.insertedAt,
    })),
  ].sort((a, b) => b.insertedAt - a.insertedAt);

  if (entries.length === 0) {
    return <p className="text-xs text-gray-400">No history available.</p>;
  }

  return (
    <div>
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        if (entry.kind === "status") {
          const cfg = statusConfig[entry.status as OrderStatus] ?? {
            text: "text-gray-600",
            dot: "bg-gray-400",
          };
          return (
            <div key={entry._id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full mt-1 shrink-0 ${cfg.dot}`}
                />
                {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
              </div>
              <div className="pb-4 flex-1">
                <p className="text-xs text-gray-400">
                  {formatDate(entry.insertedAt)}
                </p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  Status Update
                </p>
                <p className={`text-sm font-semibold mt-0.5 ${cfg.text}`}>
                  Order status changed to {entry.status}
                </p>
                {entry.status === "Dispatched" &&
                  (entry.courierName || entry.trackingId) && (
                    <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 space-y-1">
                      {entry.courierName && (
                        <p className="text-xs text-gray-500">
                          Courier:{" "}
                          <span className="font-semibold text-gray-700">
                            {entry.courierName}
                          </span>
                        </p>
                      )}
                      {entry.trackingId && (
                        <p className="text-xs text-gray-500">
                          Tracking ID:{" "}
                          <span className="font-mono font-semibold text-gray-700">
                            {entry.trackingId}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
              </div>
            </div>
          );
        } else {
          return (
            <div key={entry._id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0 bg-indigo-400" />
                {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
              </div>
              <div className="pb-4 flex-1">
                <p className="text-xs text-gray-400">
                  {formatDate(entry.insertedAt)}
                </p>
                <p className="text-xs font-semibold text-indigo-500 mt-0.5">
                  Note Added
                </p>
                <p className="text-sm text-gray-700 mt-0.5 leading-snug">
                  {entry.message}
                </p>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

// ─── Update Status Modal ────────────────────────────────────────────────────────
const COURIER_OPTIONS = [
  "Aus post",
  "Team global express",
  "Aramex",
  "Border express",
  "Star track",
  "Direct freight",
  "Courier please",
];

function getAvailableStatuses(currentStatus: string): string[] {
  if (currentStatus === "Dispatched") return ["Delivered"];
  return ["Processing", "Dispatched", "Delivered", "Confirmed"];
}

function UpdateStatusModal({
  open,
  orderId,
  currentStatus,
  onClose,
  onSuccess,
}: {
  open: boolean;
  orderId: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);

  const availableStatuses = getAvailableStatuses(currentStatus);
  const isDispatched = status === "Dispatched";

  // Reset fields when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStatus("");
      setRemarks("");
      setCourierName("");
      setTrackingId("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!status) {
      toast({ title: "Please select a status", variant: "destructive" });
      return;
    }
    if (isDispatched && !courierName) {
      toast({
        title: "Please select a courier service",
        variant: "destructive",
      });
      return;
    }
    if (isDispatched && !trackingId.trim()) {
      toast({
        title: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }
    const token = sessionStorage.getItem("auth_token");
    if (!token) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        _id: orderId,
        status,
        remarks,
      };
      if (isDispatched) {
        payload.courierName = courierName;
        payload.trackingId = trackingId.trim();
      }
      const res = await fetch(`${API_BASE}/order`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch (_) {
        /* empty */
      }
      if (!res.ok) throw new Error((json?.message as string) || "Failed");
      toast({ title: "Status updated successfully" });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1a2b6b]">
            Update Order Status
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Remarks
            </Label>
            <Textarea
              placeholder="Add remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isDispatched && (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">
                Order Sent to Supplier
              </p>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-600">
                  Courier Service
                </Label>
                <Select value={courierName} onValueChange={setCourierName}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Courier Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURIER_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-600">
                  Tracking Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Tracking Number *"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="bg-white"
                />
                <p className="text-xs text-gray-400">
                  Enter the tracking number for the dispatched order
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#1a2b6b] hover:bg-[#162255] text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Notes Modal ────────────────────────────────────────────────────────────
function AddNotesModal({
  open,
  orderId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      toast({ title: "Please enter remarks", variant: "destructive" });
      return;
    }
    const token = sessionStorage.getItem("auth_token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/order`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
        body: JSON.stringify({ _id: orderId, remarks }),
      });
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch (_) {
        /* empty */
      }
      if (!res.ok) throw new Error((json?.message as string) || "Failed");
      toast({ title: "Note added successfully" });
      setRemarks("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Failed to add note",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1a2b6b]">Add Notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Remarks <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Enter your remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#1a2b6b] hover:bg-[#162255] text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cancel Order Modal ─────────────────────────────────────────────────────────
function CancelOrderModal({
  open,
  orderId,
  finalPrice,
  onClose,
  onSuccess,
}: {
  open: boolean;
  orderId: string;
  finalPrice: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [refund, setRefund] = useState(String(finalPrice));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setRefund(String(finalPrice));
  }, [open, finalPrice]);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast({
        title: "Please enter a cancellation reason",
        variant: "destructive",
      });
      return;
    }
    const token = sessionStorage.getItem("auth_token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/order`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
        body: JSON.stringify({
          _id: orderId,
          status: "Cancelled",
          remarks: reason,
          refund: parseFloat(refund) || 0,
        }),
      });
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch (_) {
        /* empty */
      }
      if (!res.ok) throw new Error((json?.message as string) || "Failed");
      toast({ title: "Order cancelled successfully" });
      setReason("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Cancellation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Cancel Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500">
            This action cannot be undone. Please review the refund amount and
            provide a reason.
          </p>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Refund Amount (AUD)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={refund}
              onChange={(e) => setRefund(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Cancellation Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Enter cancellation reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              variant="destructive"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [showNotes, setShowNotes] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showCancelOrder, setShowCancelOrder] = useState(false);

  const fetchOrder = async () => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/order?_id=${orderId}`, {
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
      if (!json.status) throw new Error(json.message || "Failed to load order");

      setOrder(json.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Please check your connection.";
      toast({
        title: "Failed to load order",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleViewInvoice = async () => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) return;
    setInvoiceLoading(true);
    try {
      const res = await fetch(`${API_BASE}/order/invoice?orderId=${orderId}`, {
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message || "Failed");
      // Open invoice URL in new tab
      const invoiceUrl = json.data?.url || json.data;
      if (invoiceUrl && typeof invoiceUrl === "string") {
        window.open(invoiceUrl, "_blank", "noopener,noreferrer");
      } else {
        toast({ title: "Invoice not available", variant: "destructive" });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Failed to load invoice",
        description: message,
        variant: "destructive",
      });
    } finally {
      setInvoiceLoading(false);
    }
  };

  const canViewInvoice = order && order.status !== "Pending";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a2b6b]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Package className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500 font-medium">Order not found</p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/orders")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto"
    >
      {/* ── Header (title left, actions right) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="shrink-0">
          <h1 className="text-lg sm:text-xl font-bold text-[#1a2b6b]">
            Order #{order.orderId}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Placed on {formatDate(order.insertedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/orders")}
            className="gap-1.5 text-gray-600 hover:text-[#1a2b6b] hover:border-[#1a2b6b]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Orders
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotes(true)}
            className="gap-1.5 bg-[#b9b9b9] text-black"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Add Notes
          </Button>
          {canViewInvoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewInvoice}
              disabled={invoiceLoading}
              className="gap-1.5 bg-[#b9b9b9] text-black"
            >
              {invoiceLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              View Invoice
            </Button>
          )}
          {order.status !== "Cancelled" && order.status !== "Delivered" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpdateStatus(true)}
              className="gap-1.5 bg-[#b9b9b9] text-black"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Update Status
            </Button>
          )}
          {order.status !== "Cancelled" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowCancelOrder(true)}
              className="gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-5">
          {/* Products */}
          <SectionCard
            title="Products"
            icon={<ShoppingBag className="w-4 h-4" />}
          >
            <div className="space-y-4">
              {order.products.map((item) => (
                <div
                  key={item._id}
                  className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                    {item.product.record.displayPic ? (
                      <Image
                        src={resolveImg(item.product.record.displayPic)}
                        alt={item.product.record.name}
                        fill
                        className="object-contain p-1"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                      {item.product.record.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      SKU: {item.product.record.skuCode}
                    </p>
                    {item.product.record.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-gray-500">
                          {item.product.record.rating}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <span className="text-xs text-gray-500">
                        Unit Price:{" "}
                        <span className="font-semibold text-gray-700">
                          ${item.product.soldPrice.toFixed(2)}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500">
                        Qty:{" "}
                        <span className="font-semibold text-gray-700">
                          {item.product.quantity}
                        </span>
                      </span>
                      <span className="text-xs font-bold text-[#1a2b6b]">
                        $
                        {(
                          item.product.soldPrice * item.product.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Order Info */}
          <SectionCard
            title="Order Information"
            icon={<Info className="w-4 h-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                label="Order ID"
                value={<span className="font-mono">{order.orderId}</span>}
              />
              <InfoRow
                label="Invoice No"
                value={<span className="font-mono">{order.invoiceNo}</span>}
              />
              <InfoRow
                label="User ID"
                value={
                  <span className="font-mono text-xs">{order.user._id}</span>
                }
              />
              <InfoRow label="User Name" value={order.shippingAddress.name} />
              <InfoRow label="Email" value={order.user.email} />
              <InfoRow
                label="Payment Method"
                value={formatPaymentMode(order.paymentMode)}
              />
              <InfoRow label="Shipping Type" value={order.shippingType} />
              <InfoRow
                label="Status"
                value={<StatusBadge status={order.status} />}
              />
              <InfoRow
                label="Payment Status"
                value={
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      order.paymentStatus === "Paid"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                }
              />
              <InfoRow
                label="Mobile"
                value={`${order.shippingAddress.countryCode} ${order.shippingAddress.mobile}`}
              />
            </div>
          </SectionCard>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SectionCard
              title="Billing Address"
              icon={<MapPin className="w-4 h-4" />}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                  {order.billingAddress.name}
                </p>
                <p className="text-xs text-gray-500">
                  {order.billingAddress.email}
                </p>
                <p className="text-xs text-gray-500">
                  {order.billingAddress.countryCode}{" "}
                  {order.billingAddress.mobile}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {order.billingAddress.line1}
                  {order.billingAddress.line2
                    ? `, ${order.billingAddress.line2}`
                    : ""}
                </p>
                <p className="text-xs text-gray-600">
                  {order.billingAddress.city}, {order.billingAddress.state} -{" "}
                  {order.billingAddress.postalCode}
                </p>
              </div>
            </SectionCard>
            <SectionCard
              title="Shipping Address"
              icon={<Truck className="w-4 h-4" />}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                  {order.shippingAddress.name}
                </p>
                <p className="text-xs text-gray-500">
                  {order.shippingAddress.email}
                </p>
                <p className="text-xs text-gray-500">
                  {order.shippingAddress.countryCode}{" "}
                  {order.shippingAddress.mobile}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2
                    ? `, ${order.shippingAddress.line2}`
                    : ""}
                </p>
                <p className="text-xs text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.postalCode}
                </p>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Price Summary */}
          <SectionCard
            title="Price Summary"
            icon={<PieChart className="w-4 h-4" />}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Products Total</span>
                <span className="font-medium text-gray-800">
                  ${order.productsPrice.toFixed(2)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-green-600">
                    -${order.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-gray-800">
                  ${order.shippingCharges.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">GST / Tax</span>
                <span className="font-medium text-gray-800">
                  ${order.taxAmount.toFixed(2)}
                </span>
              </div>
              {order.refund > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Refund</span>
                  <span className="font-medium text-red-600">
                    -${order.refund.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">Total</span>
                <span className="text-lg font-bold text-[#1a2b6b]">
                  ${order.finalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Order Timeline */}
          <SectionCard
            title="Order Timeline"
            icon={<Clock className="w-4 h-4" />}
          >
            <OrderTimeline
              history={order.history}
              remarks={order.remarks}
              courierName={order.courierName}
              trackingId={order.trackingId}
            />
          </SectionCard>
        </div>
      </div>

      {/* ── Modals ── */}
      <AddNotesModal
        open={showNotes}
        orderId={order._id}
        onClose={() => setShowNotes(false)}
        onSuccess={fetchOrder}
      />
      <UpdateStatusModal
        open={showUpdateStatus}
        orderId={order._id}
        currentStatus={order.status}
        onClose={() => setShowUpdateStatus(false)}
        onSuccess={fetchOrder}
      />
      <CancelOrderModal
        open={showCancelOrder}
        orderId={order._id}
        finalPrice={order.finalPrice}
        onClose={() => setShowCancelOrder(false)}
        onSuccess={fetchOrder}
      />
    </motion.div>
  );
}
