import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ActionForm, SubmitButton, TextArea } from "@/components/forms";
import { ReportButton } from "@/components/report-button";
import { Avatar, SkillTags, StatusBadge } from "@/components/ui";
import type { User } from "@/db/schema";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { detectAiTool, excerpt, firstName, formatDate, timeAgo } from "@/lib/format";
import {
  canViewRequest,
  getInterest,
  getOwnProfile,
  getRequestBySlug,
  listInterestsForRequest,
  type RequestWithDetails,
} from "@/lib/queries";
import { fileUrl } from "@/lib/uploads";
import { expressInterest, setRequestStatus } from "../actions";

const loadRequest = cache((slug: string) => getRequestBySlug(slug));

export async function generateMetadata({ params }: PageProps<"/requests/[slug]">): Promise<Metadata> {
  const request = await loadRequest((await params).slug);
  if (!request || (request.status !== "published" && request.status !== "closed")) {
    return { title: "Request", robots: { index: false } };
  }
  return {
    title: request.title,
    description: excerpt(`${request.aiCreated} ${request.needs}`, 160),
    alternates: { canonical: `/requests/${request.slug}` },
    robots: request.status === "closed" ? { index: false } : undefined,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="detail-section">
      <h2 className="label-caps detail-section__title">{title}</h2>
      {children}
    </section>
  );
}

export default async function RequestPage({ params, searchParams }: PageProps<"/requests/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [request, user] = await Promise.all([loadRequest(slug), getCurrentUser()]);
  if (!request || !canViewRequest(request, user)) notFound();

  const isOwner = user?.id === request.userId;
  if (!isOwner && request.status === "published") await track("request_viewed", { userId: user?.id, entityId: request.id });

  const canSeePrivateFiles = isOwner || !!user?.isAdmin || (user ? !!(await getInterest(request.id, user.id)) : false);
  const attachments = request.attachments.filter((a) => a.visibility === "public" || canSeePrivateFiles);
  const tool = detectAiTool(`${request.aiCreated} ${request.title}`);

  return (
    <article className="container page">
      {sp.attachment_error === "1" && isOwner && (
        <p className="alert alert--warning mb-6">
          Your Request was saved, but one of the files couldn&apos;t be uploaded. You can add files from the edit page.
        </p>
      )}

      <div className="with-sidebar">
        <div className="min-w-0">
          <div className="breadcrumb">
            <Link href="/requests">← All Requests</Link>
            {request.status !== "published" && <StatusBadge status={request.status} />}
          </div>
          <h1 className="h1 mt-4">{request.title}</h1>
          <div className="byline mt-5">
            <Avatar name={request.requesterName} size="sm" />
            <span className="byline__text">
              <span className="strong">{firstName(request.requesterName)}</span>{" "}
              <span className="muted">{tool ? `built this with ${tool}` : "built this with AI"}</span>
            </span>
            <span className="byline__time">Posted {timeAgo(request.publishedAt ?? request.createdAt)}</span>
          </div>

          <div className="compare mt-10">
            <section className="compare__card">
              <p className="label-caps">What AI made</p>
              <p className="prose mt-3">{request.aiCreated}</p>
              {request.likes && (
                <>
                  <p className="label-caps mt-6">What they like about it</p>
                  <p className="prose mt-3">{request.likes}</p>
                </>
              )}
            </section>
            <section className="compare__card compare__card--human">
              <p className="label-caps">The last 10% — what isn&apos;t right</p>
              <p className="prose mt-3">{request.notRight}</p>
              {request.problemTags.length > 0 && (
                <ul className="tags mt-4">
                  {request.problemTags.map((t) => (
                    <li key={t} className="tag">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="stack stack--lg mt-10">
            <Section title="What they're looking for">
              <p className="lead">{request.needs}</p>
            </Section>
            {request.skills.length > 0 && (
              <Section title="Skills that might help">
                <SkillTags skills={request.skills} />
              </Section>
            )}
            {attachments.length > 0 && (
              <Section title="Attachments">
                <ul className="grid grid--2" role="list">
                  {attachments.map((a) =>
                    a.contentType.startsWith("image/") ? (
                      <li key={a.id}>
                        <a href={fileUrl(a.id)} target="_blank" rel="noopener">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={fileUrl(a.id)} alt={a.originalName} loading="lazy" className="media" />
                        </a>
                      </li>
                    ) : (
                      <li key={a.id}>
                        <a href={fileUrl(a.id)} className="link small">
                          {a.originalName} (PDF)
                        </a>
                      </li>
                    ),
                  )}
                </ul>
                {request.attachments.length > attachments.length && (
                  <p className="small muted mt-3">Some files are only visible to specialists who have expressed interest.</p>
                )}
              </Section>
            )}
          </div>

          {!isOwner && request.status !== "draft" && (
            <div className="mt-12">
              <ReportButton targetType="request" targetId={request.id} signedIn={!!user} label="Report this Request" />
            </div>
          )}
        </div>

        <aside className="sticky stack">
          <div className="box stack">
            <dl className="meta">
              {request.url && (
                <div>
                  <dt>Link</dt>
                  <dd className="break">
                    <a href={request.url} target="_blank" rel="nofollow noopener noreferrer" className="link">
                      {request.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt>Budget</dt>
                <dd>{request.budget ?? "To discuss directly"}</dd>
              </div>
            </dl>
            <div className="divider-top">
              {!isOwner && <h2 className="h4 mb-4">Can you help {firstName(request.requesterName)}?</h2>}
              {isOwner ? <OwnerPanel request={request} /> : <InterestPanel request={request} user={user} />}
            </div>
          </div>
        </aside>
      </div>

      {isOwner && <InterestList requestId={request.id} />}
    </article>
  );
}

function OwnerPanel({ request }: { request: RequestWithDetails }) {
  return (
    <div className="stack stack--sm">
      <p className="strong small">This is your Request</p>
      {request.status === "draft" && <p className="small muted">It&apos;s a draft — only you can see it.</p>}
      {request.status === "closed" && <p className="small muted">It&apos;s closed and not accepting new interest.</p>}
      {request.status === "removed" && <p className="alert alert--error">It was removed by a moderator.</p>}
      {request.status !== "removed" && (
        <div className="cluster cluster--tight">
          <Link href={`/requests/${request.slug}/edit`} className="btn btn--secondary">
            Edit
          </Link>
          <form action={setRequestStatus}>
            <input type="hidden" name="requestId" value={request.id} />
            {request.status === "published" ? (
              <button name="status" value="closed" className="btn btn--secondary">
                Close Request
              </button>
            ) : (
              <button name="status" value="published" className="btn btn--primary">
                {request.status === "draft" ? "Publish" : "Reopen"}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

async function InterestPanel({ request, user }: { request: RequestWithDetails; user: User | null }) {
  if (request.status === "closed") {
    return <p className="small muted">This Request is closed and no longer accepting interest.</p>;
  }
  if (!user) {
    return (
      <div className="stack stack--sm">
        <p className="small soft">
          Sign in with a specialist profile to say you&apos;d like to help. You&apos;ll chat here first, then arrange the work
          directly.
        </p>
        <Link
          href={`/sign-in?redirect_url=${encodeURIComponent(`/requests/${request.slug}`)}`}
          className="btn btn--primary btn--block"
        >
          I&apos;m interested
        </Link>
      </div>
    );
  }

  const [existing, profile] = await Promise.all([getInterest(request.id, user.id), getOwnProfile(user.id)]);
  if (existing) {
    return (
      <div className="stack stack--sm">
        <p className="small soft">You expressed interest {timeAgo(existing.interest.createdAt)}.</p>
        {existing.conversationId && (
          <Link href={`/messages/${existing.conversationId}`} className="btn btn--primary btn--block">
            Open conversation
          </Link>
        )}
      </div>
    );
  }
  if (!profile || profile.status !== "published") {
    return (
      <div className="stack stack--sm">
        <p className="small soft">
          {profile
            ? "Make your specialist profile public to express interest."
            : "Create a specialist profile so the requester can see your work."}
        </p>
        <Link href="/profile/edit" className="btn btn--primary btn--block">
          {profile ? "Edit your profile" : "Create a profile"}
        </Link>
      </div>
    );
  }
  if (user.status !== "active") return <p className="alert alert--error">Your account is suspended.</p>;

  return (
    <ActionForm action={expressInterest} className="stack stack--sm">
      <input type="hidden" name="requestId" value={request.id} />
      <TextArea
        name="message"
        label="Add a short message"
        optional
        rows={4}
        placeholder="I've improved several AI-generated React sites and can help with the visual design and UX."
        maxLength={1000}
      />
      <SubmitButton block pendingLabel="Sending…">
        I&apos;m interested
      </SubmitButton>
      <p className="xsmall muted">The requester will see your profile and can reply through AI Final Touch.</p>
    </ActionForm>
  );
}

async function InterestList({ requestId }: { requestId: string }) {
  const rows = await listInterestsForRequest(requestId);
  return (
    <section className="divider-top mt-16" aria-labelledby="interest-heading">
      <h2 id="interest-heading" className="h2">
        Interested specialists {rows.length > 0 && <span className="muted">({rows.length})</span>}
      </h2>
      {rows.length === 0 ? (
        <p className="small muted mt-3">
          No one yet. Specialists browsing Requests will see yours — you&apos;ll get an email when someone is interested.
        </p>
      ) : (
        <ul className="rows mt-6">
          {rows.map(({ interest, profile, skills, conversationId }) => (
            <li key={interest.id} className="row">
              <div className="row__main person-row">
                <Avatar name={profile.name} />
                <div className="min-w-0">
                  <p>
                    <Link href={`/specialists/${profile.slug}`} className="strong hover-brand">
                      {profile.name}
                    </Link>{" "}
                    <span className="muted">· {profile.title}</span>
                  </p>
                  <p className="small soft mt-1">{profile.positioning}</p>
                  <div className="mt-3">
                    <SkillTags skills={skills} limit={6} />
                  </div>
                  {interest.message && <blockquote className="quote mt-4">{interest.message}</blockquote>}
                  <p className="xsmall muted mt-3">{formatDate(interest.createdAt)}</p>
                </div>
              </div>
              <div className="row__side">
                <Link href={`/specialists/${profile.slug}`} className="btn btn--secondary">
                  View profile
                </Link>
                {conversationId && (
                  <Link href={`/messages/${conversationId}`} className="btn btn--primary">
                    Message
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
