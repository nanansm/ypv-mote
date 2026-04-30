import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": ["./src/db/seed.ts", "./drizzle/migrations/**/*"],
    "/api/admin/settings/test-smtp": ["./node_modules/nodemailer/**/*"],
    "/api/submit": ["./node_modules/nodemailer/**/*"],
    "/api/screen": ["./node_modules/nodemailer/**/*"],
    "/api/admin/submissions/*/send-zoom": ["./node_modules/nodemailer/**/*"],
    "/api/admin/submissions/*/resend": ["./node_modules/nodemailer/**/*"],
  },
};

export default withNextIntl(nextConfig);
