"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      setEmail(user.email ?? null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const displayName = email ? email.split("@")[0] : "";

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        pathname === href
          ? "text-blue-600"
          : "text-gray-500 hover:text-gray-800"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold text-gray-800">To-Do App</span>
        {navLink("/dashboard", "Dashboard")}
        {navLink("/tasks", "Tasks")}
      </div>

      <div className="flex items-center gap-4">
        {email && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold uppercase">
              {displayName.charAt(0)}
            </div>
            <span className="text-sm text-gray-700">{displayName}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
