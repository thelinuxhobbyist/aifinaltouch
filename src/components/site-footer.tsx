import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__row">
          <p className="site-footer__copy">© {new Date().getFullYear()} AI Final Touch · Made with AI, finished by humans.</p>
          <ul className="site-footer__links">
            <li>
              <Link href="/requests/new">Post a request</Link>
            </li>
            <li>
              <Link href="/requests">Browse requests</Link>
            </li>
            <li>
              <Link href="/specialists">Find a specialist</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
