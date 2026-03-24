"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Tent } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const clearFieldError = (field: "email" | "password") =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

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
    } catch (err) {
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
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">
              Sign in to your admin account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
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
                disabled={loading}
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
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

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
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </motion.div>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            RV Adventure Australia Admin Panel &copy; {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
