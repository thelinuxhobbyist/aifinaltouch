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
      <button type="submit" className={`text-sm hover:underline ${danger ? "text-red-700" : "text-brand"}`}>
        {children}
      </button>
    </form>
  );
}

export function AdminTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
          <tr>
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminSearch({ q, placeholder }: { q?: string; placeholder: string }) {
  return (
    <form method="get" className="mb-6 flex max-w-md gap-2" role="search">
      <input name="q" type="search" defaultValue={q} placeholder={placeholder} className="input mt-0" />
      <button className="btn-secondary">Search</button>
    </form>
  );
}
