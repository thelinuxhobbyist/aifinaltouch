import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/filter-bar";
import { RequestList } from "@/components/request-list";
import { EmptyState, PageHeader, Pagination } from "@/components/ui";
import { listPublishedRequests, listSkills, PAGE_SIZE } from "@/lib/queries";
import { pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Browse Requests",
  description: "AI-built websites and apps that need a human to help finish them.",
};

export default async function RequestsPage({ searchParams }: PageProps<"/requests">) {
  const sp = await searchParams;
  const filters = { q: param(sp.q), skill: param(sp.skill) };
  const [result, skills] = await Promise.all([listPublishedRequests({ ...filters, page: pageParam(sp.page) }), listSkills()]);
  const filtered = Boolean(filters.q || filters.skill);

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Requests"
        title={
          <>
            Built with AI. <em>Almost</em> there.
          </>
        }
        description="People who have made something with AI and need a human for the last part. If you can help, open one and say hello."
        actions={
          <Link href="/requests/new" className="btn btn--primary">
            Tell us what you built
          </Link>
        }
      />

      <FilterBar action="/requests" q={filters.q} skill={filters.skill} skills={skills} placeholder="Search Requests" />

      {result.total > 0 && (
        <p className="small muted mb-6">
          {result.total} {filtered ? "matching" : "open"} Request{result.total === 1 ? "" : "s"}
        </p>
      )}

      {result.rows.length === 0 ? (
        filtered ? (
          <EmptyState title="No Requests match those filters">Try a broader search or clear the filters.</EmptyState>
        ) : (
          <EmptyState
            title="No open Requests right now"
            action={
              <Link href="/requests/new" className="btn btn--primary">
                Tell us what you built
              </Link>
            }
          >
            Built something with AI that isn&apos;t quite right? Describe it and someone who can finish it will get in touch.
          </EmptyState>
        )
      ) : (
        <RequestList requests={result.rows} />
      )}

      <Pagination page={result.page} total={result.total} pageSize={PAGE_SIZE} basePath="/requests" params={filters} />
    </div>
  );
}
