export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
