import Link from "next/link";
import type { ReactNode } from "react";
import type { Skill } from "@/db/schema";

export function SkillTags({ skills, limit }: { skills: Pick<Skill, "id" | "name">[]; limit?: number }) {
  if (skills.length === 0) return null;
  const shown = limit ? skills.slice(0, limit) : skills;
  const rest = skills.length - shown.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
      {shown.map((s) => (
        <li key={s.id} className="tag">
          {s.name}
        </li>
      ))}
      {rest > 0 && <li className="tag bg-line-soft text-muted">+{rest}</li>}
    </ul>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-y border-line-soft py-12 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
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
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line-soft pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description && <div className="mt-3 text-base leading-7 text-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
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
    <nav className="mt-10 flex items-center justify-between text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-secondary">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn-secondary">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-amber-50 text-amber-800",
    published: "bg-emerald-50 text-emerald-800",
    closed: "bg-slate-100 text-slate-700",
    removed: "bg-red-50 text-red-700",
    hidden: "bg-slate-100 text-slate-700",
    open: "bg-amber-50 text-amber-800",
    resolved: "bg-emerald-50 text-emerald-800",
    dismissed: "bg-slate-100 text-slate-700",
    active: "bg-emerald-50 text-emerald-800",
    suspended: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
