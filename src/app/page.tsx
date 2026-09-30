import Link from "next/link";
import { RequestList } from "@/components/request-list";
import { SkillTags } from "@/components/ui";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { homepageContent } from "@/lib/queries";

const MISSING = [
  { title: "Design", body: "It works, but it looks like every other AI template." },
  { title: "UX", body: "The flows are confusing, or fall apart on mobile." },
  { title: "Functionality", body: "Something important is missing or half-finished." },
  { title: "Polish", body: "Details, copy and consistency that make it feel real." },
  { title: "Technical expertise", body: "Security, performance and getting it production-ready." },
  { title: "Professional judgement", body: "Someone to tell you what's actually wrong." },
];

const EXAMPLES = [
  "An AI-generated website that looks generic",
  "An AI-built app with poor UX",
  "A prototype that needs finishing",
  "AI-generated code that needs a professional review",
  "An AI-built product that needs to be production-ready",
];

export default async function HomePage() {
  const [user, content] = await Promise.all([getCurrentUser(), homepageContent()]);
  await track("homepage_visit", { userId: user?.id });

  return (
    <>
      <section className="relative overflow-hidden border-b border-line-soft bg-gradient-to-b from-sky via-mist to-white">
        <div className="container-page py-20 sm:py-28">
          <p className="eyebrow">For AI-built websites and apps</p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-6xl">
            AI got you 90% there. Find the human for the other 10%.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
            Post what you built with AI and what isn&apos;t right yet. Designers, developers and other professionals who
            finish AI-generated work can find it, get in touch and help you get it done.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/requests/new" className="btn-primary px-6 py-3 text-[15px]">
              Post a Request
            </Link>
            <Link href="/specialists" className="btn-secondary px-6 py-3 text-[15px]">
              Find a Specialist
            </Link>
          </div>

          <div className="mt-16 max-w-xl" aria-hidden>
            <div className="flex h-2 overflow-hidden rounded-full bg-white">
              <div className="w-[90%] bg-brand-soft" />
              <div className="w-[10%] bg-brand" />
            </div>
            <div className="mt-2 flex justify-between text-xs font-medium text-muted">
              <span>Made with AI</span>
              <span className="text-brand">Finished by a human</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[360px_1fr] lg:gap-20">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">AI can create the first version.</h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Sometimes the last part needs a person who does this for a living. You don&apos;t need to know which kind of
              professional — just describe what&apos;s not right.
            </p>
          </div>
          <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {MISSING.map((m) => (
              <div key={m.title} className="border-t border-line pt-4">
                <dt className="font-semibold">{m.title}</dt>
                <dd className="mt-1 text-[15px] leading-6 text-muted">{m.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-y border-line-soft bg-mist">
        <div className="container-page py-20 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {[
              ["Post what AI created", "Tell people what you made, what you like about it and what isn't right."],
              ["Find someone who can finish it", "Specialists browse Requests and say they're interested. You see their profile and work."],
              ["Chat and arrange the work", "Talk it through on AI Final Touch, then agree the work, price and payment between you."],
            ].map(([title, body], i) => (
              <li key={title}>
                <span className="text-sm font-semibold text-brand">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">Starting with one thing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Websites and apps built with AI</h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Whether it came from Claude, ChatGPT, Lovable, v0, Bolt or Cursor — if it&apos;s a website or app that needs a
              professional finish, it belongs here.
            </p>
          </div>
          <ul className="space-y-0 divide-y divide-line-soft border-y border-line-soft">
            {EXAMPLES.map((e) => (
              <li key={e} className="flex items-center gap-3 py-4 text-[15px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {e}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {content.requests.length > 0 && (
        <section className="container-page pb-20">
          <div className="flex items-baseline justify-between gap-4 pb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Recent Requests</h2>
            <Link href="/requests" className="link text-sm">
              Browse all
            </Link>
          </div>
          <RequestList requests={content.requests} />
        </section>
      )}

      {content.specialists.length > 0 && (
        <section className="container-page pb-20">
          <div className="flex items-baseline justify-between gap-4 pb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Specialists</h2>
            <Link href="/specialists" className="link text-sm">
              See all
            </Link>
          </div>
          <ul className="grid gap-x-12 gap-y-8 border-t border-line-soft pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {content.specialists.map((p) => (
              <li key={p.id}>
                <Link href={`/specialists/${p.slug}`} className="group block">
                  <p className="font-semibold group-hover:text-brand">{p.name}</p>
                  <p className="text-sm text-muted">{p.title}</p>
                  <p className="mt-2 text-[15px] leading-6 text-ink-soft">{p.positioning}</p>
                </Link>
                <div className="mt-3">
                  <SkillTags skills={p.skills} limit={3} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-page">
        <div className="grid gap-10 rounded-lg bg-gradient-to-br from-brand to-brand-dark px-8 py-14 text-white sm:px-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Built something with AI?</h2>
            <p className="mt-3 leading-7 text-blue-100">
              Describe it in plain language. It takes a few minutes and it&apos;s free.
            </p>
            <Link href="/requests/new" className="btn mt-6 bg-white text-brand-dark hover:bg-sky">
              Post a Request
            </Link>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Finish AI-built work?</h2>
            <p className="mt-3 leading-7 text-blue-100">
              Create a profile, show your work and respond to Requests that fit your skills.
            </p>
            <Link href="/profile/edit" className="btn mt-6 border border-white/40 text-white hover:bg-white/10">
              Become a Specialist
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
