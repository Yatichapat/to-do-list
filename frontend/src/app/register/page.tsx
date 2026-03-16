"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import PasswordInput from "@/components/PasswordInput";
import SuccessCard from "@/components/SuccessCard";
import { CheckCircle } from "lucide-react";

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
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    if (typeof value === "string" && value.trim()) return value;
  }
  return status ? `Registration failed (HTTP ${status}). Please try again.` : "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
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
        user: { id: number; username: string; email: string };
      };

      saveSession(data);

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
      <SuccessCard icon={<CheckCircle className="w-22 h-22"/>} title="Account Created" subtitle="Logging you in..." />
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

          <PasswordInput value={password1} onChange={setPassword1} placeholder="Password" />

          <PasswordInput value={password2} onChange={setPassword2} placeholder="Confirm Password" />

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
