import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ActionForm, SubmitButton, TextArea } from "@/components/forms";
import { ReportButton } from "@/components/report-button";
import { SkillTags, StatusBadge } from "@/components/ui";
import type { User } from "@/db/schema";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { excerpt, formatDate, REMOTE_PREF_LABEL, timeAgo } from "@/lib/format";
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
    <section className="border-t border-line-soft pt-6">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <div className="mt-3">{children}</div>
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

  return (
    <article className="container-page py-12">
      {sp.attachment_error === "1" && isOwner && (
        <p className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your Request was saved, but one of the files couldn&apos;t be uploaded. You can add files from the edit page.
        </p>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <Link href="/requests" className="hover:text-ink">
              ← Requests
            </Link>
            <span aria-hidden>·</span>
            <span>Posted {timeAgo(request.publishedAt ?? request.createdAt)}</span>
            {request.status !== "published" && <StatusBadge status={request.status} />}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{request.title}</h1>
          <div className="mt-5">
            <SkillTags skills={request.skills} />
          </div>

          <div className="mt-10 space-y-8">
            <Section title="What AI created">
              <p className="prose-text">{request.aiCreated}</p>
            </Section>
            {request.likes && (
              <Section title="What they like">
                <p className="prose-text">{request.likes}</p>
              </Section>
            )}
            <Section title="What isn't right">
              {request.problemTags.length > 0 && (
                <ul className="mb-3 flex flex-wrap gap-1.5">
                  {request.problemTags.map((t) => (
                    <li key={t} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-soft">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <p className="prose-text">{request.notRight}</p>
            </Section>
            <Section title="What they need">
              <p className="prose-text">{request.needs}</p>
            </Section>
            {attachments.length > 0 && (
              <Section title="Attachments">
                <ul className="grid gap-4 sm:grid-cols-2">
                  {attachments.map((a) =>
                    a.contentType.startsWith("image/") ? (
                      <li key={a.id}>
                        <a href={fileUrl(a.id)} target="_blank" rel="noopener">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fileUrl(a.id)}
                            alt={a.originalName}
                            loading="lazy"
                            className="aspect-[16/10] w-full rounded-md border border-line object-cover object-top"
                          />
                        </a>
                      </li>
                    ) : (
                      <li key={a.id}>
                        <a href={fileUrl(a.id)} className="link text-sm">
                          {a.originalName} (PDF)
                        </a>
                      </li>
                    ),
                  )}
                </ul>
                {request.attachments.length > attachments.length && (
                  <p className="mt-3 text-sm text-muted">
                    Some files are only visible to specialists who have expressed interest.
                  </p>
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

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <dl className="space-y-4 border-y border-line-soft py-6 text-sm lg:border-t-0 lg:pt-0">
            {request.url && (
              <div>
                <dt className="text-muted">Link</dt>
                <dd className="mt-0.5 break-all">
                  <a href={request.url} target="_blank" rel="nofollow noopener noreferrer" className="link">
                    {request.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </dd>
              </div>
            )}
            {request.budget && (
              <div>
                <dt className="text-muted">Budget</dt>
                <dd className="mt-0.5 font-medium">{request.budget}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Working arrangement</dt>
              <dd className="mt-0.5 font-medium">{REMOTE_PREF_LABEL[request.remotePreference]}</dd>
            </div>
            {request.location && (
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="mt-0.5 font-medium">{request.location}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Posted by</dt>
              <dd className="mt-0.5 font-medium">{request.requesterName.split(" ")[0]}</dd>
            </div>
          </dl>

          {isOwner ? <OwnerPanel request={request} /> : <InterestPanel request={request} user={user} />}
        </aside>
      </div>

      {isOwner && <InterestList requestId={request.id} />}
    </article>
  );
}

function OwnerPanel({ request }: { request: RequestWithDetails }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">This is your Request</p>
      {request.status === "draft" && <p className="text-sm text-muted">It&apos;s a draft — only you can see it.</p>}
      {request.status === "closed" && <p className="text-sm text-muted">It&apos;s closed and not accepting new interest.</p>}
      {request.status === "removed" && <p className="text-sm text-red-700">It was removed by a moderator.</p>}
      {request.status !== "removed" && (
        <div className="flex flex-wrap gap-2">
          <Link href={`/requests/${request.slug}/edit`} className="btn-secondary">
            Edit
          </Link>
          <form action={setRequestStatus}>
            <input type="hidden" name="requestId" value={request.id} />
            {request.status === "published" ? (
              <button name="status" value="closed" className="btn-secondary">
                Close Request
              </button>
            ) : (
              <button name="status" value="published" className="btn-primary">
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
    return <p className="text-sm text-muted">This Request is closed and no longer accepting interest.</p>;
  }
  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">Can you help finish this? Sign in with a specialist profile to express interest.</p>
        <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/requests/${request.slug}`)}`} className="btn-primary w-full">
          I&apos;m interested
        </Link>
      </div>
    );
  }

  const [existing, profile] = await Promise.all([getInterest(request.id, user.id), getOwnProfile(user.id)]);
  if (existing) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">You expressed interest {timeAgo(existing.interest.createdAt)}.</p>
        {existing.conversationId && (
          <Link href={`/messages/${existing.conversationId}`} className="btn-primary w-full">
            Open conversation
          </Link>
        )}
      </div>
    );
  }
  if (!profile || profile.status !== "published") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">
          {profile
            ? "Make your specialist profile public to express interest."
            : "Create a specialist profile so the requester can see your work."}
        </p>
        <Link href="/profile/edit" className="btn-primary w-full">
          {profile ? "Edit your profile" : "Create a profile"}
        </Link>
      </div>
    );
  }
  if (user.status !== "active") return <p className="text-sm text-red-700">Your account is suspended.</p>;

  return (
    <ActionForm action={expressInterest} className="space-y-4">
      <input type="hidden" name="requestId" value={request.id} />
      <TextArea
        name="message"
        label="Add a short message"
        optional
        rows={4}
        placeholder="I've improved several AI-generated React sites and can help with the visual design and UX."
        maxLength={1000}
      />
      <SubmitButton className="w-full" pendingLabel="Sending…">
        I&apos;m interested
      </SubmitButton>
      <p className="text-xs leading-5 text-muted">The requester will see your profile and can reply through AI Final Touch.</p>
    </ActionForm>
  );
}

async function InterestList({ requestId }: { requestId: string }) {
  const rows = await listInterestsForRequest(requestId);
  return (
    <section className="mt-16 border-t border-line pt-10" aria-labelledby="interest-heading">
      <h2 id="interest-heading" className="text-xl font-semibold tracking-tight">
        Interested specialists {rows.length > 0 && <span className="text-muted">({rows.length})</span>}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No one yet. Specialists browsing Requests will see yours — you&apos;ll get an email when someone is interested.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line-soft border-y border-line-soft">
          {rows.map(({ interest, profile, skills, conversationId }) => (
            <li key={interest.id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:gap-8">
              <div>
                <p className="font-semibold">
                  <Link href={`/specialists/${profile.slug}`} className="hover:text-brand">
                    {profile.name}
                  </Link>{" "}
                  <span className="font-normal text-muted">· {profile.title}</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft">{profile.positioning}</p>
                <div className="mt-3">
                  <SkillTags skills={skills} limit={6} />
                </div>
                {interest.message && (
                  <blockquote className="mt-4 border-l-2 border-brand-soft pl-4 text-[15px] leading-7 whitespace-pre-line text-ink-soft">
                    {interest.message}
                  </blockquote>
                )}
                <p className="mt-3 text-xs text-muted">{formatDate(interest.createdAt)}</p>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Link href={`/specialists/${profile.slug}`} className="btn-secondary">
                  View profile
                </Link>
                {conversationId && (
                  <Link href={`/messages/${conversationId}`} className="btn-primary">
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
