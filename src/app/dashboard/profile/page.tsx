"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  Loader2,
  Mail,
  Phone,
  User as UserIcon,
  ShieldCheck,
  X,
  Save,
  MapPin,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function parseTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Resolve the logged-in user's id from session storage or the JWT payload. */
function resolveUserId(): string | null {
  if (typeof window === "undefined") return null;

  const rawUser = sessionStorage.getItem("user_info");
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser) as Record<string, unknown>;
      const id = parsed._id ?? parsed.id ?? parsed.userId;
      if (typeof id === "string" && id) return id;
    } catch {
      // ignore and fall back to token
    }
  }

  const token = sessionStorage.getItem("auth_token");
  const payload = token ? parseTokenPayload(token) : null;
  if (payload) {
    const id = payload._id ?? payload.id ?? payload.userId ?? payload.sub;
    if (typeof id === "string" && id) return id;
  }
  return null;
}

function resolveRoleName(role: ProfileData["role"]): string {
  if (!role) return "User";
  if (typeof role === "string") return role.trim() || "User";
  return role.name?.trim() || "User";
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface Address {
  _id?: string;
  label?: string;
  name?: string;
  email?: string;
  countryCode?: string;
  mobile?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isDefault?: boolean;
}

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  countryCode?: string;
  mobile?: string;
  avatar?: string;
  role?: string | { _id?: string; name?: string };
  isActive?: boolean;
  isEmailVerified?: boolean;
  addresses?: Address[];
}

interface FormState {
  name: string;
  email: string;
  countryCode: string;
  mobile: string;
}

interface AddressForm {
  label: string;
  name: string;
  countryCode: string;
  mobile: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_ADDRESS_FORM: AddressForm = {
  label: "",
  name: "",
  countryCode: "+91",
  mobile: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

const EMPTY_PASSWORD_FORM: PasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    countryCode: "+91",
    mobile: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Address editing
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] =
    useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [addressSaving, setAddressSaving] = useState(false);

  // Password change
  const [pwdForm, setPwdForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [pwdErrors, setPwdErrors] = useState<
    Partial<Record<keyof PasswordForm, string>>
  >({});
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwd, setShowPwd] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  // Keep inputs read-only until focused so the browser can't autofill them.
  const [pwdEditable, setPwdEditable] = useState(false);

  // Load profile
  const loadProfile = useCallback(async () => {
    const token = getToken();
    const userId = resolveUserId();

    if (!token || !userId) {
      router.push("/");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user?userId=${userId}`, {
        headers: authHeaders(token),
      });
      if (res.status === 401) {
        sessionStorage.clear();
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (json.status === false) throw new Error(json.message);

      const data: ProfileData = json.data ?? json;
      setProfile(data);
      setForm({
        name: data.name ?? "",
        email: data.email ?? "",
        countryCode: data.countryCode ?? "+91",
        mobile: data.mobile ?? "",
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to load profile",
        description:
          err instanceof Error ? err.message : "Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Revoke object URL on change/unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email.";
    }
    if (form.mobile && !/^\d{6,15}$/.test(form.mobile.trim())) {
      next.mobile = "Enter a valid mobile number.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!validate()) return;

    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("userId", profile._id);
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("countryCode", form.countryCode.trim());
      fd.append("mobile", form.mobile.trim());
      if (avatarFile) fd.append("avatar", avatarFile);

      const res = await fetch(`${API_BASE}/user`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: fd,
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (json.status === false)
        throw new Error(json.message || "Update failed");

      const updated: ProfileData = {
        ...profile,
        name: form.name.trim(),
        email: form.email.trim(),
        countryCode: form.countryCode.trim(),
        mobile: form.mobile.trim(),
        ...(json.data?.avatar ? { avatar: json.data.avatar } : {}),
      };
      setProfile(updated);

      // Keep the header in sync with the edited name/email.
      try {
        const rawUser = sessionStorage.getItem("user_info");
        const parsed = rawUser ? JSON.parse(rawUser) : {};
        sessionStorage.setItem(
          "user_info",
          JSON.stringify({
            ...parsed,
            name: updated.name,
            email: updated.email,
            ...(updated.avatar ? { avatar: updated.avatar } : {}),
          }),
        );
      } catch {
        // non-critical
      }

      clearAvatar();
      toast({ title: "Profile updated successfully" });
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Address editing ───────────────────────────────────────────────────────

  const openAddressEditor = (addr: Address) => {
    setEditingAddressId(addr._id ?? null);
    setAddressForm({
      label: addr.label ?? "",
      name: addr.name ?? "",
      countryCode: addr.countryCode ?? "+91",
      mobile: addr.mobile ?? "",
      line1: addr.line1 ?? "",
      line2: addr.line2 ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      postalCode: addr.postalCode ?? "",
    });
  };

  const closeAddressEditor = () => {
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
  };

  const handleAddressField = (key: keyof AddressForm, value: string) => {
    setAddressForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddressSave = async () => {
    if (!editingAddressId) return;
    if (!addressForm.line1.trim() || !addressForm.city.trim()) {
      toast({
        title: "Missing details",
        description: "Address line 1 and city are required.",
        variant: "destructive",
      });
      return;
    }

    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }

    setAddressSaving(true);
    try {
      const res = await fetch(`${API_BASE}/user/address`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify({
          addressId: editingAddressId,
          label: addressForm.label.trim(),
          name: addressForm.name.trim(),
          countryCode: addressForm.countryCode.trim(),
          mobile: addressForm.mobile.trim(),
          line1: addressForm.line1.trim(),
          line2: addressForm.line2.trim(),
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          postalCode: addressForm.postalCode.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      if (json.status === false)
        throw new Error(json.message || "Update failed");

      // Reflect changes locally.
      setProfile((prev) => {
        if (!prev) return prev;
        const next = (prev.addresses ?? []).map((a) =>
          a._id === editingAddressId ? { ...a, ...addressForm } : a,
        );
        return { ...prev, addresses: next };
      });

      closeAddressEditor();
      toast({ title: "Address updated successfully" });
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddressSaving(false);
    }
  };

  // ─── Password change ───────────────────────────────────────────────────────

  const handlePwdField = (key: keyof PasswordForm, value: string) => {
    setPwdForm((prev) => ({ ...prev, [key]: value }));
    setPwdErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validatePwd = (): boolean => {
    const next: Partial<Record<keyof PasswordForm, string>> = {};
    if (!pwdForm.oldPassword) {
      next.oldPassword = "Current password is required.";
    }
    if (!pwdForm.newPassword) {
      next.newPassword = "New password is required.";
    } else if (pwdForm.newPassword.length < 6) {
      next.newPassword = "Password must be at least 6 characters.";
    } else if (pwdForm.newPassword === pwdForm.oldPassword) {
      next.newPassword = "New password must differ from the current one.";
    }
    if (!pwdForm.confirmPassword) {
      next.confirmPassword = "Please confirm your new password.";
    } else if (pwdForm.confirmPassword !== pwdForm.newPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setPwdErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePwdSave = async () => {
    if (!validatePwd()) return;

    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }

    setPwdSaving(true);
    try {
      const res = await fetch(`${API_BASE}/user/password`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "content-type": "application/json" },
        body: JSON.stringify({
          oldPassword: pwdForm.oldPassword,
          newPassword: pwdForm.newPassword,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || `Server error (${res.status})`);
      }
      const json = await res.json();
      if (json.status === false)
        throw new Error(json.message || "Update failed");

      toast({
        title: "Password updated",
        description: "Please sign in again with your new password.",
      });
      setPwdForm(EMPTY_PASSWORD_FORM);
      // Force re-authentication with the new password.
      sessionStorage.clear();
      setTimeout(() => router.push("/"), 1200);
    } catch (err: unknown) {
      toast({
        title: "Could not update password",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPwdSaving(false);
    }
  };

  const roleName = resolveRoleName(profile?.role);
  const displayName = profile?.name?.trim() || "User";
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const currentAvatar = avatarPreview || profile?.avatar || null;
  const addresses = profile?.addresses ?? [];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a2b6b]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your account information and avatar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Header band */}
          <div className="flex flex-col items-center gap-4 border-b border-gray-100 bg-gradient-to-br from-[#1a2b6b] to-blue-500 px-6 py-8 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white text-3xl font-bold text-[#1a2b6b] shadow-lg">
                {currentAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentAvatar}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1a2b6b] shadow-md transition-transform hover:scale-105"
                aria-label="Change avatar"
              >
                <Upload className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            <div className="text-center text-white sm:text-left">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-sm text-white/80">{profile?.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {/* <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {roleName}
                </span> */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    profile?.isActive
                      ? "bg-green-400/20 text-green-50"
                      : "bg-red-400/20 text-red-50"
                  }`}
                >
                  {profile?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Avatar selection hint */}
          {avatarFile && (
            <div className="flex items-center justify-between bg-blue-50 px-6 py-2.5 text-sm text-blue-800">
              <span className="truncate">
                New avatar selected:{" "}
                <span className="font-medium">{avatarFile.name}</span>
              </span>
              <button
                type="button"
                onClick={clearAvatar}
                className="ml-3 inline-flex shrink-0 items-center gap-1 text-blue-700 hover:text-blue-900"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          )}

          {/* Form */}
          <div className="space-y-5 px-6 py-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">
                  <span className="inline-flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-gray-400" /> Full Name
                  </span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleField("name", e.target.value)}
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" /> Email
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleField("email", e.target.value)}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="countryCode">Country Code</Label>
                <Input
                  id="countryCode"
                  value={form.countryCode}
                  onChange={(e) => handleField("countryCode", e.target.value)}
                  placeholder="+91"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mobile">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" /> Mobile
                  </span>
                </Label>
                <Input
                  id="mobile"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(e) =>
                    handleField("mobile", e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="8008283461"
                />
                {errors.mobile && (
                  <p className="text-xs text-red-600">{errors.mobile}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              <Button
                variant="outline"
                onClick={() => loadProfile()}
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1a2b6b] hover:bg-[#1a2b6b]/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
            <Lock className="h-4 w-4 text-[#1a2b6b]" />
            <h2 className="text-base font-semibold text-gray-900">
              Change Password
            </h2>
          </div>
          <div className="flex flex-1 flex-col gap-6 px-6 py-6">
            <div className="grid gap-5">
              {(
                [
                  { key: "oldPassword", label: "Current Password" },
                  { key: "newPassword", label: "New Password" },
                  { key: "confirmPassword", label: "Confirm New Password" },
                ] as const
              ).map(({ key, label }) => (
                <div
                  key={key}
                  className={`space-y-1.5 ${key === "oldPassword" ? "sm:col-span-2" : ""}`}
                >
                  <Label htmlFor={key}>{label}</Label>
                  <div className="relative">
                    <Input
                      id={key}
                      name={`manual-${key}`}
                      type={showPwd[key] ? "text" : "password"}
                      value={pwdForm[key]}
                      onChange={(e) => handlePwdField(key, e.target.value)}
                      onFocus={() => setPwdEditable(true)}
                      readOnly={!pwdEditable}
                      placeholder={label}
                      className="pr-10"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPwd((p) => ({ ...p, [key]: !p[key] }))
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                      aria-label={
                        showPwd[key] ? "Hide password" : "Show password"
                      }
                    >
                      {showPwd[key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {pwdErrors[key] && (
                    <p className="text-xs text-red-600">{pwdErrors[key]}</p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              Changing your password will sign you out. You&apos;ll need to log
              in again with the new password.
            </p>

            <div className="mt-auto flex items-center justify-end border-t border-gray-100 pt-5">
              <Button
                onClick={handlePwdSave}
                disabled={pwdSaving}
                className="bg-[#1a2b6b] hover:bg-[#1a2b6b]/90"
              >
                {pwdSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" /> Update Password
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Address Edit Modal */}
      {editingAddressId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Edit Address
              </h3>
              <button
                type="button"
                onClick={closeAddressEditor}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="addr-label">Label</Label>
                <Input
                  id="addr-label"
                  value={addressForm.label}
                  onChange={(e) => handleAddressField("label", e.target.value)}
                  placeholder="Home"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-name">Name</Label>
                <Input
                  id="addr-name"
                  value={addressForm.name}
                  onChange={(e) => handleAddressField("name", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-cc">Country Code</Label>
                <Input
                  id="addr-cc"
                  value={addressForm.countryCode}
                  onChange={(e) =>
                    handleAddressField("countryCode", e.target.value)
                  }
                  placeholder="+91"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-mobile">Mobile</Label>
                <Input
                  id="addr-mobile"
                  inputMode="numeric"
                  value={addressForm.mobile}
                  onChange={(e) =>
                    handleAddressField(
                      "mobile",
                      e.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                  placeholder="8008283461"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="addr-line1">Address Line 1</Label>
                <Input
                  id="addr-line1"
                  value={addressForm.line1}
                  onChange={(e) => handleAddressField("line1", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="addr-line2">Address Line 2</Label>
                <Input
                  id="addr-line2"
                  value={addressForm.line2}
                  onChange={(e) => handleAddressField("line2", e.target.value)}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-city">City</Label>
                <Input
                  id="addr-city"
                  value={addressForm.city}
                  onChange={(e) => handleAddressField("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-state">State</Label>
                <Input
                  id="addr-state"
                  value={addressForm.state}
                  onChange={(e) => handleAddressField("state", e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-postal">Postal Code</Label>
                <Input
                  id="addr-postal"
                  value={addressForm.postalCode}
                  onChange={(e) =>
                    handleAddressField("postalCode", e.target.value)
                  }
                  placeholder="734834"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <Button
                variant="outline"
                onClick={closeAddressEditor}
                disabled={addressSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddressSave}
                disabled={addressSaving}
                className="bg-[#1a2b6b] hover:bg-[#1a2b6b]/90"
              >
                {addressSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Address
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
