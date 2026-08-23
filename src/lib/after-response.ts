/**
 * Run work that must outlive the response.
 *
 * On a VPS a floating promise keeps running after the handler returns. On
 * Cloudflare Workers it does not: once the response is sent the request context
 * is cancelled and any unawaited promise dies with it — which silently dropped
 * the Google Sheets sync and would have dropped booking emails too. waitUntil()
 * asks the runtime to keep the isolate alive until the promise settles.
 *
 * Off-Workers this degrades to the previous fire-and-forget behaviour.
 */
export function runAfterResponse(work: Promise<unknown>): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext()?.ctx;
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(work);
      return;
    }
  } catch {
    // Not running on Workers.
  }
  void work;
}
