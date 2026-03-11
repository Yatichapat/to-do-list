"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";

interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  due_soon: number;
  by_category: Record<string, number>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.replace("/login");
      return;
    }
    apiFetch("/stats/").then(async (res) => {
      if (res.status === 401) { router.replace("/login"); return; }
      setStats(await res.json());
      setLoading(false);
    });
  }, [router]);

  const statCards = [
    { label: "Total Tasks", value: stats?.total ?? 0, color: "bg-blue-50 text-blue-700", border: "border-blue-200" },
    { label: "Pending", value: stats?.pending ?? 0, color: "bg-yellow-50 text-yellow-700", border: "border-yellow-200" },
    { label: "In Progress", value: stats?.in_progress ?? 0, color: "bg-indigo-50 text-indigo-700", border: "border-indigo-200" },
    { label: "Completed", value: stats?.completed ?? 0, color: "bg-green-50 text-green-700", border: "border-green-200" },
    { label: "Due in 7 Days", value: stats?.due_soon ?? 0, color: "bg-red-50 text-red-700", border: "border-red-200" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <Link
            href="/tasks"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            View All Tasks →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {statCards.map((card) => (
                <div key={card.label} className={`rounded-xl border p-4 ${card.color} ${card.border}`}>
                  <p className="text-3xl font-bold">{card.value}</p>
                  <p className="text-xs mt-1 font-medium opacity-80">{card.label}</p>
                </div>
              ))}
            </div>

            {/* By category */}
            {stats && Object.keys(stats.by_category).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4">Tasks by Category</h2>
                <div className="space-y-3">
                  {Object.entries(stats.by_category).map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-32 truncate">{cat}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: `${Math.round((count / (stats.total || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
