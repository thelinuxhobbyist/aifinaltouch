import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-narrow py-24 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-muted">It may have been removed, or you may not have access to it.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/requests" className="btn-secondary">
          Browse Requests
        </Link>
      </div>
    </div>
  );
}
