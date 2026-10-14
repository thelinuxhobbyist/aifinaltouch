import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";

const STEPS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Tell us what you built",
    body: "Describe what AI made and what isn't right yet. Plain language is fine.",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: "A specialist gets in touch",
    body: "People who finish AI-built work read your request and say they'd like to help.",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: "Talk, then agree the work",
    body: "Chat here to get to know each other. The work itself is between the two of you.",
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </>
    ),
  },
];

const SYMPTOMS = [
  "It looks like every other AI template",
  "It's confusing on mobile",
  "A feature is half-finished",
  "It breaks and I don't know why",
  "It isn't ready for real customers",
  "Something just feels off",
];

const WE_DO = [
  "Help you describe what's not quite right",
  "Show it to people who finish AI-built work",
  "Introduce you to the ones who want to help",
];

const YOU_DO = [
  "Choose who you want to talk to",
  "Agree the scope, timing and price",
  "Pay them directly. We take nothing",
];

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  await track("homepage_visit", { userId: user?.id });

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1 className="display">
            AI built most of it.
            <br />
            A person can finish it.
          </h1>
          <p className="hero__lead">
            Made a website or app with AI and stuck on the last part? Tell us what&apos;s not quite right and we&apos;ll
            introduce you to someone who can fix it.
          </p>
          <p className="hero__sub">We make the introduction. You arrange the work directly.</p>
          <div className="cta">
            <Link href="/requests/new" className="btn btn--primary">
              Tell us what you built
            </Link>
            <Link href="#specialists" className="btn btn--ghost">
              I finish AI-built work
            </Link>
          </div>
          <p className="hero__note">Free to use. No bidding. No commission.</p>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container center">
          <h2 className="h2">Three steps, then it&apos;s yours</h2>
          <ol className="home-steps">
            {STEPS.map((step) => (
              <li key={step.title} className="home-step">
                <div className="home-step__icon">
                  <Glyph>{step.icon}</Glyph>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container center">
          <h2 className="h2">You don&apos;t need to know who you need</h2>
          <p className="home-intro">
            Designer, developer, something else? Describe the problem in your own words and the right person will
            recognise it.
          </p>
          <ul className="pills" role="list">
            {SYMPTOMS.map((symptom) => (
              <li key={symptom} className="pill">
                {symptom}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container center">
          <h2 className="h2">An introduction, not a marketplace</h2>
          <p className="home-intro">We don&apos;t manage projects, set prices or sit in the middle.</p>
          <div className="home-compare">
            <div className="home-card home-card--off">
              <h3>What we do</h3>
              <ul className="ticks">
                {WE_DO.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="home-card home-card--on">
              <h3>What you do, directly</h3>
              <ul className="ticks">
                {YOU_DO.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--final" id="specialists">
        <div className="container center">
          <h2 className="h2">Ready to get it finished?</h2>
          <p className="home-intro">It takes a few minutes, it&apos;s free, and you decide who you talk to.</p>
          <div className="home-split">
            <div className="home-card">
              <div className="home-card__icon">
                <Glyph>
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </Glyph>
              </div>
              <h3>Stuck on the last part?</h3>
              <p className="home-card__text">Tell us what you built and what needs a human.</p>
              <Link href="/requests/new" className="btn btn--primary">
                Tell us what you built
              </Link>
            </div>
            <div className="home-card">
              <div className="home-card__icon">
                <Glyph>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="m16 11 2 2 4-4" />
                </Glyph>
              </div>
              <h3>Good at finishing AI-built work?</h3>
              <p className="home-card__text">Create a profile and get introduced to people who need you.</p>
              <Link href="/profile/edit" className="btn btn--ghost">
                Become a specialist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
