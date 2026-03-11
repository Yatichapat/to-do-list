"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

interface AppUser {
  id: number;
  username: string;
  email: string;
}

interface Task {
  id?: number;
  title: string;
  description: string;
  status: string;
  due_date: string;
  category: number | null;
  assigned_users: number[];
}

interface Props {
  task: Task | null;
  categories: Category[];
  users: AppUser[];
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm: Task = {
  title: "",
  description: "",
  status: "pending",
  due_date: "",
  category: null,
  assigned_users: [],
};

export default function TaskModal({ task, categories, users, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Task>(task ?? emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assignedUserQuery, setAssignedUserQuery] = useState("");
  const [showAssignedUserOptions, setShowAssignedUserOptions] = useState(false);

  useEffect(() => {
    setForm(task ?? emptyForm);
    setError("");
    setAssignedUserQuery("");
    setShowAssignedUserOptions(false);
  }, [task]);

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
      assigned_users: form.assigned_users,
    };

    const res = task?.id
      ? await apiFetch(`/tasks/${task.id}/`, { method: "PATCH", body: JSON.stringify(payload) })
      : await apiFetch("/tasks/", { method: "POST", body: JSON.stringify(payload) });

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
      const exists = prev.assigned_users.includes(userId);
      return {
        ...prev,
        assigned_users: exists
          ? prev.assigned_users.filter((id) => id !== userId)
          : [...prev.assigned_users, userId],
      };
    });
  };

  const selectedUsers = useMemo(
    () => users.filter((user) => form.assigned_users.includes(user.id)),
    [users, form.assigned_users]
  );

  const filteredUsers = useMemo(() => {
    const query = assignedUserQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (form.assigned_users.includes(user.id)) {
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
  }, [users, form.assigned_users, assignedUserQuery]);

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
              <select
                name="category"
                value={form.category ?? ""}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Users</label>
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
