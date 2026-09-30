import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, FormSuccess, SelectField, SubmitButton, TextArea, TextField } from "@/components/forms";
import { SkillPicker } from "@/components/skill-picker";
import { PageHeader, StatusBadge } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { getProfileWithDetails, listSkills } from "@/lib/queries";
import { saveProfile } from "../actions";
import { PortfolioManager } from "./portfolio-manager";

export const metadata: Metadata = { title: "Your specialist profile", robots: { index: false } };

export default async function EditProfilePage({ searchParams }: PageProps<"/profile/edit">) {
  const user = await requireUserPage("/profile/edit");
  const [profile, skills, sp] = await Promise.all([getProfileWithDetails({ userId: user.id }), listSkills(), searchParams]);
  const justCreated = sp.created === "1";

  return (
    <div className="container-narrow py-12">
      <PageHeader
        eyebrow="Specialist profile"
        title={profile ? "Edit your profile" : "Create your specialist profile"}
        description={
          profile ? (
            <span className="flex flex-wrap items-center gap-3">
              <StatusBadge status={profile.status} />
              {profile.status === "published" && (
                <Link href={`/specialists/${profile.slug}`} className="link">
                  View public profile →
                </Link>
              )}
            </span>
          ) : (
            "Show requesters you can turn an AI-built website or app into a finished product. Proof matters more than claims."
          )
        }
      />

      {justCreated && (
        <p role="status" className="mt-8 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your profile has been created. Add a few portfolio examples below — they are what requesters look at first.
        </p>
      )}

      {profile?.status === "removed" && (
        <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This profile was removed by a moderator and is not publicly visible.
        </p>
      )}

      <ActionForm action={saveProfile} className="mt-10 space-y-7">
        <div className="grid gap-7 sm:grid-cols-2">
          <TextField name="name" label="Name" defaultValue={profile?.name ?? user.displayName} maxLength={80} />
          <TextField
            name="title"
            label="Professional title"
            placeholder="Product designer"
            defaultValue={profile?.title}
            maxLength={80}
          />
        </div>
        <TextField
          name="positioning"
          label="Positioning statement"
          hint="One line that tells requesters what you do."
          placeholder="I turn AI-generated websites and apps into polished products."
          defaultValue={profile?.positioning}
          maxLength={160}
        />
        <TextArea
          name="about"
          label="About"
          optional
          rows={6}
          hint="Your background, the kind of teams you've worked with, how you like to work."
          defaultValue={profile?.about}
          maxLength={4000}
        />
        <TextArea
          name="helpsWith"
          label="What you can help with"
          optional
          rows={4}
          placeholder="Redesigning AI-generated landing pages, fixing UX in Lovable or v0 prototypes, making Claude-built apps production-ready…"
          defaultValue={profile?.helpsWith}
          maxLength={2000}
        />

        <SkillPicker skills={skills} selected={profile?.skills.map((s) => s.id)} label="Skills" hint="Choose up to 8." />

        <div className="grid gap-7 sm:grid-cols-2">
          <TextField name="location" label="Location" optional placeholder="London, UK" defaultValue={profile?.location} maxLength={80} />
          <SelectField
            name="workMode"
            label="Availability"
            defaultValue={profile?.workMode ?? "remote"}
            options={[
              { value: "remote", label: "Remote" },
              { value: "hybrid", label: "Remote or on-site" },
              { value: "onsite", label: "On-site only" },
            ]}
          />
        </div>

        <fieldset className="space-y-5">
          <legend className="label">Links</legend>
          <TextField name="websiteUrl" label="Website or portfolio" optional defaultValue={profile?.websiteUrl} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="linkedinUrl" label="LinkedIn" optional defaultValue={profile?.linkedinUrl} />
            <TextField name="githubUrl" label="GitHub" optional defaultValue={profile?.githubUrl} />
          </div>
        </fieldset>

        {profile?.status !== "removed" && (
          <fieldset>
            <legend className="label">Visibility</legend>
            <div className="mt-3 space-y-2 text-sm text-ink-soft">
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="visibility"
                  value="published"
                  defaultChecked={!profile || profile.status === "published"}
                  className="mt-1 accent-brand"
                />
                <span>
                  <span className="font-medium text-ink">Public</span> — listed in the specialist directory and able to respond to
                  Requests.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="visibility"
                  value="hidden"
                  defaultChecked={profile ? profile.status !== "published" : false}
                  className="mt-1 accent-brand"
                />
                <span>
                  <span className="font-medium text-ink">Hidden</span> — only you can see it.
                </span>
              </label>
            </div>
          </fieldset>
        )}

        <div className="flex items-center gap-4 border-t border-line-soft pt-6">
          <SubmitButton>{profile ? "Save profile" : "Create profile"}</SubmitButton>
          <FormSuccess />
        </div>
      </ActionForm>

      {profile && <PortfolioManager profile={profile} />}
    </div>
  );
}
