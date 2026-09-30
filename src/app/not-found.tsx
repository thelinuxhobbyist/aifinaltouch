import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container container--narrow page center">
      <div className="stack stack--sm">
        <p className="eyebrow">Not found</p>
        <h1 className="h1">We couldn&apos;t find that page</h1>
        <p className="muted">It may have been removed, or you may not have access to it.</p>
      </div>
      <div className="cluster cluster--center mt-8">
        <Link href="/" className="btn btn--primary">
          Go home
        </Link>
        <Link href="/requests" className="btn btn--secondary">
          Browse Requests
        </Link>
      </div>
    </div>
  );
}
