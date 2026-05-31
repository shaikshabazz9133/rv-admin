"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
  Tent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

function Particle({ index }: { index: number }) {
  const sizes = [4, 6, 3, 8, 5, 4, 7, 3, 6, 5, 4, 8, 3, 6, 5, 4, 7, 3, 6, 4];
  const xPositions = [
    15, 72, 38, 88, 25, 60, 45, 82, 10, 95, 30, 67, 52, 78, 20, 43, 87, 35, 63,
    50,
  ];
  const yPositions = [
    22, 65, 45, 12, 78, 34, 91, 56, 70, 28, 83, 47, 18, 73, 39, 85, 15, 60, 42,
    95,
  ];
  const durations = [
    18, 12, 22, 15, 20, 13, 17, 25, 11, 19, 14, 21, 16, 23, 10, 18, 24, 13, 20,
    15,
  ];
  const delays = [
    0, 2, 4, 1, 3, 5, 0.5, 2.5, 4.5, 1.5, 3.5, 0.8, 2.2, 4.2, 1.2, 3.2, 0.3,
    2.8, 4.8, 1.8,
  ];
  const i = index % 20;
  return (
    <motion.div
      className="absolute rounded-full bg-white/20"
      style={{
        width: sizes[i],
        height: sizes[i],
        left: `${xPositions[i]}%`,
        top: `${yPositions[i]}%`,
      }}
      animate={{
        y: [0, -30, 0, 20, 0],
        x: [0, 15, -10, 5, 0],
        opacity: [0.2, 0.5, 0.3, 0.6, 0.2],
      }}
      transition={{
        duration: durations[i],
        delay: delays[i],
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ─── Validation helpers ────────────────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordChecks(value: string) {
  return {
    hasUppercase: /[A-Z]/.test(value),
    hasLowercase: /[a-z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSpecial: /[^A-Za-z0-9]/.test(value),
    hasAlphabet: /[A-Za-z]/.test(value),
  };
}

function validateFields(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  if (!email.trim()) {
    errors.email = "Email address is required.";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetRequestId, setResetRequestId] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] =
    useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    otp?: string;
    password?: string;
    resetPassword?: string;
    confirmResetPassword?: string;
  }>({});

  const clearFieldError = (
    field:
      | "email"
      | "otp"
      | "password"
      | "resetPassword"
      | "confirmResetPassword",
  ) => setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const resetForgotPasswordState = () => {
    setIsForgotPasswordMode(false);
    setOtp("");
    setResetPassword("");
    setConfirmResetPassword("");
    setResetRequestId("");
    setIsOtpVerified(false);
    setShowResetPassword(false);
    setShowConfirmResetPassword(false);
    setFieldErrors({});
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: { email?: string } = {};
    if (!email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, email: "" }));
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        // non-JSON response
      }

      if (!res.ok || json.status === false || !json.data?.requestId) {
        const msg =
          json.message ||
          (res.status
            ? `Server error (${res.status}).`
            : "Failed to request password reset.");
        toast({
          title: "Reset Request Failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      setResetRequestId(json.data.requestId);
      setOtp("");
      setIsOtpVerified(false);
      toast({
        title: "Reset Requested",
        description: "Enter the 4-digit OTP to continue.",
        variant: "success" as any,
      });
    } catch {
      toast({
        title: "Connection Error",
        description:
          "Could not connect to the server. Check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: { otp?: string } = {};
    if (!otp.trim()) {
      nextErrors.otp = "OTP is required.";
    } else if (!/^\d{4}$/.test(otp.trim())) {
      nextErrors.otp = "Enter a valid 4-digit OTP.";
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, otp: "" }));
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({
          requestId: resetRequestId,
          otp: otp.trim(),
        }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        // non-JSON response
      }

      if (!res.ok || json.status === false) {
        const msg =
          json.message ||
          (res.status
            ? `Server error (${res.status}).`
            : "Failed to verify OTP.");
        toast({
          title: "OTP Verification Failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      setIsOtpVerified(true);
      toast({
        title: "OTP Verified",
        description: "Now set your new password.",
        variant: "success" as any,
      });
    } catch {
      toast({
        title: "Connection Error",
        description:
          "Could not connect to the server. Check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordChecks = getPasswordChecks(resetPassword);
    const isStrongPassword =
      resetPassword.length >= 8 &&
      passwordChecks.hasUppercase &&
      passwordChecks.hasLowercase &&
      passwordChecks.hasNumber &&
      passwordChecks.hasSpecial &&
      passwordChecks.hasAlphabet;

    const nextErrors: {
      resetPassword?: string;
      confirmResetPassword?: string;
    } = {};
    if (!resetPassword) {
      nextErrors.resetPassword = "Password is required.";
    } else if (!isStrongPassword) {
      nextErrors.resetPassword =
        "Password must include uppercase, lowercase, number, special character, and at least 8 characters.";
    }

    if (!confirmResetPassword) {
      nextErrors.confirmResetPassword = "Confirm password is required.";
    } else if (confirmResetPassword !== resetPassword) {
      nextErrors.confirmResetPassword = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    setFieldErrors((prev) => ({
      ...prev,
      resetPassword: "",
      confirmResetPassword: "",
    }));
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/forgot-password/reset`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({
          password: resetPassword,
          requestId: resetRequestId,
        }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        // non-JSON response
      }

      if (!res.ok || json.status === false) {
        const msg =
          json.message ||
          (res.status
            ? `Server error (${res.status}).`
            : "Failed to reset password.");
        toast({
          title: "Password Reset Failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Password Updated",
        description: "Sign in with your new password.",
        variant: "success" as any,
      });
      setPassword("");
      resetForgotPasswordState();
      router.push("/");
    } catch {
      toast({
        title: "Connection Error",
        description:
          "Could not connect to the server. Check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // — Client-side validation ——
    const errors = validateFields(email, password);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-client": "ADMIN_PANEL",
          accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        // non-JSON response
      }

      if (!res.ok || json.status === false) {
        const msg =
          json.message ||
          (res.status === 401
            ? "Invalid email or password."
            : `Server error (${res.status}).`);
        toast({
          title: "Login Failed",
          description: msg,
          variant: "destructive",
        });
        setFieldErrors({ email: " ", password: msg }); // highlight both fields
        return;
      }

      // — Store session ——
      const token = json.data?.token ?? json.token ?? json.data?.accessToken;
      if (!token) {
        toast({
          title: "Login Failed",
          description: "No token received from server.",
          variant: "destructive",
        });
        return;
      }
      sessionStorage.setItem("auth_token", token);
      if (json.data?.user)
        sessionStorage.setItem("user_info", JSON.stringify(json.data.user));
      if (rememberMe) localStorage.setItem("remember_email", email.trim());

      toast({
        title: "Welcome back!",
        description: "Login successful. Redirecting…",
        variant: "success" as any,
      });
      router.push("/dashboard");
    } catch {
      toast({
        title: "Connection Error",
        description:
          "Could not connect to the server. Check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showOtpStep =
    isForgotPasswordMode && !!resetRequestId && !isOtpVerified;
  const showResetStep =
    isForgotPasswordMode && !!resetRequestId && isOtpVerified;
  const resetPasswordChecks = getPasswordChecks(resetPassword);

  const forgotPasswordDescription = !resetRequestId
    ? "Enter your email to request a password reset"
    : isOtpVerified
      ? "Set a new password for your admin account"
      : "Enter the 4-digit OTP sent to your email";

  const formSubmitHandler = isForgotPasswordMode
    ? !resetRequestId
      ? handleForgotPasswordRequest
      : isOtpVerified
        ? handleResetPassword
        : handleVerifyOtp
    : handleLogin;

  const loadingText = isForgotPasswordMode
    ? !resetRequestId
      ? "Sending request..."
      : isOtpVerified
        ? "Updating password..."
        : "Verifying OTP..."
    : "Signing in...";

  const submitText = isForgotPasswordMode
    ? !resetRequestId
      ? "Send Reset Request"
      : isOtpVerified
        ? "Update Password"
        : "Verify OTP"
    : "Sign In";

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e3a8a 0%, #1e40af 30%, #1d4ed8 60%, #2563eb 100%)",
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(249,115,22,0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(249,115,22,0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(249,115,22,0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(249,115,22,0.15) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        {Array.from({ length: 20 }, (_, i) => (
          <Particle key={i} index={i} />
        ))}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative z-10 px-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8 text-8xl"
          >
            🏕️
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30">
                <Tent className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">RV Adventure</h1>
                <p className="text-white/70 text-sm">Australia</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Your Adventure Starts Here
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm mx-auto">
              Manage your caravan and camping accessories store with ease. Track
              orders, products, and customers all in one place.
            </p>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-8"
          >
            {["📦 Products", "🚚 Orders", "💳 Payments", "📊 Analytics"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm border border-white/10"
                >
                  {item}
                </span>
              ),
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Right — Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 shadow">
              <Tent className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">
                RV Adventure Australia
              </h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {isForgotPasswordMode ? "Reset your password" : "Welcome back"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isForgotPasswordMode
                ? forgotPasswordDescription
                : "Sign in to your admin account"}
            </p>
          </div>

          <form onSubmit={formSubmitHandler} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@rvaustralia.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                className={`h-11 ${fieldErrors.email ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                autoComplete="email"
                disabled={loading || (isForgotPasswordMode && !!resetRequestId)}
              />
              {fieldErrors.email && fieldErrors.email.trim() && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500"
                >
                  {fieldErrors.email}
                </motion.p>
              )}
            </div>

            {showOtpStep && (
              <div className="space-y-1.5">
                <Label htmlFor="otp">4-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 4);
                    setOtp(digitsOnly);
                    clearFieldError("otp");
                  }}
                  className={`h-11 tracking-[0.35em] text-center text-lg ${fieldErrors.otp ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                  maxLength={4}
                  disabled={loading}
                />
                {fieldErrors.otp && fieldErrors.otp.trim() && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500"
                  >
                    {fieldErrors.otp}
                  </motion.p>
                )}
              </div>
            )}

            {!isForgotPasswordMode && (
              <>
                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError("password");
                      }}
                      className={`h-11 pr-10 ${fieldErrors.password ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && fieldErrors.password.trim() && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500"
                    >
                      {fieldErrors.password}
                    </motion.p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(c as boolean)}
                    />
                    <Label
                      htmlFor="remember"
                      className="font-normal cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(true);
                      setFieldErrors({});
                    }}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            {showResetStep && (
              <div className="space-y-1.5">
                <Label htmlFor="resetPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="resetPassword"
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value);
                      clearFieldError("resetPassword");
                      clearFieldError("confirmResetPassword");
                    }}
                    className={`h-11 pr-10 ${fieldErrors.resetPassword ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showResetPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.resetPassword &&
                  fieldErrors.resetPassword.trim() && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500"
                    >
                      {fieldErrors.resetPassword}
                    </motion.p>
                  )}

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-1">
                  <p className="font-medium text-slate-700">
                    Password must include:
                  </p>
                  <div
                    className={
                      resetPasswordChecks.hasUppercase
                        ? "flex items-center gap-2 text-emerald-600"
                        : "flex items-center gap-2 text-slate-500"
                    }
                  >
                    {resetPasswordChecks.hasUppercase ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <p>Uppercase letter (A-Z)</p>
                  </div>
                  <div
                    className={
                      resetPasswordChecks.hasLowercase
                        ? "flex items-center gap-2 text-emerald-600"
                        : "flex items-center gap-2 text-slate-500"
                    }
                  >
                    {resetPasswordChecks.hasLowercase ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <p>Lowercase letter (a-z)</p>
                  </div>
                  <div
                    className={
                      resetPasswordChecks.hasNumber
                        ? "flex items-center gap-2 text-emerald-600"
                        : "flex items-center gap-2 text-slate-500"
                    }
                  >
                    {resetPasswordChecks.hasNumber ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <p>Number (0-9)</p>
                  </div>
                  <div
                    className={
                      resetPasswordChecks.hasSpecial
                        ? "flex items-center gap-2 text-emerald-600"
                        : "flex items-center gap-2 text-slate-500"
                    }
                  >
                    {resetPasswordChecks.hasSpecial ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <p>Special character (!@#$...)</p>
                  </div>
                  <div
                    className={
                      resetPasswordChecks.hasAlphabet
                        ? "flex items-center gap-2 text-emerald-600"
                        : "flex items-center gap-2 text-slate-500"
                    }
                  >
                    {resetPasswordChecks.hasAlphabet ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <p>Alphabet character</p>
                  </div>
                  <div
                    className={
                      resetPassword.length >= 8
                        ? "flex items-center gap-2 text-emerald-600"
                        : "flex items-center gap-2 text-slate-500"
                    }
                  >
                    {resetPassword.length >= 8 ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <p>At least 8 characters</p>
                  </div>
                </div>

                <Label htmlFor="confirmResetPassword">
                  Confirm new password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmResetPassword"
                    type={showConfirmResetPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={confirmResetPassword}
                    onChange={(e) => {
                      setConfirmResetPassword(e.target.value);
                      clearFieldError("confirmResetPassword");
                    }}
                    className={`h-11 pr-10 ${fieldErrors.confirmResetPassword ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmResetPassword(!showConfirmResetPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmResetPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmResetPassword &&
                  fieldErrors.confirmResetPassword.trim() && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500"
                    >
                      {fieldErrors.confirmResetPassword}
                    </motion.p>
                  )}
              </div>
            )}

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 shadow-lg shadow-blue-800/25 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {loadingText}
                  </>
                ) : (
                  submitText
                )}
              </Button>
            </motion.div>

            {isForgotPasswordMode && (
              <button
                type="button"
                onClick={resetForgotPasswordState}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                Back to sign in
              </button>
            )}
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            RV Adventure Australia Admin Panel &copy; {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
