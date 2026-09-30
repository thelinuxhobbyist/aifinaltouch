import { ActionForm, FieldError, FormSuccess, SubmitButton, TextArea, TextField } from "@/components/forms";
import { SkillPicker } from "@/components/skill-picker";
import type { Skill } from "@/db/schema";
import type { RequestWithDetails } from "@/lib/queries";
import { PROBLEM_TAGS, type ActionState } from "@/lib/validation";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="form-section">
      <h2 className="form-section__title">
        <span className="form-section__num">{n}</span>
        {title}
      </h2>
      <div className="stack">{children}</div>
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
    <ActionForm action={action} className="form mt-10">
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
        <fieldset className="field">
          <legend className="label">
            Which of these sound familiar? <span className="label__opt">(optional)</span>
          </legend>
          <div className="chips mt-2">
            {PROBLEM_TAGS.map((tag) => (
              <label key={tag} className="chip">
                <input type="checkbox" name="problemTags" value={tag} defaultChecked={tags.has(tag)} />
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
        <div className="grid grid--2">
          <TextField name="budget" label="Budget" optional placeholder="e.g. £500–£1,000" defaultValue={request?.budget} maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="attachments" className="label">
            Screenshots or files <span className="label__opt">(optional — images or PDF, up to 5)</span>
          </label>
          <input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="file"
          />
          <FieldError name="attachments" />
          <div className="stack stack--xs mt-2">
            <label className="choice">
              <input type="radio" name="attachmentVisibility" value="public" defaultChecked />
              Anyone viewing the Request can see new files
            </label>
            <label className="choice">
              <input type="radio" name="attachmentVisibility" value="private" />
              Only specialists who express interest can see new files
            </label>
          </div>
        </div>
      </Step>

      <div className="form-actions">
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
