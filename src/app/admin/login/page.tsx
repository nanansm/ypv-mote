"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as { ok?: boolean; error?: string; mustChangePassword?: boolean };
    setLoading(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "Login failed");
      return;
    }

    const next = sp.get("next") ?? "/admin";
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#e5e5e5] rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full h-10 px-3 rounded-md border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full h-10 px-3 rounded-md border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
        />
      </div>
      {error && <p className="text-sm text-[#a32d2d]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Admin Login</h1>
          <p className="text-sm text-[#5c5c5c] mt-1">YPV Switzerland</p>
        </div>
        <Suspense fallback={<div className="bg-white border border-[#e5e5e5] rounded-lg p-6 text-sm text-[#5c5c5c]">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
