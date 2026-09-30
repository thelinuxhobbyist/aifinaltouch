import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, FormSuccess, SubmitButton, TextArea, TextField } from "@/components/forms";
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
    <div className="container container--narrow page">
      <PageHeader
        eyebrow="Specialist profile"
        title={profile ? "Edit your profile" : "Create your specialist profile"}
        description={
          profile ? (
            <span className="cluster">
              <StatusBadge status={profile.status} />
              {profile.status === "published" && (
                <Link href={`/specialists/${profile.slug}`} className="link small">
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
        <p role="status" className="alert alert--success mt-8">
          Your profile has been created. Add a few portfolio examples below — they are what requesters look at first.
        </p>
      )}

      {profile?.status === "removed" && (
        <p className="alert alert--error mt-8">This profile was removed by a moderator and is not publicly visible.</p>
      )}

      <ActionForm action={saveProfile} className="form mt-10">
        <div className="grid grid--2">
          <TextField name="name" label="Name" defaultValue={profile?.name ?? user.displayName} maxLength={80} />
          <TextField name="title" label="Professional title" placeholder="Product designer" defaultValue={profile?.title} maxLength={80} />
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
          label="Background & approach"
          optional
          rows={6}
          hint="Your experience, the kinds of teams and products you've worked on, and how you like to work. Keep the list of services for the next field."
          defaultValue={profile?.about}
          maxLength={4000}
        />
        <TextArea
          name="helpsWith"
          label="How you can help"
          optional
          rows={4}
          hint="Specific jobs you take on, one per line. Shown as a list on your profile."
          placeholder={
            "Redesigning AI-generated landing pages\nFixing UX in Lovable or v0 prototypes\nMaking Claude-built apps production-ready"
          }
          defaultValue={profile?.helpsWith}
          maxLength={2000}
        />

        <SkillPicker skills={skills} selected={profile?.skills.map((s) => s.id)} label="Skills" hint="Choose up to 8." />

        <div className="grid grid--2">
          <TextField
            name="location"
            label="Based in"
            optional
            hint="Shown on your profile. All work happens remotely."
            placeholder="London, UK"
            defaultValue={profile?.location}
            maxLength={80}
          />
        </div>

        <fieldset className="stack">
          <legend className="label mb-6">Links</legend>
          <TextField name="websiteUrl" label="Website or portfolio" optional defaultValue={profile?.websiteUrl} />
          <div className="grid grid--2">
            <TextField name="linkedinUrl" label="LinkedIn" optional defaultValue={profile?.linkedinUrl} />
            <TextField name="githubUrl" label="GitHub" optional defaultValue={profile?.githubUrl} />
          </div>
        </fieldset>

        {profile?.status !== "removed" && (
          <fieldset className="field">
            <legend className="label">Visibility</legend>
            <div className="stack stack--xs mt-2">
              <label className="choice">
                <input type="radio" name="visibility" value="published" defaultChecked={!profile || profile.status === "published"} />
                <span>
                  <span className="strong">Public</span> — listed in the specialist directory and able to respond to Requests.
                </span>
              </label>
              <label className="choice">
                <input type="radio" name="visibility" value="hidden" defaultChecked={profile ? profile.status !== "published" : false} />
                <span>
                  <span className="strong">Hidden</span> — only you can see it.
                </span>
              </label>
            </div>
          </fieldset>
        )}

        <div className="form-actions form-actions--start">
          <SubmitButton>{profile ? "Save profile" : "Create profile"}</SubmitButton>
          <FormSuccess />
        </div>
      </ActionForm>

      {profile && <PortfolioManager profile={profile} />}
    </div>
  );
}
