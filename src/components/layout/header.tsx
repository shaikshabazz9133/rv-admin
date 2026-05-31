"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ChevronDown, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuToggle: () => void;
}

interface SessionUserInfo {
  name?: string;
  email?: string;
  role?: string | { name?: string };
}

interface TokenPayload {
  name?: string;
  email?: string;
  role?: string | { name?: string };
}

export function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUserInfo | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const resolveRoleName = (role: SessionUserInfo["role"]) => {
    if (!role) return "Admin";
    if (typeof role === "string") return role.trim() || "Admin";
    return role.name?.trim() || "Admin";
  };

  const parseTokenPayload = (token: string): TokenPayload | null => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;

      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const json = atob(padded);

      return JSON.parse(json) as TokenPayload;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const rawUser = sessionStorage.getItem("user_info");
    const rawToken = sessionStorage.getItem("auth_token");
    const tokenPayload = rawToken ? parseTokenPayload(rawToken) : null;

    if (!rawUser && !tokenPayload) return;

    try {
      const parsed = rawUser ? (JSON.parse(rawUser) as SessionUserInfo) : null;

      setSessionUser({
        name: parsed?.name?.trim() || tokenPayload?.name?.trim() || "Admin",
        email:
          parsed?.email?.trim() ||
          tokenPayload?.email?.trim() ||
          "admin@rvaustralia.com",
        role: parsed?.role ?? tokenPayload?.role ?? "Admin",
      });
    } catch {
      setSessionUser({
        name: tokenPayload?.name?.trim() || "Admin",
        email: tokenPayload?.email?.trim() || "admin@rvaustralia.com",
        role: tokenPayload?.role ?? "Admin",
      });
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  const handleSignOut = () => {
    sessionStorage.clear();
    router.push("/");
  };

  const displayName = sessionUser?.name || "Admin";
  const displayEmail = sessionUser?.email || "admin@rvaustralia.com";
  const displayRole = resolveRoleName(sessionUser?.role);
  const displayInitial = displayName.charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1a2b6b] to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow">
              {displayInitial}
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold leading-tight text-gray-800">
                  {displayName}
                </p>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                  {displayRole}
                </span>
              </div>
              <p className="text-xs text-gray-500">{displayEmail}</p>
            </div>
            <ChevronDown
              className={`hidden md:block h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {displayName}
                    </p>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                      {displayRole}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {displayEmail}
                  </p>
                </div>
                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
