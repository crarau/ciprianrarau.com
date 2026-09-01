/**
 * Token signer for the send script. MUST produce byte-identical tokens to
 * lib/newsletter/token.ts (the app verifies what this signs); the unit test
 * newsletter-token.test.ts asserts the two stay in lockstep.
 */

import crypto from 'node:crypto';

export function unsubscribeToken(list, email, secret) {
  const payload = Buffer.from(`${list}\n${email.trim().toLowerCase()}`, 'utf8');
  const mac = crypto.createHmac('sha256', secret).update(payload).digest();
  return `${payload.toString('base64url')}.${mac.toString('base64url')}`;
}
