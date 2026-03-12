"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, apiPatch, apiPost } from "@/lib/api";
import type { AppUser, Category } from "@/lib/types";

interface Task {
  id?: number;
  title: string;
  description: string;
  status: string;
  due_date: string;
  category: number | null;
  tag_users: number[];
}

interface Props {
  task: Task | null;
  categories: Category[];
  users: AppUser[];
  onCategoryCreated: (category: Category) => void;
  onCategoryDeleted: (categoryId: number) => void;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm: Task = {
  title: "",
  description: "",
  status: "pending",
  due_date: "",
  category: null,
  tag_users: [],
};

export default function TaskModal({
  task,
  categories,
  users,
  onCategoryCreated,
  onCategoryDeleted,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<Task>(emptyForm);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assignedUserQuery, setAssignedUserQuery] = useState("");
  const [showAssignedUserOptions, setShowAssignedUserOptions] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (!task) {
      setForm(emptyForm);
      setCategoryQuery("");
    } else {
      const normalizedTagUsers =
        task.tag_users ??
        (task as unknown as { tag_users_detail?: { id: number }[] }).tag_users_detail?.map((u) => u.id) ??
        [];

      const selectedCategory = categories.find((c) => c.id === task.category);

      setForm({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        due_date: task.due_date,
        category: task.category,
        tag_users: normalizedTagUsers,
      });
      setCategoryQuery(selectedCategory?.name ?? "");
    }
    setError("");
    setShowCategoryOptions(false);
    setAssignedUserQuery("");
    setShowAssignedUserOptions(false);
  }, [task, categories]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "category" ? (value === "" ? null : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      due_date: form.due_date || null,
      category: form.category,
      tag_users: form.tag_users,
    };

    const res = task?.id
      ? await apiPatch(`/tasks/${task.id}/`, payload)
      : await apiPost("/tasks/", payload);

    setSaving(false);

    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(JSON.stringify(data));
    }
  };

  const toggleAssignedUser = (userId: number) => {
    setForm((prev) => {
      const exists = prev.tag_users.includes(userId);
      return {
        ...prev,
        tag_users: exists
          ? prev.tag_users.filter((id) => id !== userId)
          : [...prev.tag_users, userId],
      };
    });
  };

  const selectedUsers = useMemo(
    () => users.filter((user) => form.tag_users.includes(user.id)),
    [users, form.tag_users]
  );

  const filteredUsers = useMemo(() => {
    const query = assignedUserQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (form.tag_users.includes(user.id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [users, form.tag_users, assignedUserQuery]);

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) {
      return localCategories;
    }

    return localCategories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [localCategories, categoryQuery]);

  const hasExactCategory = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) {
      return false;
    }

    return localCategories.some((category) => category.name.toLowerCase() === query);
  }, [localCategories, categoryQuery]);

  const selectCategory = (category: Category) => {
    setForm((prev) => ({ ...prev, category: category.id }));
    setCategoryQuery(category.name);
    setShowCategoryOptions(false);
  };

  const createCategory = async () => {
    const name = categoryQuery.trim();
    if (!name || hasExactCategory || categoryBusy) {
      return;
    }

    setCategoryBusy(true);
    const res = await apiPost("/categories/", { name });
    setCategoryBusy(false);

    if (!res.ok) {
      setError("Failed to create category.");
      return;
    }

    const created = (await res.json()) as Category;
    setLocalCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    onCategoryCreated(created);
    setForm((prev) => ({ ...prev, category: created.id }));
    setCategoryQuery(created.name);
    setShowCategoryOptions(false);
  };

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete category \"${category.name}\"?`)) {
      return;
    }

    setCategoryBusy(true);
    const res = await apiFetch(`/categories/${category.id}/`, { method: "DELETE" });
    setCategoryBusy(false);

    if (!res.ok) {
      setError("Failed to delete category.");
      return;
    }

    setLocalCategories((prev) => prev.filter((item) => item.id !== category.id));
    onCategoryDeleted(category.id);
    if (form.category === category.id) {
      setForm((prev) => ({ ...prev, category: null }));
      setCategoryQuery("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {task?.id ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="pending">Pending</option>
                <option value="progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="relative">
                <input
                  type="text"
                  value={categoryQuery}
                  onChange={(e) => {
                    setCategoryQuery(e.target.value);
                    setShowCategoryOptions(true);
                  }}
                  onFocus={() => setShowCategoryOptions(true)}
                  onBlur={() => window.setTimeout(() => setShowCategoryOptions(false), 120)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      await createCategory();
                    }
                  }}
                  placeholder="Type to search or press Enter to create"
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {showCategoryOptions && (
                  <div className="absolute z-10 mt-2 max-h-44 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setForm((prev) => ({ ...prev, category: null }));
                        setCategoryQuery("");
                        setShowCategoryOptions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                    >
                      No category
                    </button>

                    {!hasExactCategory && categoryQuery.trim() && (
                      <button
                        type="button"
                        disabled={categoryBusy}
                        onMouseDown={async (e) => {
                          e.preventDefault();
                          await createCategory();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                      >
                        Create "{categoryQuery.trim()}"
                      </button>
                    )}

                    {filteredCategories.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">No matching categories</p>
                    ) : (
                      filteredCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50"
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectCategory(category);
                            }}
                            className="min-w-0 flex-1 text-left text-sm text-gray-700 truncate"
                          >
                            {category.name}
                          </button>
                          <button
                            type="button"
                            disabled={categoryBusy}
                            onMouseDown={async (e) => {
                              e.preventDefault();
                              await deleteCategory(category);
                            }}
                            className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                          >
                            x
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="datetime-local"
              name="due_date"
              value={form.due_date ? form.due_date.slice(0, 16) : ""}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag Users</label>
            <div className="relative">
              <div className="border border-gray-300 rounded-lg px-3 py-2 min-h-11 focus-within:ring-2 focus-within:ring-blue-400">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleAssignedUser(user.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                    >
                      <span>{user.username}</span>
                      <span className="text-blue-500">x</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={assignedUserQuery}
                  onChange={(e) => {
                    setAssignedUserQuery(e.target.value);
                    setShowAssignedUserOptions(true);
                  }}
                  onFocus={() => setShowAssignedUserOptions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowAssignedUserOptions(false), 120);
                  }}
                  placeholder="Click to search users"
                  className="w-full text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>

              {showAssignedUserOptions && (
                <div className="absolute z-10 mt-2 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {users.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400">No users available</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400">No matching users</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggleAssignedUser(user.id);
                          setAssignedUserQuery("");
                          setShowAssignedUserOptions(true);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate">{user.username}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <span className="text-xs text-blue-600">Add</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : task?.id ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
