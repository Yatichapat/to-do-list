"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const handleLogin = async (credentialResponse: any) => {
    try {
      const token = credentialResponse.credential;
      if (!token) {
        console.error("Google credential missing in response");
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/api/google-login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const raw = await res.text();
        console.error("Google login API failed", res.status, raw);
        return;
      }

      const data = await res.json();

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error) {
      console.error("Google login request failed", error);
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
    <div className="flex h-screen items-center justify-center">

      <div className="p-8 shadow-lg rounded-lg">

        <h1 className="text-2xl mb-4">
          Login to To-Do App
        </h1>

        <GoogleLogin
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          onSuccess={handleLogin}
          onError={() => console.log("Login Failed")}
        />

      </div>

    </div>
  );
}