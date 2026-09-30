import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// All pages are rendered per request from D1, so no incremental cache is configured.
export default defineCloudflareConfig({});
