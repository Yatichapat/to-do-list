"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import TaskModal from "@/components/TaskModal";
import { apiFetch } from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  due_date: string | null;
  category: number | null;
  category_name: string | null;
  assigned_users_detail: { id: number; username: string; email: string }[];
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  progress: "In Progress",
  done: "Completed",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.replace("/login");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [tasksRes, catsRes] = await Promise.all([
      apiFetch("/tasks/"),
      apiFetch("/categories/"),
    ]);
    if (tasksRes.status === 401 || catsRes.status === 401) {
      router.replace("/login");
      return;
    }
    setTasks(await tasksRes.json());
    setCategories(await catsRes.json());
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    await apiFetch(`/tasks/${id}/`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        search === "" ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      const matchCategory =
        filterCategory === "all" ||
        (filterCategory === "none" && t.category === null) ||
        String(t.category) === filterCategory;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [tasks, search, filterStatus, filterCategory]);

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task as any);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    loadData();
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const isOverdue = (due: string | null, status: string) => {
    if (!due || status === "done") return false;
    return new Date(due) < new Date();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            + Add Task
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="progress">In Progress</option>
            <option value="done">Completed</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Categories</option>
            <option value="none">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>

          {(search || filterStatus !== "all" || filterCategory !== "all") && (
            <button
              onClick={() => { setSearch(""); setFilterStatus("all"); setFilterCategory("all"); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-3">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>

        {/* Task list */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No tasks found</div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status]}`}>
                      {STATUS_LABEL[task.status]}
                    </span>
                    {task.category_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {task.category_name}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-500 truncate mb-1">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    {task.due_date && (
                      <span className={isOverdue(task.due_date, task.status) ? "text-red-500 font-medium" : ""}>
                        📅 {formatDate(task.due_date)}
                        {isOverdue(task.due_date, task.status) && " (Overdue)"}
                      </span>
                    )}
                    {task.assigned_users_detail.length > 0 && (
                      <span>
                        👥 {task.assigned_users_detail.map((u) => u.username).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(task)}
                    className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <TaskModal
          task={editingTask as any}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
