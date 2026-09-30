import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ReportButton } from "@/components/report-button";
import { Avatar, SkillTags, StatusBadge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { excerpt } from "@/lib/format";
import { getProfileWithDetails, isProfilePublic } from "@/lib/queries";
import { fileUrl } from "@/lib/uploads";

const loadProfile = cache((slug: string) => getProfileWithDetails({ slug }));

export async function generateMetadata({ params }: PageProps<"/specialists/[slug]">): Promise<Metadata> {
  const profile = await loadProfile((await params).slug);
  if (!profile || !isProfilePublic(profile)) return { title: "Specialist not found", robots: { index: false } };
  return {
    title: `${profile.name} — ${profile.title}`,
    description: excerpt(profile.positioning, 160),
    alternates: { canonical: `/specialists/${profile.slug}` },
  };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function SpecialistPage({ params }: PageProps<"/specialists/[slug]">) {
  const { slug } = await params;
  const [profile, user] = await Promise.all([loadProfile(slug), getCurrentUser()]);
  if (!profile) notFound();

  const isOwner = user?.id === profile.userId;
  if (!isProfilePublic(profile) && !isOwner && !user?.isAdmin) notFound();

  const links = [
    profile.websiteUrl && { label: hostname(profile.websiteUrl), href: profile.websiteUrl },
    profile.linkedinUrl && { label: "LinkedIn", href: profile.linkedinUrl },
    profile.githubUrl && { label: "GitHub", href: profile.githubUrl },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <article className="container page">
      {!isProfilePublic(profile) && (
        <p className="alert alert--warning cluster mb-8">
          <StatusBadge status={profile.status} /> This profile is not publicly visible.
        </p>
      )}

      <header className="profile-head">
        <div className="profile-head__intro">
          <Avatar name={profile.name} size="lg" />
          <div className="min-w-0">
            <p className="eyebrow">{profile.title}</p>
            <h1 className="h1 mt-2">{profile.name}</h1>
            <p className="lead mt-4">{profile.positioning}</p>
            <div className="mt-5">
              <SkillTags skills={profile.skills} />
            </div>
          </div>
        </div>
        <div className="box stack">
          <dl className="meta">
            {profile.location && (
              <div>
                <dt>Based in</dt>
                <dd>{profile.location}</dd>
              </div>
            )}
            <div>
              <dt>Works</dt>
              <dd>Remotely, worldwide</dd>
            </div>
            {links.length > 0 && (
              <div>
                <dt>Links</dt>
                <dd className="stack stack--xs">
                  {links.map((l) => (
                    <a key={l.href} href={l.href} rel="nofollow noopener noreferrer" target="_blank" className="link">
                      {l.label} ↗
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
          {isOwner && (
            <Link href="/profile/edit" className="btn btn--secondary btn--block">
              Edit profile
            </Link>
          )}
        </div>
      </header>

      <div className="with-sidebar mt-10">
        <div className="stack stack--lg min-w-0">
          {profile.about && (
            <section>
              <h2 className="h3">About</h2>
              <p className="prose mt-3">{profile.about}</p>
            </section>
          )}
          {profile.helpsWith && (
            <section>
              <h2 className="h3">Can help with</h2>
              <p className="prose mt-3">{profile.helpsWith}</p>
            </section>
          )}

          <section>
            <h2 className="h3">Portfolio</h2>
            {profile.portfolio.length === 0 ? (
              <p className="small muted mt-3">No portfolio examples yet.</p>
            ) : (
              <ul className="grid grid--2 mt-5" role="list">
                {profile.portfolio.map((item) => (
                  <li key={item.id}>
                    {item.imageUploadId && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fileUrl(item.imageUploadId)} alt={item.title} loading="lazy" className="media" />
                    )}
                    <h3 className="h4 mt-3">{item.title}</h3>
                    {item.description && <p className="small soft mt-1">{item.description}</p>}
                    {item.url && (
                      <a href={item.url} rel="nofollow noopener noreferrer" target="_blank" className="link small mt-1 block">
                        {hostname(item.url)} ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="small muted">
          <p>
            Specialists get in touch by responding to Requests. If you have something AI built that needs finishing,{" "}
            <Link href="/requests/new" className="link">
              post a Request
            </Link>{" "}
            and relevant specialists can express interest.
          </p>
          {!isOwner && (
            <div className="mt-6">
              <ReportButton targetType="profile" targetId={profile.id} signedIn={!!user} label="Report this profile" />
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
