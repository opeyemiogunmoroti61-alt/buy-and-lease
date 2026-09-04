"use client";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { signInClient } from "@/lib/auth/signInClient";
import { getDashboardRoute } from "@/config/routes";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const result = await signInClient(email, password);

    if (result.error) {
      setErrorMessage(result.error);
      setLoading(false);
    } else {
      // Single source of truth — see src/config/routes.ts. Adding a new
      // role now only requires editing one file, not this component too.
      window.location.replace(getDashboardRoute(result.role).path);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500">Email Address</label>
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {/* Error */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {errorMessage}
        </div>
      )}
      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-1"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Sign In
          </>
        )}
      </button>
    </form>
  );
}
