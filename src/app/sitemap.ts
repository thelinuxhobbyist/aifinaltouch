import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { requests, specialistProfiles, users } from "@/db/schema";
import { appUrl, getDb } from "@/lib/cf";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = appUrl();
  const db = getDb();
  const [reqs, profiles] = await Promise.all([
    db
      .select({ slug: requests.slug, updatedAt: requests.updatedAt })
      .from(requests)
      .where(eq(requests.status, "published"))
      .orderBy(desc(requests.publishedAt))
      .limit(5000),
    db
      .select({ slug: specialistProfiles.slug, updatedAt: specialistProfiles.updatedAt })
      .from(specialistProfiles)
      .innerJoin(users, eq(users.id, specialistProfiles.userId))
      .where(and(eq(specialistProfiles.status, "published"), eq(users.status, "active")))
      .limit(5000),
  ]);

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/requests`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/specialists`, changeFrequency: "daily", priority: 0.8 },
    ...reqs.map((r) => ({ url: `${base}/requests/${r.slug}`, lastModified: r.updatedAt, priority: 0.6 })),
    ...profiles.map((p) => ({ url: `${base}/specialists/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
  ];
}
