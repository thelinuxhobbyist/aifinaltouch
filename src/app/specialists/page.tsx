import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/filter-bar";
import { EmptyState, PageHeader, Pagination, SkillTags } from "@/components/ui";
import { WORK_MODE_LABEL } from "@/lib/format";
import { listPublishedProfiles, listSkills, PAGE_SIZE } from "@/lib/queries";
import { pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Find a specialist",
  description: "Designers, developers and other professionals who finish AI-built websites and apps.",
};

export default async function SpecialistsPage({ searchParams }: PageProps<"/specialists">) {
  const sp = await searchParams;
  const filters = { q: param(sp.q), skill: param(sp.skill), workMode: param(sp.work) };
  const [result, skills] = await Promise.all([listPublishedProfiles({ ...filters, page: pageParam(sp.page) }), listSkills()]);
  const filtered = Boolean(filters.q || filters.skill || filters.workMode);

  return (
    <div className="container-page py-12">
      <PageHeader
        eyebrow="Specialists"
        title="Find someone to finish it"
        description="Professionals who improve, review and finish AI-built websites and apps. Post a Request and the right people can come to you."
        actions={
          <Link href="/requests/new" className="btn-primary">
            Post a Request
          </Link>
        }
      />

      <FilterBar
        action="/specialists"
        q={filters.q}
        skill={filters.skill}
        location={filters.workMode}
        locationName="work"
        locationOptions={[
          { value: "", label: "Any location" },
          { value: "remote", label: "Works remotely" },
          { value: "onsite", label: "Works on-site" },
        ]}
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
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/requests/new" className="btn-primary">
                  Post a Request
                </Link>
                <Link href="/profile/edit" className="btn-secondary">
                  Create a specialist profile
                </Link>
              </div>
            }
          >
            Post what AI built for you and specialists will find it — or, if you finish AI-built work yourself, create your
            profile.
          </EmptyState>
        )
      ) : (
        <ul className="divide-y divide-line-soft border-t border-line-soft">
          {result.rows.map((p) => (
            <li key={p.id}>
              <Link href={`/specialists/${p.slug}`} className="group grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:gap-8">
                <div>
                  <p className="text-base font-semibold group-hover:text-brand">
                    {p.name} <span className="font-normal text-muted">· {p.title}</span>
                  </p>
                  <p className="mt-1 max-w-2xl text-[15px] leading-6 text-ink-soft">{p.positioning}</p>
                  <div className="mt-3">
                    <SkillTags skills={p.skills} limit={5} />
                  </div>
                </div>
                <p className="text-sm text-muted sm:text-right">
                  {WORK_MODE_LABEL[p.workMode]}
                  {p.location && <span className="block">{p.location}</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={result.page}
        total={result.total}
        pageSize={PAGE_SIZE}
        basePath="/specialists"
        params={{ q: filters.q, skill: filters.skill, work: filters.workMode }}
      />
    </div>
  );
}
