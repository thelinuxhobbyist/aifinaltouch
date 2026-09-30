import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export function cfEnv(): CloudflareEnv {
  return getCloudflareContext().env;
}

export function getDb() {
  return drizzle(cfEnv().DB, { schema });
}

export type Db = ReturnType<typeof getDb>;

type ConfigKey = "APP_ENV" | "APP_URL" | "RESEND_API_KEY" | "EMAIL_FROM" | "ADMIN_EMAILS";

export function config(key: ConfigKey): string | undefined {
  const fromBinding = (cfEnv() as unknown as Record<string, unknown>)[key];
  if (typeof fromBinding === "string" && fromBinding.length > 0) return fromBinding;
  const fromProcess = process.env[key];
  return fromProcess && fromProcess.length > 0 ? fromProcess : undefined;
}

export function appUrl(): string {
  return (config("APP_URL") ?? "http://localhost:3000").replace(/\/$/, "");
}
