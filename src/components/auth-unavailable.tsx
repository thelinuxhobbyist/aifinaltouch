import Link from "next/link";

export function AuthUnavailable() {
  return (
    <div className="container-narrow py-24 text-center">
      <p className="eyebrow">Preview</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Accounts aren&apos;t open yet</h1>
      <p className="mt-3 text-muted">Signing in will be available soon. You can browse Requests and specialists in the meantime.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/requests" className="btn-primary">
          Browse Requests
        </Link>
        <Link href="/" className="btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
