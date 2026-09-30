import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { getRequestBySlug, listSkills } from "@/lib/queries";
import { deleteAttachment, updateRequest } from "../../actions";
import { RequestForm } from "../../request-form";

export const metadata: Metadata = { title: "Edit Request", robots: { index: false } };

export default async function EditRequestPage({ params }: PageProps<"/requests/[slug]/edit">) {
  const { slug } = await params;
  const user = await requireUserPage(`/requests/${slug}/edit`);
  const [request, skills] = await Promise.all([getRequestBySlug(slug), listSkills()]);
  if (!request || request.userId !== user.id || request.status === "removed") notFound();

  return (
    <div className="container-narrow py-12">
      <PageHeader
        eyebrow="Edit Request"
        title={request.title}
        actions={
          <Link href={`/requests/${request.slug}`} className="btn-secondary">
            View Request
          </Link>
        }
      />

      {request.attachments.length > 0 && (
        <section className="mt-10">
          <h2 className="label">Current attachments</h2>
          <ul className="mt-3 divide-y divide-line-soft border-y border-line-soft">
            {request.attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="min-w-0 truncate">
                  {a.originalName}
                  <span className="ml-2 text-muted">{a.visibility === "private" ? "Interested specialists only" : "Public"}</span>
                </span>
                <form action={deleteAttachment}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="uploadId" value={a.id} />
                  <button type="submit" className="text-red-700 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RequestForm action={updateRequest} skills={skills} request={request} />
    </div>
  );
}
