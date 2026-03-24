"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  Users,
  ShoppingBag,
  ShoppingCart,
  Download,
  Calendar,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderSummaryItem {
  name: string;
  Ebay: number;
  Amazon: number;
  Online: number;
  Store: number;
}
interface SaleSummaryItem {
  name: string;
  Sales: number;
}

interface DashboardData {
  suppliers: number;
  products: number;
  productsSold: number;
  monthlyNetSales: number;
  monthlyGrossSales: number;
  monthlyShipping: number;
  monthlyTax: number;
  totalSales: number;
  totalNetSales: number;
  totalOnlineGrossSales: number;
  totalStoreGrossSales: number;
  orderSummary: OrderSummaryItem[];
  saleSummary: SaleSummaryItem[];
}

// ─── Tooltips ──────────────────────────────────────────────────────────────────

function SalesAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-gray-800 mb-1">{label}</p>
      <p className="text-[#5b6fd6]">
        Sales:{" "}
        <span className="font-semibold">
          $
          {payload[0]?.value?.toLocaleString("en-AU", {
            minimumFractionDigits: 2,
          })}
        </span>
      </p>
    </div>
  );
}

function PlatformBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-gray-800 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return <div className="animate-pulse rounded-2xl bg-gray-200 h-32" />;
}
function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-gray-100 h-80 flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-gray-300 animate-spin" />
    </div>
  );
}

// ─── Shared DateRange + Download row ───────────────────────────────────────────

function SummaryToolbar({
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  onDownload,
  downloading,
}: {
  startDate: string;
  endDate: string;
  onStartDate: (v: string) => void;
  onEndDate: (v: string) => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-gray-500 hidden sm:inline">Date Range:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDate(e.target.value)}
          className="border-none bg-transparent text-xs outline-none w-28"
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDate(e.target.value)}
          className="border-none bg-transparent text-xs outline-none w-28"
        />
      </div>
      <button
        onClick={onDownload}
        disabled={downloading}
        className="flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 text-white px-4 py-2 text-sm font-semibold shadow transition-colors"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download Excel
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchDashboard(token);
  }, []);

  const fetchDashboard = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin-dashboard`, {
        headers: {
          authorization: `Bearer ${token}`,
          "x-app-client": "ADMIN_PANEL",
          accept: "*/*",
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
      setData(json.data);
    } catch (err: any) {
      toast({
        title: "Failed to load dashboard",
        description: err.message || "Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (start > end) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }
    const token = sessionStorage.getItem("auth_token");
    setDownloading(true);
    try {
      const res = await fetch(
        `${API_BASE}/order/download-summary?type=excel&start_date=${start}&end_date=${end}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "x-app-client": "ADMIN_PANEL",
            accept: "*/*",
          },
        },
      );
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        toast({
          title: "Session Expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        return;
      }
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-summary-${startDate}_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Downloaded",
        description: "Order summary saved successfully.",
        variant: "success" as any,
      });
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err.message || "Could not download the file.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  // ─── Map API → chart data ─────────────────────────────────────────────────

  const platformData =
    data?.orderSummary.map((item) => ({
      month: item.name,
      ebay: item.Ebay,
      amazon: item.Amazon,
      online: item.Online,
      store: item.Store,
    })) ?? [];

  const totalSalesData =
    data?.saleSummary.map((item) => ({
      month: item.name,
      sales: item.Sales,
    })) ?? [];

  const statCards = data
    ? [
        {
          label: "Suppliers",
          value: data.suppliers.toLocaleString(),
          icon: Users,
          gradient: "from-orange-500 to-red-500",
          shadow: "shadow-orange-300",
        },
        {
          label: "All Products",
          value: data.products.toLocaleString(),
          icon: ShoppingBag,
          gradient: "from-blue-500 to-purple-600",
          shadow: "shadow-blue-300",
        },
        {
          label: "Products Sold",
          value: data.productsSold.toLocaleString(),
          icon: ShoppingCart,
          gradient: "from-emerald-500 to-green-600",
          shadow: "shadow-green-300",
        },
      ]
    : [];

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ChartSkeleton />
        <div className="animate-pulse rounded-2xl bg-blue-100 h-48" />
        <ChartSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-5 flex items-center justify-center h-64">
        <p className="text-gray-400">
          No data available.{" "}
          <button
            onClick={() => {
              const t = sessionStorage.getItem("auth_token");
              if (t) fetchDashboard(t);
            }}
            className="text-blue-500 hover:underline ml-1"
          >
            Retry
          </button>
        </p>
      </div>
    );
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-AU", { minimumFractionDigits: 2 });

  return (
    <div className="p-5 space-y-5">
      {/* Stat Cards */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1 } },
        }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 shadow-lg ${card.shadow}/40 text-white`}
              >
                <p className="text-sm font-medium text-white/80">
                  {card.label}
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight">
                  {card.value}
                </p>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20">
                  <Icon className="h-20 w-20" strokeWidth={1.2} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Sales Order Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Sales order summary
              </h2>
              <SummaryToolbar
                startDate={startDate}
                endDate={endDate}
                onStartDate={setStartDate}
                onEndDate={setEndDate}
                onDownload={handleDownload}
                downloading={downloading}
              />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={platformData}
                margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                barCategoryGap="35%"
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={5}
                />
                <Tooltip
                  content={<PlatformBarTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
                  formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <Bar
                  dataKey="ebay"
                  fill="#f59e0b"
                  radius={[3, 3, 0, 0]}
                  name="Ebay"
                />
                <Bar
                  dataKey="amazon"
                  fill="#3b82f6"
                  radius={[3, 3, 0, 0]}
                  name="Amazon"
                />
                <Bar
                  dataKey="online"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                  name="Online"
                />
                <Bar
                  dataKey="store"
                  fill="#6b7280"
                  radius={[3, 3, 0, 0]}
                  name="Store"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Financial Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="rounded-2xl bg-gradient-to-br from-[#3a4fd7] to-[#6366f1] p-6 text-white shadow-lg shadow-blue-300/30">
          <p className="text-base font-bold mb-4">Financial Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-white/20 pb-6 mb-6">
            {[
              {
                label: "Monthly Net Sales",
                value: `$${fmt(data.monthlyNetSales)}`,
              },
              {
                label: "Monthly Shipping",
                value: `$${fmt(data.monthlyShipping)}`,
              },
              { label: "Monthly Tax", value: `$${fmt(data.monthlyTax)}` },
              { label: "Total Gross Sales", value: `$${fmt(data.totalSales)}` },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-white/70 mb-1">{item.label}</p>
                <p className="text-2xl font-extrabold tracking-tight">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-bold mb-3">Sales by Platform</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: "Ebay", value: 0 },
                { label: "Amazon", value: 0 },
                { label: "Online", value: data.totalOnlineGrossSales },
                { label: "Store", value: data.totalStoreGrossSales },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-white/70 mb-1">{item.label}</p>
                  <p className="text-xl font-bold">${fmt(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Total Sales Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h2 className="text-lg font-bold text-gray-800">
                Total Sales Summary
              </h2>
              <SummaryToolbar
                startDate={startDate}
                endDate={endDate}
                onStartDate={setStartDate}
                onEndDate={setEndDate}
                onDownload={handleDownload}
                downloading={downloading}
              />
            </div>
            <div className="text-center mb-2">
              <p className="text-xs text-gray-400 tracking-wide uppercase">
                Total Gross Sales
              </p>
              <p className="text-3xl font-extrabold text-[#2563eb]">
                ${fmt(data.totalSales)}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={totalSalesData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="totalSalesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v === 0 ? "$0k" : `$${(v / 1000).toFixed(0)}k`
                  }
                  tickCount={5}
                />
                <Tooltip content={<SalesAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fill="url(#totalSalesGradient)"
                  dot={{
                    r: 4,
                    fill: "#818cf8",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#818cf8",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
