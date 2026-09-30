import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <Logo />
            <p className="site-footer__about">
              An introduction platform for AI-built websites and apps. We help you find the right person — the work,
              price and agreement stay between you.
            </p>
          </div>
          <div>
            <p className="label-caps site-footer__title">Have something AI built?</p>
            <ul role="list" className="site-footer__links">
              <li><Link href="/requests/new">Post a Request</Link></li>
              <li><Link href="/specialists">Find a Specialist</Link></li>
            </ul>
          </div>
          <div>
            <p className="label-caps site-footer__title">Finish AI-built work?</p>
            <ul role="list" className="site-footer__links">
              <li><Link href="/requests">Browse Requests</Link></li>
              <li><Link href="/profile/edit">Become a Specialist</Link></li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} AI Final Touch</span>
          <span>Made with AI. Finished by humans.</span>
        </div>
      </div>
    </footer>
  );
}
