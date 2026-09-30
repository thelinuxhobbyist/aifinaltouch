import { ActionForm, FieldError, FormSuccess, SubmitButton, TextArea, TextField } from "@/components/forms";
import type { ProfileWithDetails } from "@/lib/queries";
import { fileUrl } from "@/lib/uploads";
import { addPortfolioItem, deletePortfolioItem } from "../actions";

export function PortfolioManager({ profile }: { profile: ProfileWithDetails }) {
  return (
    <section className="divider-top mt-16" aria-labelledby="portfolio-heading">
      <h2 id="portfolio-heading" className="h2">
        Portfolio
      </h2>
      <p className="small muted mt-2">
        Show work you&apos;ve finished — ideally things that started life as AI output. A screenshot and a sentence of
        context is enough.
      </p>

      {profile.portfolio.length > 0 && (
        <ul className="rows mt-6">
          {profile.portfolio.map((item) => (
            <li key={item.id} className="convo">
              {item.imageUploadId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(item.imageUploadId)} alt="" className="thumb" />
              ) : (
                <div className="thumb" />
              )}
              <div className="convo__main">
                <p className="truncate small strong">{item.title}</p>
                {item.url && <p className="truncate xsmall muted">{item.url}</p>}
              </div>
              <form action={deletePortfolioItem}>
                <input type="hidden" name="itemId" value={item.id} />
                <button type="submit" className="text-btn text-btn--danger">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <ActionForm action={addPortfolioItem} resetOnSuccess className="panel stack mt-8">
        <p className="h4">Add an example</p>
        <TextField name="title" label="Title" placeholder="Booking site for a physiotherapy clinic" maxLength={100} />
        <TextArea
          name="description"
          label="What did you do?"
          optional
          rows={3}
          placeholder="Started from a Claude-generated site. Rebuilt the visual design, tightened the booking flow and fixed mobile layout."
          maxLength={1000}
        />
        <TextField name="url" label="Link" optional placeholder="https://" />
        <div className="field">
          <label htmlFor="image" className="label">
            Image <span className="label__opt">(JPEG, PNG, WebP or GIF, up to 5 MB)</span>
          </label>
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="file" />
          <FieldError name="image" />
        </div>
        <div className="cluster">
          <SubmitButton pendingLabel="Uploading…">Add example</SubmitButton>
          <FormSuccess />
        </div>
      </ActionForm>
    </section>
  );
}
