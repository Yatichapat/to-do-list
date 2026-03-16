"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import TaskModal from "@/components/TaskModal";
import TaskList from "@/components/TaskList";
import { apiFetch, apiDelete, apiPatch } from "@/lib/api";
import type { AppUser, Category, TaskItem } from "@/lib/types";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.replace("/login");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [tasksRes, catsRes, usersRes] = await Promise.all([
      apiFetch("/tasks/"),
      apiFetch("/categories/"),
      apiFetch("/users/"),
    ]);
    if (tasksRes.status === 401 || catsRes.status === 401 || usersRes.status === 401) {
      router.replace("/login");
      return;
    }
    setTasks(await tasksRes.json());
    setCategories(await catsRes.json());
    setUsers(await usersRes.json());
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    await apiDelete(`/tasks/${id}/`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleChangeStatus = async (task: TaskItem, status: string) => {
    if (task.status === status) return;

    const previous = task.status;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status } : t))
    );

    const res = await apiPatch(`/tasks/${task.id}/`, { status });

    if (!res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: previous } : t))
      );
    }
  };

  const handleChangeCategory = async (task: TaskItem, categoryId: number | null) => {
    if (task.category === categoryId) return;

    const previousCategory = task.category;
    const previousCategoryName = task.category_name;
    const nextCategoryName =
      categoryId === null
        ? null
        : categories.find((category) => category.id === categoryId)?.name ?? null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, category: categoryId, category_name: nextCategoryName }
          : t
      )
    );

    const res = await apiPatch(`/tasks/${task.id}/`, { category: categoryId });

    if (!res.ok) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, category: previousCategory, category_name: previousCategoryName }
            : t
        )
      );
    }
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

  const openEdit = (task: TaskItem) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleCategoryCreated = (category: Category) => {
    setCategories((prev) => {
      if (prev.some((item) => item.id === category.id)) {
        return prev;
      }

      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleCategoryDeleted = (categoryId: number) => {
    setCategories((prev) => prev.filter((category) => category.id !== categoryId));
    setTasks((prev) =>
      prev.map((task) =>
        task.category === categoryId
          ? { ...task, category: null, category_name: null }
          : task
      )
    );
    setFilterCategory((prev) => (prev === String(categoryId) ? "all" : prev));
  };

  const handleSaved = () => {
    setModalOpen(false);
    loadData();
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
            className="flex-1 min-w-48 border rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="progress">In Progress</option>
            <option value="done">Completed</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

        <TaskList
          loading={loading}
          tasks={filteredTasks}
          categories={categories}
          onEdit={openEdit}
          onDelete={handleDelete}
          onChangeStatus={handleChangeStatus}
          onChangeCategory={handleChangeCategory}
        />
      </main>

      {modalOpen && (
        <TaskModal
          task={editingTask as any}
          categories={categories}
          users={users}
          onCategoryCreated={handleCategoryCreated}
          onCategoryDeleted={handleCategoryDeleted}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
