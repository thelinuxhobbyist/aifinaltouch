import Link from "next/link";
import { Avatar, CheckIcon } from "@/components/ui";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";

const WE_DO = [
  "Help you describe what's not quite right",
  "Show it to people who finish AI-built work",
  "Introduce you to the ones who want to help",
];

const YOU_DO = [
  "Choose who you want to talk to",
  "Agree the scope, timing and price",
  "Pay them directly — we take nothing",
];

const STEPS = [
  ["Tell us what you built", "What AI made, and what isn't right yet. Plain language is perfect."],
  ["Someone who can help gets in touch", "Specialists who finish AI-built work read it and say they'd like to help."],
  ["Talk, then arrange it directly", "Chat here to get to know each other. The work itself is between the two of you."],
];

const SYMPTOMS = [
  "It looks like every other AI template",
  "It's confusing on mobile",
  "A feature is half-finished",
  "It breaks and I don't know why",
  "It isn't ready for real customers",
  "Something just feels off",
];

function IntroductionPreview() {
  return (
    <div className="intro" aria-hidden>
      <div className="intro__card">
        <div className="cluster cluster--tight">
          <Avatar name="You" size="sm" />
          <span className="small strong">Your booking website</span>
        </div>
        <div className="split-figures">
          <div>
            <p className="split-figures__num">90%</p>
            <p className="xsmall muted">Built with AI</p>
          </div>
          <div className="split-figures__human">
            <p className="split-figures__num">10%</p>
            <p className="xsmall">Needs a human</p>
          </div>
        </div>
        <div className="ratio ratio--lg">
          <div className="ratio__human" />
        </div>
      </div>

      <div className="intro__link">
        <span className="pill">Introduced by AI Final Touch</span>
      </div>

      <div className="intro__card">
        <div className="cluster cluster--tight">
          <Avatar name="Maya Chen" size="sm" />
          <span className="small">
            <span className="strong">Maya</span> <span className="muted">· Product designer</span>
          </span>
        </div>
        <div className="stack stack--xs mt-4">
          <div className="msg">
            <div className="bubble bubble--theirs small">I&apos;ve polished a few AI-built sites like this. Happy to take a look.</div>
          </div>
          <div className="msg msg--mine">
            <div className="bubble bubble--mine small">Great — can we talk this week?</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  await track("homepage_visit", { userId: user?.id });

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div>
            <h1 className="display">
              AI got you 90% there. Find the <em>human</em> for the other 10%.
            </h1>
            <p className="lead mt-6">
              Built something with AI but stuck on the last part? Tell us what you built and what&apos;s not quite right,
              and connect with someone who can help finish it.
            </p>
            <p className="promise mt-6">
              <span className="promise__dot" aria-hidden />
              We make the introduction. You arrange the work directly.
            </p>
            <div className="cluster hero__actions">
              <Link href="/requests/new" className="btn btn--primary btn--lg">
                Tell us what you built
              </Link>
              <Link href="/profile/edit" className="btn btn--ghost btn--lg">
                I finish AI-built work →
              </Link>
            </div>
            <ul className="hero__proof" role="list">
              {["Free", "No bidding", "No commission"].map((p) => (
                <li key={p}>
                  <CheckIcon />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <IntroductionPreview />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-intro">
            <h2 className="h2">
              We make the introduction. <em>You</em> arrange the work directly.
            </h2>
            <p className="body muted mt-4">
              This isn&apos;t a freelance marketplace. We don&apos;t manage projects, set prices or sit in the middle. We
              just help the right two people find each other.
            </p>
          </div>
          <div className="handoff mt-12">
            <div className="handoff__side">
              <p className="label-caps">What we do</p>
              <ul className="checklist mt-4">
                {WE_DO.map((t) => (
                  <li key={t}>
                    <CheckIcon />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="handoff__side handoff__side--you">
              <p className="label-caps">What you do, directly</p>
              <ul className="checklist mt-4">
                {YOU_DO.map((t) => (
                  <li key={t}>
                    <CheckIcon />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <h2 className="h2">
            Three steps. <em>That&apos;s it.</em>
          </h2>
          <ol className="steps">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="step">
                <span className="step__num">{i + 1}</span>
                <h3 className="h3 step__title">{title}</h3>
                <p className="step__text">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <h2 className="h2">
              You don&apos;t need to know <em>who</em> you need.
            </h2>
            <p className="body muted mt-4">
              Designer, developer, UX, something else? Don&apos;t worry about it. Describe what&apos;s wrong in your own
              words and the right person will recognise it.
            </p>
            <Link href="/requests/new" className="btn btn--primary mt-8">
              Describe what&apos;s not right
            </Link>
          </div>
          <div>
            <p className="label-caps">Sound familiar?</p>
            <ul className="symptoms mt-4" role="list">
              {SYMPTOMS.map((s) => (
                <li key={s} className="symptom">
                  “{s}”
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="cta-band">
          <div className="cta-band__col">
            <h2 className="h3">Stuck on the last 10%?</h2>
            <p className="cta-band__text">It takes a few minutes, it&apos;s free, and you decide who you talk to.</p>
            <Link href="/requests/new" className="btn btn--inverse">
              Tell us what you built
            </Link>
          </div>
          <div className="cta-band__col">
            <h2 className="h3">Good at the last 10%?</h2>
            <p className="cta-band__text">Create a profile and get introduced to people whose AI-built work needs you.</p>
            <Link href="/profile/edit" className="btn btn--outline-inverse">
              Become a specialist
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
