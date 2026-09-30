import Link from "next/link";
import { Avatar } from "@/components/ui";
import { detectAiTool, excerpt, firstName, timeAgo } from "@/lib/format";
import type { RequestListItem } from "@/lib/queries";

function RequestCard({ request: r }: { request: RequestListItem }) {
  const tool = detectAiTool(`${r.aiCreated} ${r.title}`);
  return (
    <Link href={`/requests/${r.slug}`} className="request-card">
      <div className="byline">
        <Avatar name={r.requesterName} size="sm" />
        <span className="byline__text">
          <span className="strong">{firstName(r.requesterName)}</span>{" "}
          <span className="muted">{tool ? `built this with ${tool}` : "built this with AI"}</span>
        </span>
        <span className="byline__time">{timeAgo(r.publishedAt ?? r.createdAt)}</span>
      </div>

      <h2 className="request-card__title">{r.title}</h2>

      <div>
        <p className="label-caps">What&apos;s not right</p>
        <p className="request-card__quote">{excerpt(r.notRight, 170)}</p>
      </div>

      {r.problemTags.length > 0 && (
        <ul className="tags">
          {r.problemTags.slice(0, 2).map((t) => (
            <li key={t} className="tag tag--outline">
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="request-card__foot">
        <span className="small muted">{r.budget ?? "Budget to discuss"}</span>
        <span className="request-card__cta">Can you help? →</span>
      </div>
    </Link>
  );
}

export function RequestList({ requests }: { requests: RequestListItem[] }) {
  return (
    <ul className="request-grid" role="list">
      {requests.map((r) => (
        <li key={r.id}>
          <RequestCard request={r} />
        </li>
      ))}
    </ul>
  );
}
