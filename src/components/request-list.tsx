import Link from "next/link";
import { SkillTags } from "@/components/ui";
import type { Request, Skill } from "@/db/schema";
import { excerpt, REMOTE_PREF_LABEL, timeAgo } from "@/lib/format";

export function RequestList({ requests }: { requests: (Request & { skills: Skill[] })[] }) {
  return (
    <ul className="divide-y divide-line-soft border-t border-line-soft">
      {requests.map((r) => (
        <li key={r.id}>
          <Link href={`/requests/${r.slug}`} className="group grid gap-3 py-6 sm:grid-cols-[1fr_150px] sm:gap-8">
            <div className="min-w-0">
              <p className="text-base font-semibold group-hover:text-brand">{r.title}</p>
              <p className="mt-1.5 text-[15px] leading-6 text-ink-soft">{excerpt(r.notRight, 200)}</p>
              <div className="mt-3">
                <SkillTags skills={r.skills} limit={4} />
              </div>
            </div>
            <p className="text-sm text-muted sm:text-right">
              {timeAgo(r.publishedAt ?? r.createdAt)}
              <span className="block">{REMOTE_PREF_LABEL[r.remotePreference]}</span>
              {r.budget && <span className="block">{r.budget}</span>}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
