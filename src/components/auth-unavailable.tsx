import Link from "next/link";

export function AuthUnavailable() {
  return (
    <div className="container container--narrow page center">
      <div className="stack stack--sm">
        <p className="eyebrow">Preview</p>
        <h1 className="h1">Accounts aren&apos;t open yet</h1>
        <p className="lead lead--center">
          Signing in will be available soon. You can browse Requests and specialists in the meantime.
        </p>
      </div>
      <div className="cluster cluster--center mt-8">
        <Link href="/requests" className="btn btn--primary">
          Browse Requests
        </Link>
        <Link href="/" className="btn btn--secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
