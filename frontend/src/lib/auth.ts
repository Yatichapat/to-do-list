import type { AppUser } from "./types";

export interface AuthData {
  access: string;
  refresh: string;
  user: Pick<AppUser, "id" | "username" | "email">;
}

export function saveSession(data: AuthData): void {
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("user", JSON.stringify(data.user));
}
