import { z } from "zod";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null));

/** Accepts bare domains ("example.com"), normalises to https and rejects non-web schemes. */
export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
    try {
      const u = new URL(candidate);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      if (!u.hostname.includes(".")) throw new Error();
      return u.toString();
    } catch {
      ctx.addIssue({ code: "custom", message: "Enter a valid web address." });
      return z.NEVER;
    }
  });

export const PROBLEM_TAGS = [
  "It looks generic",
  "It doesn't work properly",
  "Something is missing",
  "I want it to feel more professional",
  "The UX needs improving",
  "I don't know what's wrong",
  "I want an expert opinion",
  "I need someone to finish it",
] as const;

const skillIds = z
  .array(z.coerce.number().int().positive())
  .max(8, "Choose up to 8 skills.")
  .transform((ids) => Array.from(new Set(ids)));

export const requestSchema = z.object({
  title: trimmed(120).min(8, "Give your Request a short, descriptive title."),
  aiCreated: trimmed(3000).min(10, "Tell specialists what AI created."),
  likes: trimmed(3000).optional().default(""),
  notRight: trimmed(3000).min(10, "Describe what isn't right yet."),
  needs: trimmed(3000).min(10, "Describe the help you're looking for."),
  problemTags: z.array(z.enum(PROBLEM_TAGS)).max(PROBLEM_TAGS.length).default([]),
  skillIds,
  url: optionalUrl,
  budget: optionalText(80),
  location: optionalText(80),
  remotePreference: z.enum(["remote", "onsite", "either"]).default("either"),
});

export const profileSchema = z.object({
  name: trimmed(80).min(2, "Enter your name."),
  title: trimmed(80).min(2, "Enter your professional title."),
  positioning: trimmed(160).min(10, "Add a one-line positioning statement."),
  about: trimmed(4000).optional().default(""),
  helpsWith: trimmed(2000).optional().default(""),
  location: optionalText(80),
  workMode: z.enum(["remote", "onsite", "hybrid"]).default("remote"),
  websiteUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  skillIds: skillIds.refine((ids) => ids.length > 0, "Choose at least one skill."),
});

export const portfolioItemSchema = z.object({
  title: trimmed(100).min(2, "Give the example a title."),
  description: trimmed(1000).optional().default(""),
  url: optionalUrl,
});

export const interestSchema = z.object({
  message: trimmed(1000).optional().default(""),
});

export const messageSchema = z.object({
  body: trimmed(4000).min(1, "Write a message first."),
});

export const reportSchema = z.object({
  targetType: z.enum(["profile", "request", "message"]),
  targetId: z.string().uuid(),
  reason: trimmed(1000).min(5, "Tell us briefly what's wrong."),
});

export function formToObject(formData: FormData, arrays: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of arrays) out[key] = formData.getAll(key).filter((v) => typeof v === "string");
  for (const [key, value] of formData.entries()) {
    if (arrays.includes(key) || key.startsWith("$ACTION") || typeof value !== "string") continue;
    out[key] = value;
  }
  return out;
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
