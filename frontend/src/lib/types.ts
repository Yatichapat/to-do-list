export interface Category {
  id: number;
  name: string;
}

export interface AppUser {
  id: number;
  username: string;
  email: string;
}

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: string;
  due_date: string | null;
  category: number | null;
  category_name: string | null;
  tag_users: number[];
  tag_users_detail: AppUser[];
  created_at: string;
}

export interface DueSoonTask {
  id: number;
  title: string;
  description: string;
  status: string;
  due_date: string;
  category_name: string | null;
}

export interface DashboardStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  due_soon: number;
  due_soon_tasks: DueSoonTask[];
  by_category: Record<string, number>;
}
