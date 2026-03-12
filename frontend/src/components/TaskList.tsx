"use client";

import { useState } from "react";
import type { Category, TaskItem } from "@/lib/types";
import { STATUS_BADGE_COLOR, STATUS_LABEL } from "@/lib/constants";
import { Calendar, Users } from "lucide-react";

export type { TaskItem };

interface Props {
  loading: boolean;
  tasks: TaskItem[];
  categories: Category[];
  onEdit: (task: TaskItem) => void;
  onDelete: (id: number) => void;
  onChangeStatus: (task: TaskItem, status: string) => void;
  onChangeCategory: (task: TaskItem, categoryId: number | null) => void;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isOverdue(due: string | null, status: string) {
  if (!due || status === "done") return false;
  return new Date(due) < new Date();
}

export default function TaskList({
  loading,
  tasks,
  categories,
  onEdit,
  onDelete,
  onChangeStatus,
  onChangeCategory,
}: Props) {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [statusEditingTaskId, setStatusEditingTaskId] = useState<number | null>(null);
  const [categoryEditingTaskId, setCategoryEditingTaskId] = useState<number | null>(null);

  return (
    <>
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No tasks found</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
                  
                  {/* Status */}
                  {statusEditingTaskId === task.id ? (
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        onChangeStatus(task, e.target.value);
                        setStatusEditingTaskId(null);
                      }}
                      onBlur={() => setStatusEditingTaskId(null)}
                      className="text-xs px-2 py-0.5 rounded-full border bg-white text-gray-700"
                      autoFocus
                    >
                      <option value="pending">Pending</option>
                      <option value="progress">In Progress</option>
                      <option value="done">Completed</option>
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusEditingTaskId(task.id);
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE_COLOR[task.status]}`}
                    >
                      {STATUS_LABEL[task.status]}
                    </button>
                  )}

                  {/* Category */}
                  {categoryEditingTaskId === task.id ? (
                    <select
                      value={task.category ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        onChangeCategory(task, e.target.value ? Number(e.target.value) : null);
                        setCategoryEditingTaskId(null);
                      }}
                      onBlur={() => setCategoryEditingTaskId(null)}
                      className="text-xs px-2 py-0.5 rounded-full border bg-white text-gray-700"
                      autoFocus
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryEditingTaskId(task.id);
                      }}
                      className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-500"
                    >
                      {task.category_name || "Uncategorized"}
                    </button>
                  )}
                </div>

                {task.description && (
                  <p className="text-sm text-gray-500 truncate mb-1">{task.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  {task.due_date && (
                    <span
                      className={`inline-flex items-center gap-1 ${
                        isOverdue(task.due_date, task.status)
                          ? "text-red-500 font-medium"
                          : ""
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-red-400" />
                      <span>
                        {formatDate(task.due_date)}
                        {isOverdue(task.due_date, task.status) && " (Overdue)"}
                      </span>
                    </span>
                  )}
                  {task.tag_users_detail.length > 0 && (
                    <span>
                      <Users className="inline-block mr-2 text-blue-400" size={14} />
                      {task.tag_users_detail.map((u) => u.username).join(", ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEdit(task)}
                  className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{selectedTask.title}</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Description:</span>{" "}
                {selectedTask.description || "No description"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Status:</span>{" "}
                {STATUS_LABEL[selectedTask.status]}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Category:</span>{" "}
                {selectedTask.category_name || "Uncategorized"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Due date:</span>{" "}
                {formatDate(selectedTask.due_date) || "Not set"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Tagged Users:</span>{" "}
                {selectedTask.tag_users_detail.length > 0
                  ? selectedTask.tag_users_detail.map((u) => u.username).join(", ")
                  : "No tagged users"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
