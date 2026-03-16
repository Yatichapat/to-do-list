export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  progress: "In Progress",
  done: "Completed",
};

/** Tailwind classes for task-list badge pills */
export const STATUS_BADGE_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

/** Hex colours used in charts */
export const STATUS_CHART_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  progress: "#3B82F6",
  done: "#10B981",
};

export const NEXT_PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");