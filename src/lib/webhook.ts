import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifies an interview-engine webhook — same scheme asparagus uses:
 * hex HMAC-SHA256 of the raw body in x-interview-signature, optional
 * x-interview-timestamp (seconds) checked against a 5-minute window.
 */
export function verifyEngineWebhook(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secret: string,
): { ok: true } | { ok: false; reason: string } {
  if (!signature) return { ok: false, reason: 'Missing signature' };

  if (timestamp) {
    const ts = parseInt(timestamp, 10);
    const ageSeconds = Math.floor(Date.now() / 1000) - ts;
    if (isNaN(ts) || ageSeconds > 300 || ageSeconds < -60) {
      return { ok: false, reason: 'Request expired' };
    }
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'Invalid signature' };
  }
  return { ok: true };
}
