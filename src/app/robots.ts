import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { appUrl, config } from "@/lib/cf";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  if (config("APP_ENV") !== "production") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/messages", "/profile", "/api", "/files", "/sign-in", "/sign-up", "/requests/new"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
