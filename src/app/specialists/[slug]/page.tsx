import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ReportButton } from "@/components/report-button";
import { Avatar, SkillTags, StatusBadge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { excerpt, firstName } from "@/lib/format";
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

function lines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-•*·]\s*/, "").trim())
    .filter(Boolean);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="detail-section">
      <h2 className="label-caps detail-section__title">{title}</h2>
      {children}
    </section>
  );
}

export default async function SpecialistPage({ params }: PageProps<"/specialists/[slug]">) {
  const { slug } = await params;
  const [profile, user] = await Promise.all([loadProfile(slug), getCurrentUser()]);
  if (!profile) notFound();

  const isOwner = user?.id === profile.userId;
  if (!isProfilePublic(profile) && !isOwner && !user?.isAdmin) notFound();

  const first = firstName(profile.name);
  const helpsWith = profile.helpsWith ? lines(profile.helpsWith) : [];
  const links = [
    profile.websiteUrl && { label: hostname(profile.websiteUrl), href: profile.websiteUrl },
    profile.linkedinUrl && { label: "LinkedIn", href: profile.linkedinUrl },
    profile.githubUrl && { label: "GitHub", href: profile.githubUrl },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <article className="container page">
      {!isProfilePublic(profile) && (
        <p className="alert alert--warning cluster mb-6">
          <StatusBadge status={profile.status} /> This profile is not publicly visible.
        </p>
      )}

      <div className="with-sidebar">
        <div className="min-w-0">
          <header>
            <div className="profile-id">
              <Avatar name={profile.name} size="lg" />
              <div className="min-w-0">
                <h1 className="h1">{profile.name}</h1>
                <p className="profile-id__title">{profile.title}</p>
              </div>
            </div>
            <p className="lead mt-6">{profile.positioning}</p>
            {profile.skills.length > 0 && (
              <div className="mt-5">
                <SkillTags skills={profile.skills} />
              </div>
            )}
            <ul className="profile-facts mt-5" role="list">
              {profile.location && <li>{profile.location}</li>}
              <li>Works remotely, worldwide</li>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} rel="nofollow noopener noreferrer" target="_blank" className="link">
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </header>

          <div className="stack mt-8">
            {helpsWith.length > 0 && (
              <Section title={`How ${first} can help`}>
                {helpsWith.length > 1 ? (
                  <ul className="bullets">
                    {helpsWith.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="body soft">{helpsWith[0]}</p>
                )}
              </Section>
            )}

            {profile.about && (
              <Section title="Background & approach">
                <p className="prose">{profile.about}</p>
              </Section>
            )}

            {profile.portfolio.length > 0 && (
              <Section title="Selected work">
                <ul className="grid grid--2 mt-2" role="list">
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
              </Section>
            )}
          </div>
        </div>

        <aside className="sticky stack stack--sm">
          {isOwner ? (
            <div className="box stack stack--sm">
              <p className="strong small">This is your profile</p>
              {profile.portfolio.length === 0 && (
                <p className="small muted">
                  Requesters look at examples first. Your work will appear here once you add a portfolio item.
                </p>
              )}
              <Link href="/profile/edit" className="btn btn--secondary btn--block">
                Edit profile
              </Link>
            </div>
          ) : (
            <>
              <div className="box stack stack--sm">
                <h2 className="h4">Work with {first}</h2>
                <p className="small soft">
                  Describe what your AI-built site or app still needs. Specialists like {first} respond to Requests that match
                  their skills.
                </p>
                <Link href="/requests/new" className="btn btn--primary btn--block">
                  Post a Request
                </Link>
              </div>
              <ReportButton targetType="profile" targetId={profile.id} signedIn={!!user} label="Report this profile" />
            </>
          )}
        </aside>
      </div>
    </article>
  );
}
