"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { AppUser } from "@/lib/types";

type RegistrationError = Record<string, string[] | string>;

function getErrorMessage(payload: unknown, status?: number): string {
  if (status === 404) {
    return "Register API not found. Please deploy the latest backend service.";
  }

  if (!payload || typeof payload !== "object") {
    return status ? `Registration failed (HTTP ${status}). Please try again.` : "Registration failed. Please try again.";
  }

  const data = payload as RegistrationError;

  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]);
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return status ? `Registration failed (HTTP ${status}). Please try again.` : "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const passwordsMismatch = useMemo(
    () => password1.length > 0 && password2.length > 0 && password1 !== password2,
    [password1, password2]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password1.trim() || !password2.trim()) {
      setError("Email and password fields are required.");
      return;
    }

    if (password1 !== password2) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/register/", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password1,
          password2,
        }),
      });

      if (!res.ok) {
        let payload: unknown = null;
        try {
          payload = await res.json();
        } catch {
          try {
            const raw = await res.text();
            payload = raw ? { detail: raw } : null;
          } catch {
            payload = null;
          }
        }
        setError(getErrorMessage(payload, res.status));
        return;
      }

      const data = (await res.json()) as {
        access: string;
        refresh: string;
        user: Pick<AppUser, "id" | "username" | "email">;
      };

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch {
      setError("Registration request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-10 text-center shadow-lg">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold text-green-600">Account Created</h1>
          <p className="text-sm text-gray-500">Logging you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-8 mt-2 text-center text-2xl text-gray-800">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="relative">
            <input
              type={showPassword1 ? "text" : "password"}
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border px-3 py-3 pr-12 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword1((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword1 ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword2 ? "text" : "password"}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Confirm Password"
              className="w-full rounded-lg border px-3 py-3 pr-12 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword2((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword2 ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          {passwordsMismatch && <p className="text-sm text-red-500">Passwords do not match.</p>}

          <button
            type="submit"
            disabled={submitting || passwordsMismatch}
            className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
