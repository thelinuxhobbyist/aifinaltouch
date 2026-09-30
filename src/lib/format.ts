const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export function formatDate(d: Date | null | undefined): string {
  return d ? dateFmt.format(d) : "";
}

export function formatDateTime(d: Date): string {
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

export function timeAgo(d: Date | null | undefined): string {
  if (!d) return "";
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(d);
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function excerpt(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export const WORK_MODE_LABEL = { remote: "Remote", onsite: "On-site", hybrid: "Remote or on-site" } as const;
export const REMOTE_PREF_LABEL = { remote: "Remote", onsite: "On-site", either: "Remote or on-site" } as const;
