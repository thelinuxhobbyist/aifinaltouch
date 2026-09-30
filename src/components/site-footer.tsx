import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line-soft bg-mist">
      <div className="container-page flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm leading-6 text-muted">
            An introduction platform for AI-built websites and apps. We help you find the right person. The work, price
            and agreement stay between you.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-14 gap-y-2 text-sm text-ink-soft">
          <Link href="/requests/new" className="hover:text-ink">Post a Request</Link>
          <Link href="/requests" className="hover:text-ink">Browse Requests</Link>
          <Link href="/specialists" className="hover:text-ink">Find a Specialist</Link>
          <Link href="/profile/edit" className="hover:text-ink">Become a Specialist</Link>
        </div>
      </div>
      <div className="container-page border-t border-line pb-8 pt-6 text-xs text-muted">
        © {new Date().getFullYear()} AI Final Touch
      </div>
    </footer>
  );
}
