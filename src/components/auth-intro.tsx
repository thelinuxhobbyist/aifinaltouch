import Link from "next/link";

const POST_REQUEST_PATH = "/requests/new";

export function isPostRequestRedirect(redirectUrl: string | undefined) {
  return redirectUrl === POST_REQUEST_PATH;
}

/** Replaces Clerk's generic "Sign in to …" header when the visitor came from "Post a Request". */
export function PostRequestAuthIntro({ mode }: { mode: "sign-in" | "sign-up" }) {
  const query = `?redirect_url=${encodeURIComponent(POST_REQUEST_PATH)}`;

  return (
    <div className="auth-intro center stack stack--sm">
      <p className="eyebrow">Post a Request</p>
      <h1 className="h2">Sign in or sign up to post your request</h1>
      <p className="muted">
        Posting is free. You need an account so specialists can reply to you and you can manage your request.
      </p>
      <p className="small">
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <Link href={`/sign-up${query}`} className="link">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/sign-in${query}`} className="link">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

export const hiddenClerkHeader = { elements: { header: { display: "none" } } };
