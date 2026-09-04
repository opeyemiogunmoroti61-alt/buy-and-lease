"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpClient } from "@/lib/auth/signUpClient";
import { Home, Building2, Users, Eye, EyeOff, Check } from "lucide-react";

type Role = "seeker" | "landlord" | "agent";

const roles = [
  {
    value: "seeker" as Role,
    label: "Seeker",
    subtitle: "Buying or renting",
    icon: Users,
    color: "indigo",
    description: "Browse and enquire about properties",
  },
  {
    value: "landlord" as Role,
    label: "Landlord",
    subtitle: "Property owner",
    icon: Home,
    color: "emerald",
    description: "List and manage your properties",
  },
  {
    value: "agent" as Role,
    label: "Agent",
    subtitle: "Real estate professional",
    icon: Building2,
    color: "violet",
    description: "Represent buyers, sellers and landlords",
  },
];

const colorMap: Record<string, string> = {
  indigo: "border-indigo-500 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-500 bg-emerald-50 text-emerald-700",
  violet: "border-violet-500 bg-violet-50 text-violet-700",
};

const checkMap: Record<string, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

export default function SignUpForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    // Map seeker → tenant for backend compatibility
    const backendRole = role === "seeker" ? "tenant" : role;
    const result = await signUpClient(email, password, username, backendRole as "tenant" | "landlord");

    if (result.error) {
      setErrorMessage(result.error);
      setLoading(false);
    } else {
      // Redirect based on role after signup
      if (role === "landlord") {
        window.location.replace("/dashboard/landlord");
      } else if (role === "agent") {
        window.location.replace("/dashboard/agent");
      } else {
        window.location.replace("/dashboard/tenant");
      }
    }
  };

  const selectedRole = roles.find((r) => r.value === role)!;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Role selector ──────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          I am a...
        </p>
        <div className="grid grid-cols-3 gap-2">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center
                  ${isSelected
                    ? colorMap[r.color]
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                {/* Check indicator */}
                {isSelected && (
                  <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center ${checkMap[r.color]}`}>
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
                <Icon className="w-5 h-5" />
                <span className="text-xs font-bold">{r.label}</span>
                <span className="text-[10px] opacity-70 leading-tight">{r.subtitle}</span>
              </button>
            );
          })}
        </div>
        {/* Role description */}
        <p className="text-xs text-slate-400 mt-2 text-center">
          {selectedRole.description}
        </p>
      </div>

      {/* ── Form fields ───────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500">Username</label>
          <input
            type="text"
            placeholder="e.g. johndoe"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

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
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            `Create ${selectedRole.label} Account`
          )}
        </button>

      </form>
    </div>
  );
}