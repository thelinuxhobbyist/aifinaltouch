import Link from "next/link";
import { SkillTags } from "@/components/ui";
import type { Request, Skill } from "@/db/schema";
import { excerpt, timeAgo } from "@/lib/format";

export function RequestList({ requests }: { requests: (Request & { skills: Skill[] })[] }) {
  return (
    <ul className="rows">
      {requests.map((r) => (
        <li key={r.id}>
          <Link href={`/requests/${r.slug}`} className="row-link">
            <div className="min-w-0">
              <p className="row-link__title">{r.title}</p>
              <p className="row-link__body">{excerpt(r.notRight, 200)}</p>
              <div className="mt-3">
                <SkillTags skills={r.skills} limit={4} />
              </div>
            </div>
            <p className="row-link__meta">
              {timeAgo(r.publishedAt ?? r.createdAt)}
              {r.budget && (
                <>
                  <br />
                  <span className="soft">{r.budget}</span>
                </>
              )}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
