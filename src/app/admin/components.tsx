import type { ReactNode } from "react";

export function AdminButton({
  action,
  id,
  op,
  children,
  danger = false,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  op: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" className={`text-btn${danger ? " text-btn--danger" : ""}`}>
        {children}
      </button>
    </form>
  );
}

export function AdminTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminSearch({ q, placeholder }: { q?: string; placeholder: string }) {
  return (
    <form method="get" className="inline-search" role="search">
      <input name="q" type="search" defaultValue={q} placeholder={placeholder} className="input input--search" />
      <button className="btn btn--secondary">Search</button>
    </form>
  );
}
