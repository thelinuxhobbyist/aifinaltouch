import "server-only";
import { unstable_rethrow } from "next/navigation";
import { AuthError } from "@/lib/auth";
import { RateLimitError } from "@/lib/rate-limit";
import { UploadError } from "@/lib/uploads";
import type { ActionState } from "@/lib/validation";

export class UserFacingError extends Error {}

/** Converts expected failures into form state; unexpected errors are logged and hidden. */
export async function runAction(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    if (
      err instanceof AuthError ||
      err instanceof RateLimitError ||
      err instanceof UploadError ||
      err instanceof UserFacingError
    ) {
      return { error: err.message };
    }
    console.error(err);
    return { error: "Something went wrong. Please try again." };
  }
}
