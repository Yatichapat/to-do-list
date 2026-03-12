"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AppUser } from "@/lib/types";
import { Eye, EyeOff } from "lucide-react";

import GoogleProvider from "@/components/GoogleProvider";

type CredentialResponse = Parameters<React.ComponentProps<typeof GoogleLogin>["onSuccess"]>[0];

export default function LoginPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("Demo1234!");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSuccess = (access: string, refresh: string, user: Pick<AppUser, "username" | "email">) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("user", JSON.stringify(user));
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setError("");
    const token = credentialResponse.credential;
    if (!token) {
      setError("Google credential missing.");
      return;
    }

    try {
      const res = await apiFetch("/google-login/", {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        setError("Google login failed. Please try again.");
        return;
      }

      const data = await res.json();
      handleSuccess(data.access, data.refresh, data.user);
    } catch {
      setError("Google login request failed.");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
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
      handleSuccess(data.access, data.refresh, { username, email: data.user?.email ?? `${username}@local` });
    } catch {
      setError("Login request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="p-10 shadow-lg rounded-lg bg-white text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">Login Successfully!</h1>
          <p className="text-gray-400 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleProvider>
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 shadow-lg rounded-lg bg-white">
        <h1 className="text-2xl mb-9 mt-2 text-gray-800 text-center">Login to To-Do App</h1>

        <form onSubmit={handlePasswordLogin} className="space-y-3 mb-10">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full border rounded-lg px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border rounded-lg px-3 py-3 pr-12 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Login with Username"}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleLogin
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          onSuccess={handleGoogleLogin}
          onError={() => setError("Google login failed.")}
        />

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    </div>
    </GoogleProvider>
  );
}
