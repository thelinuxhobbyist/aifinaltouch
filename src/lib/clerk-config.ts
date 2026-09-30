// Inlined at build time. Without a publishable key the site runs signed-out only,
// so it can be previewed before Clerk is configured.
export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
