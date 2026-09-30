import { ActionForm, FieldError, FormSuccess, SubmitButton, TextArea, TextField } from "@/components/forms";
import type { ProfileWithDetails } from "@/lib/queries";
import { fileUrl } from "@/lib/uploads";
import { addPortfolioItem, deletePortfolioItem } from "../actions";

export function PortfolioManager({ profile }: { profile: ProfileWithDetails }) {
  return (
    <section className="mt-16 border-t border-line pt-10" aria-labelledby="portfolio-heading">
      <h2 id="portfolio-heading" className="text-xl font-semibold tracking-tight">
        Portfolio
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Show work you&apos;ve finished — ideally things that started life as AI output. A screenshot and a sentence of
        context is enough.
      </p>

      {profile.portfolio.length > 0 && (
        <ul className="mt-6 divide-y divide-line-soft border-y border-line-soft">
          {profile.portfolio.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              {item.imageUploadId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(item.imageUploadId)} alt="" className="h-14 w-20 shrink-0 rounded border border-line object-cover" />
              ) : (
                <div className="h-14 w-20 shrink-0 rounded border border-line bg-mist" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                {item.url && <p className="truncate text-xs text-muted">{item.url}</p>}
              </div>
              <form action={deletePortfolioItem}>
                <input type="hidden" name="itemId" value={item.id} />
                <button type="submit" className="text-sm text-red-700 hover:underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <ActionForm action={addPortfolioItem} resetOnSuccess className="mt-8 space-y-5 rounded-md bg-mist p-5 sm:p-6">
        <p className="text-sm font-semibold">Add an example</p>
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
        <div>
          <label htmlFor="image" className="label">
            Image <span className="font-normal text-muted">(JPEG, PNG, WebP or GIF, up to 5 MB)</span>
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-2 block w-full text-sm text-ink-soft file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-sky"
          />
          <FieldError name="image" />
        </div>
        <div className="flex items-center gap-4">
          <SubmitButton pendingLabel="Uploading…">Add example</SubmitButton>
          <FormSuccess />
        </div>
      </ActionForm>
    </section>
  );
}
