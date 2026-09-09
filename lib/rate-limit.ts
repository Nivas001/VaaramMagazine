import "server-only";

/**
 * A small in-memory rate limiter for the two public write endpoints.
 *
 * Deliberately not Redis. The site's write surface is one contact form and one
 * subscribe box, and the honeypot already turns away the bulk of automated
 * submissions — a per-instance counter stops the rest without adding a service
 * the client would have to pay for and keep alive.
 *
 * What that costs, stated plainly: a serverless deployment runs several
 * instances, so the effective allowance is the limit multiplied by however many
 * are warm, and the map is emptied whenever an instance is recycled. That is
 * the right trade for abuse control on a form; it is not the right trade for
 * anything security-critical, and nothing security-critical uses it.
 */
type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

/** Stops the map growing without bound on a long-lived instance. */
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((hit.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * The caller's address as the proxy in front of us reports it.
 *
 * `x-forwarded-for` is client-controlled when nothing trusted sets it, so this
 * is a bucketing key and never an identity — it is not logged and not stored.
 */
export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
