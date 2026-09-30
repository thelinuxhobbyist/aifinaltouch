interface CloudflareEnv {
  DB: D1Database;
  UPLOADS: R2Bucket;
  APP_ENV: "development" | "production";
  APP_URL: string;
  CLERK_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_EMAILS?: string;
}
