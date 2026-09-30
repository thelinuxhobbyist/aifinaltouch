import Link from "next/link";
import type { ReactNode } from "react";
import type { Skill } from "@/db/schema";

export function SkillTags({ skills, limit }: { skills: Pick<Skill, "id" | "name">[]; limit?: number }) {
  if (skills.length === 0) return null;
  const shown = limit ? skills.slice(0, limit) : skills;
  const rest = skills.length - shown.length;
  return (
    <ul className="tags" aria-label="Skills">
      {shown.map((s) => (
        <li key={s.id} className="tag">
          {s.name}
        </li>
      ))}
      {rest > 0 && <li className="tag tag--more">+{rest}</li>}
    </ul>
  );
}

export function Avatar({ name, size }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const tone = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4;
  return (
    <span className={`avatar avatar--tone-${tone}${size ? ` avatar--${size}` : ""}`} aria-hidden>
      {initials || "?"}
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {children && <div className="empty__text">{children}</div>}
      {action && <div className="cluster empty__actions">{action}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="h1">{title}</h1>
        {description && <div className="lead">{description}</div>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn--secondary">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn--secondary">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

const BADGE_TONE: Record<string, string> = {
  published: "success",
  active: "success",
  resolved: "success",
  draft: "warning",
  open: "warning",
  closed: "neutral",
  hidden: "neutral",
  dismissed: "neutral",
  removed: "danger",
  suspended: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge--${BADGE_TONE[status] ?? "neutral"}`}>{status}</span>;
}

export function CheckIcon() {
  return (
    <svg className="icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
