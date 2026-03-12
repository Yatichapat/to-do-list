"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiGet } from "@/lib/api";
import type { DashboardStats, DueSoonTask } from "@/lib/types";
import { STATUS_CHART_COLOR, STATUS_LABEL } from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDueTask, setSelectedDueTask] = useState<DueSoonTask | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.replace("/login");
      return;
    }
    apiGet<DashboardStats>("/stats/")
      .then((data) => { setStats(data); setLoading(false); })
      .catch((err) => { if (err.status === 401) router.replace("/login"); });
  }, [router]);

  const statCards = [
    { label: "Total Tasks", value: stats?.total ?? 0, color: "bg-blue-50 text-blue-700", border: "border-blue-200" },
    { label: "Pending", value: stats?.pending ?? 0, color: "bg-yellow-50 text-yellow-700", border: "border-yellow-200" },
    { label: "In Progress", value: stats?.in_progress ?? 0, color: "bg-indigo-50 text-indigo-700", border: "border-indigo-200" },
    { label: "Completed", value: stats?.completed ?? 0, color: "bg-green-50 text-green-700", border: "border-green-200" },
    { label: "Due in 7 Days", value: stats?.due_soon ?? 0, color: "bg-red-50 text-red-700", border: "border-red-200" },
  ];

  const totalForChart =
    (stats?.pending ?? 0) + (stats?.in_progress ?? 0) + (stats?.completed ?? 0);
  const pendingPct = totalForChart ? ((stats?.pending ?? 0) / totalForChart) * 100 : 0;
  const progressPct = totalForChart ? ((stats?.in_progress ?? 0) / totalForChart) * 100 : 0;
  const donePct = 100 - pendingPct - progressPct;

  const pieStyle = {
    background: `conic-gradient(${STATUS_CHART_COLOR.pending} 0% ${pendingPct}%, ${STATUS_CHART_COLOR.progress} ${pendingPct}% ${pendingPct + progressPct}%, ${STATUS_CHART_COLOR.done} ${pendingPct + progressPct}% 100%)`,
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });

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

            {/* Status pie and due soon list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4">Tasks by Status</h2>
                <div className="flex items-center gap-6">
                  <div className="relative h-40 w-40 rounded-full" style={pieStyle}>
                    <div className="absolute inset-8 rounded-full bg-white flex items-center justify-center text-sm font-semibold text-gray-700">
                      {totalForChart}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_CHART_COLOR.pending }} />
                      <span className="text-gray-600">Pending: {stats?.pending ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_CHART_COLOR.progress }} />
                      <span className="text-gray-600">In Progress: {stats?.in_progress ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_CHART_COLOR.done }} />
                      <span className="text-gray-600">Completed: {stats?.completed ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Due Soon List */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4">Due in 7 Days</h2>
                {!stats?.due_soon_tasks || stats.due_soon_tasks.length === 0 ? (
                  <p className="text-sm text-gray-400">No tasks due in the next 7 days.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.due_soon_tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setSelectedDueTask(task)}
                        className="w-full text-left rounded-lg border border-gray-100 p-3 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                      >
                        <p className="font-medium text-gray-800 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {formatDate(task.due_date)}
                          {task.category_name ? ` • ${task.category_name}` : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {STATUS_LABEL[task.status] ?? task.status}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

      {selectedDueTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedDueTask(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{selectedDueTask.title}</h2>
              <button
                onClick={() => setSelectedDueTask(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Description:</span>{" "}
                {selectedDueTask.description || "No description"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Status:</span>{" "}
                {STATUS_LABEL[selectedDueTask.status] ?? selectedDueTask.status}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Category:</span>{" "}
                {selectedDueTask.category_name || "Uncategorized"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Due date:</span>{" "}
                {formatDate(selectedDueTask.due_date)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
