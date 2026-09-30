import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/filter-bar";
import { Avatar, EmptyState, PageHeader, Pagination, SkillTags } from "@/components/ui";
import { listPublishedProfiles, listSkills, PAGE_SIZE } from "@/lib/queries";
import { pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Find a specialist",
  description: "Designers, developers and other professionals who finish AI-built websites and apps.",
};

export default async function SpecialistsPage({ searchParams }: PageProps<"/specialists">) {
  const sp = await searchParams;
  const filters = { q: param(sp.q), skill: param(sp.skill) };
  const [result, skills] = await Promise.all([listPublishedProfiles({ ...filters, page: pageParam(sp.page) }), listSkills()]);
  const filtered = Boolean(filters.q || filters.skill);

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Specialists"
        title={
          <>
            Find someone to <em>finish</em> it
          </>
        }
        description="Professionals who improve, review and finish AI-built websites and apps. Post a Request and the right people can come to you."
        actions={
          <Link href="/requests/new" className="btn btn--primary">
            Post a Request
          </Link>
        }
      />

      <FilterBar
        action="/specialists"
        q={filters.q}
        skill={filters.skill}
        skills={skills}
        placeholder="Search by name, skill or keyword"
      />

      {result.rows.length === 0 ? (
        filtered ? (
          <EmptyState title="No specialists match those filters">Try a broader search or clear the filters.</EmptyState>
        ) : (
          <EmptyState
            title="Specialists are joining now"
            action={
              <>
                <Link href="/requests/new" className="btn btn--primary">
                  Post a Request
                </Link>
                <Link href="/profile/edit" className="btn btn--secondary">
                  Create a specialist profile
                </Link>
              </>
            }
          >
            Post what AI built for you and specialists will find it — or, if you finish AI-built work yourself, create your
            profile.
          </EmptyState>
        )
      ) : (
        <ul className="rows">
          {result.rows.map((p) => (
            <li key={p.id}>
              <Link href={`/specialists/${p.slug}`} className="row-link">
                <div className="person-row person-row--flush">
                  <Avatar name={p.name} />
                  <div className="min-w-0">
                    <p className="row-link__title">
                      {p.name} <span className="muted">· {p.title}</span>
                    </p>
                    <p className="row-link__body">{p.positioning}</p>
                    <div className="mt-3">
                      <SkillTags skills={p.skills} limit={5} />
                    </div>
                  </div>
                </div>
                {p.location && <p className="row-link__meta">{p.location}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={result.page} total={result.total} pageSize={PAGE_SIZE} basePath="/specialists" params={filters} />
    </div>
  );
}
