import { ActionForm, FieldError, FormSuccess, SelectField, SubmitButton, TextArea, TextField } from "@/components/forms";
import { SkillPicker } from "@/components/skill-picker";
import type { Skill } from "@/db/schema";
import type { RequestWithDetails } from "@/lib/queries";
import { PROBLEM_TAGS, type ActionState } from "@/lib/validation";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-line-soft pt-8 sm:grid-cols-[180px_1fr] sm:gap-10">
      <h2 className="text-sm font-semibold text-ink">
        <span className="mr-2 text-brand">{n}.</span>
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export function RequestForm({
  action,
  skills,
  request,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  skills: Skill[];
  request?: RequestWithDetails;
}) {
  const tags = new Set(request?.problemTags ?? []);
  const isEdit = Boolean(request);

  return (
    <ActionForm action={action} className="mt-10 space-y-10">
      {request && <input type="hidden" name="requestId" value={request.id} />}

      <Step n={1} title="What AI made">
        <TextField
          name="title"
          label="Give it a title"
          placeholder="Make my AI-generated website look professional"
          defaultValue={request?.title}
          maxLength={120}
        />
        <TextArea
          name="aiCreated"
          label="What did AI create?"
          hint="Which tool you used and what it built. Plain language is perfect."
          placeholder="A website for my physiotherapy clinic, built with Claude. The booking system and basic pages work."
          defaultValue={request?.aiCreated}
          maxLength={3000}
        />
        <TextArea
          name="likes"
          label="What do you like about it?"
          optional
          rows={3}
          placeholder="The functionality works well and the structure is mostly right."
          defaultValue={request?.likes}
          maxLength={3000}
        />
      </Step>

      <Step n={2} title="What isn't right">
        <fieldset>
          <legend className="label">
            Which of these sound familiar? <span className="font-normal text-muted">(optional)</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROBLEM_TAGS.map((tag) => (
              <label
                key={tag}
                className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-sm text-ink-soft has-[:checked]:border-brand has-[:checked]:bg-sky has-[:checked]:text-brand-dark has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
              >
                <input type="checkbox" name="problemTags" value={tag} defaultChecked={tags.has(tag)} className="sr-only" />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>
        <TextArea
          name="notRight"
          label="What isn't right?"
          placeholder="The design feels generic and looks like an AI template. On mobile the booking form is hard to use."
          defaultValue={request?.notRight}
          maxLength={3000}
        />
        <TextArea
          name="needs"
          label="What do you need?"
          placeholder="Someone to improve the visual design and UX without rebuilding the underlying functionality."
          defaultValue={request?.needs}
          maxLength={3000}
        />
      </Step>

      <Step n={3} title="Helpful details">
        <TextField
          name="url"
          label="Link to what AI made"
          optional
          placeholder="https://"
          hint="A live site, preview link or repository."
          defaultValue={request?.url}
        />
        <SkillPicker
          skills={skills}
          selected={request?.skills.map((s) => s.id)}
          label="Relevant skills (optional)"
          hint="Not sure? Leave this blank — specialists will read your description."
        />
        <div className="grid gap-6 sm:grid-cols-3">
          <TextField name="budget" label="Budget" optional placeholder="e.g. £500–£1,000" defaultValue={request?.budget} maxLength={80} />
          <TextField name="location" label="Location" optional placeholder="e.g. Manchester, UK" defaultValue={request?.location} maxLength={80} />
          <SelectField
            name="remotePreference"
            label="Working arrangement"
            defaultValue={request?.remotePreference ?? "either"}
            options={[
              { value: "either", label: "Remote or on-site" },
              { value: "remote", label: "Remote" },
              { value: "onsite", label: "On-site" },
            ]}
          />
        </div>
        <div>
          <label htmlFor="attachments" className="label">
            Screenshots or files <span className="font-normal text-muted">(optional — images or PDF, up to 5)</span>
          </label>
          <input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="mt-2 block w-full text-sm text-ink-soft file:mr-4 file:rounded-md file:border-0 file:bg-sky file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-dark hover:file:bg-brand-soft"
          />
          <FieldError name="attachments" />
          <div className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <label className="flex items-center gap-2">
              <input type="radio" name="attachmentVisibility" value="public" defaultChecked className="accent-brand" />
              Anyone viewing the Request can see new files
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="attachmentVisibility" value="private" className="accent-brand" />
              Only specialists who express interest can see new files
            </label>
          </div>
        </div>
      </Step>

      <div className="flex flex-col-reverse gap-3 border-t border-line-soft pt-8 sm:flex-row sm:items-center sm:justify-end">
        <FormSuccess />
        {isEdit ? (
          <SubmitButton>Save changes</SubmitButton>
        ) : (
          <>
            <SubmitButton variant="secondary" name="intent" value="draft">
              Save as draft
            </SubmitButton>
            <SubmitButton name="intent" value="publish" pendingLabel="Publishing…">
              Publish Request
            </SubmitButton>
          </>
        )}
      </div>
    </ActionForm>
  );
}
