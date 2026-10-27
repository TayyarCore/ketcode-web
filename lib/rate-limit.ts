type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 1_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  if (buckets.size > 5_000) buckets.delete(buckets.keys().next().value as string);

  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

export function requestIdentity(request: Request, sessionId: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = (forwardedFor || request.headers.get("x-real-ip") || "unknown").slice(0, 64);
  return `${ip}:${sessionId}`;
}
