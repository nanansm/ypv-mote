import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  // Native/Node-only packages must stay out of the bundler. @libsql/client is
  // required lazily by src/db/index.ts for local dev; without this Turbopack
  // tries to bundle the package's own README and every route 500s.
  serverExternalPackages: ["@libsql/client", "nodemailer"],
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
