"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { PartyPopper } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import SuccessCard from "@/components/SuccessCard";

export default function LoginPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("Demo1234!");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError("Invalid username or password.");
        return;
      }

      const data = await res.json();
      saveSession({
        access: data.access,
        refresh: data.refresh,
        user: { id: data.user?.id ?? 0, username, email: data.user?.email ?? `${username}@local` },
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Login request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SuccessCard icon={<PartyPopper className="w-22 h-22"/>} title="Login Successfully!" subtitle="Redirecting to dashboard..." />
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 shadow-lg rounded-lg bg-white">
        <h1 className="text-2xl mb-9 mt-2 text-gray-800 text-center">Login to To-Do App</h1>

        <form onSubmit={handleSubmit} className="space-y-3 mb-10">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full border rounded-lg px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <PasswordInput value={password} onChange={setPassword} />
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Login with Username"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <p className="mt-5 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
