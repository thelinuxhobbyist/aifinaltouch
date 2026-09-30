import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { listSkills } from "@/lib/queries";
import { createRequest } from "../actions";
import { RequestForm } from "../request-form";

export const metadata: Metadata = { title: "Post a Request", robots: { index: false } };

export default async function NewRequestPage() {
  const user = await requireUserPage("/requests/new");
  const skills = await listSkills();

  return (
    <div className="container-narrow py-12">
      <PageHeader
        eyebrow="Post a Request"
        title="Tell us what AI made"
        description="Describe it the way you'd explain it to a friend. You don't need to know which kind of professional you need — the right specialists will recognise the problem."
      />
      {user.status !== "active" ? (
        <p className="mt-8 text-sm text-red-700">Your account is suspended, so you can&apos;t post Requests.</p>
      ) : (
        <RequestForm action={createRequest} skills={skills} />
      )}
    </div>
  );
}
