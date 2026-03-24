"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const policyTabs = [
  { label: "Payment Policies", href: "/dashboard/policies/payment" },
  { label: "Return Policies", href: "/dashboard/policies/returns" },
  { label: "Fulfillment Policies", href: "/dashboard/policies/fulfillment" },
];

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Policies</h1>
        <p className="text-muted-foreground text-sm">
          Manage payment, return, and fulfillment policies for your store.
        </p>
      </div>

      {/* Sub Navigation */}
      <div className="flex border-b gap-1">
        {policyTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              pathname === tab.href
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
