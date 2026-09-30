import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/filter-bar";
import { RequestList } from "@/components/request-list";
import { EmptyState, PageHeader, Pagination } from "@/components/ui";
import { listPublishedRequests, listSkills, PAGE_SIZE } from "@/lib/queries";
import { pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Browse Requests",
  description: "AI-built websites and apps that need a professional to improve, review or finish them.",
};

export default async function RequestsPage({ searchParams }: PageProps<"/requests">) {
  const sp = await searchParams;
  const filters = { q: param(sp.q), skill: param(sp.skill), remote: param(sp.remote) };
  const [result, skills] = await Promise.all([listPublishedRequests({ ...filters, page: pageParam(sp.page) }), listSkills()]);
  const filtered = Boolean(filters.q || filters.skill || filters.remote);

  return (
    <div className="container-page py-12">
      <PageHeader
        eyebrow="Requests"
        title="AI-built work that needs a human"
        description="Websites and apps people have built with AI and want a professional to improve, review or finish. Open one and click “I’m interested” if you can help."
        actions={
          <Link href="/requests/new" className="btn-primary">
            Post a Request
          </Link>
        }
      />

      <FilterBar
        action="/requests"
        q={filters.q}
        skill={filters.skill}
        location={filters.remote}
        locationName="remote"
        locationOptions={[
          { value: "", label: "Remote or on-site" },
          { value: "remote", label: "Remote OK" },
          { value: "onsite", label: "On-site OK" },
        ]}
        skills={skills}
        placeholder="Search Requests"
      />

      {result.rows.length === 0 ? (
        filtered ? (
          <EmptyState title="No Requests match those filters">Try a broader search or clear the filters.</EmptyState>
        ) : (
          <EmptyState
            title="No open Requests right now"
            action={
              <Link href="/requests/new" className="btn-primary">
                Post the first Request
              </Link>
            }
          >
            Built something with AI that isn&apos;t quite right? Describe it and specialists who can finish it will get in touch.
          </EmptyState>
        )
      ) : (
        <RequestList requests={result.rows} />
      )}

      <Pagination
        page={result.page}
        total={result.total}
        pageSize={PAGE_SIZE}
        basePath="/requests"
        params={{ q: filters.q, skill: filters.skill, remote: filters.remote }}
      />
    </div>
  );
}
