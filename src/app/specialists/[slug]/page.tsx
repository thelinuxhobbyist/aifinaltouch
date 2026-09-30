import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ReportButton } from "@/components/report-button";
import { SkillTags, StatusBadge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { excerpt, WORK_MODE_LABEL } from "@/lib/format";
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
    <article className="container-page py-12">
      {!isProfilePublic(profile) && (
        <p className="mb-8 flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <StatusBadge status={profile.status} /> This profile is not publicly visible.
        </p>
      )}

      <header className="grid gap-8 border-b border-line-soft pb-10 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="eyebrow">{profile.title}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{profile.name}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{profile.positioning}</p>
          <div className="mt-5">
            <SkillTags skills={profile.skills} />
          </div>
        </div>
        <dl className="space-y-4 text-sm lg:border-l lg:border-line-soft lg:pl-8">
          <div>
            <dt className="text-muted">Availability</dt>
            <dd className="mt-0.5 font-medium">{WORK_MODE_LABEL[profile.workMode]}</dd>
          </div>
          {profile.location && (
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="mt-0.5 font-medium">{profile.location}</dd>
            </div>
          )}
          {links.length > 0 && (
            <div>
              <dt className="text-muted">Links</dt>
              <dd className="mt-1 space-y-1">
                {links.map((l) => (
                  <a key={l.href} href={l.href} rel="nofollow noopener noreferrer" target="_blank" className="link block">
                    {l.label}
                  </a>
                ))}
              </dd>
            </div>
          )}
          {isOwner && (
            <Link href="/profile/edit" className="btn-secondary w-full">
              Edit profile
            </Link>
          )}
        </dl>
      </header>

      <div className="grid gap-12 py-10 lg:grid-cols-[1fr_280px]">
        <div className="space-y-10">
          {profile.about && (
            <section>
              <h2 className="text-lg font-semibold">About</h2>
              <p className="prose-text mt-3">{profile.about}</p>
            </section>
          )}
          {profile.helpsWith && (
            <section>
              <h2 className="text-lg font-semibold">Can help with</h2>
              <p className="prose-text mt-3">{profile.helpsWith}</p>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold">Portfolio</h2>
            {profile.portfolio.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No portfolio examples yet.</p>
            ) : (
              <ul className="mt-5 grid gap-8 sm:grid-cols-2">
                {profile.portfolio.map((item) => (
                  <li key={item.id}>
                    {item.imageUploadId && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fileUrl(item.imageUploadId)}
                        alt={item.title}
                        loading="lazy"
                        className="aspect-[16/10] w-full rounded-md border border-line object-cover object-top"
                      />
                    )}
                    <h3 className="mt-3 text-[15px] font-semibold">{item.title}</h3>
                    {item.description && <p className="mt-1 text-sm leading-6 text-ink-soft">{item.description}</p>}
                    {item.url && (
                      <a href={item.url} rel="nofollow noopener noreferrer" target="_blank" className="link mt-1 inline-block text-sm">
                        {hostname(item.url)} ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="text-sm leading-6 text-muted">
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
