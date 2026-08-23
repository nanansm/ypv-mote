import type { Fetcher } from "@cloudflare/workers-types";

/**
 * The ypv-mailer service binding, or null when running outside Workers.
 * Guarded the same way as the D1 lookup in src/db/index.ts: importing
 * @opennextjs/cloudflare off-Workers throws.
 */
export function getMailerBinding(): Fetcher | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const env = getCloudflareContext()?.env as { MAILER?: Fetcher } | undefined;
    return env?.MAILER ?? null;
  } catch {
    return null;
  }
}
