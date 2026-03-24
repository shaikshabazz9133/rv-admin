"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  Star,
  MessageSquare,
  ShoppingCart,
  Tag,
  UserCircle,
  Settings,
  FileText,
  Truck,
  ChevronLeft,
  ChevronRight,
  Tent,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Suppliers", href: "/dashboard/suppliers", icon: Truck },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Enquiry", href: "/dashboard/enquiry", icon: MessageSquare },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Offers", href: "/dashboard/offers", icon: Tag },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Footer Options", href: "/dashboard/footer", icon: Globe },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Policies", href: "/dashboard/policies", icon: FileText },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 200 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex h-screen flex-col bg-[hsl(220_60%_12%)] text-white z-30 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/30">
            <Tent className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold leading-tight text-white truncate">
                  RV Adventure
                </p>
                <p className="text-xs text-white/50 truncate">Australia</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-white/60 hover:bg-white/8 hover:text-white",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-orange-400" : "text-white/50",
                      )}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400"
                      />
                    )}
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
