/**
 * Discord ping for the private #subscribers channel. Fired only for a
 * genuinely new (or returning) subscriber, never for a repeat signup of an
 * already-active address. Best effort by design: a Discord outage must
 * never fail a subscription, so every error is swallowed after a log line.
 */

export async function notifyNewSubscriber(
  list: string,
  email: string,
  source: string,
): Promise<void> {
  const webhook = process.env.NEWSLETTER_DISCORD_WEBHOOK;
  if (!webhook) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `New subscriber: **${email}** on the ${list} list (via ${source})`,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    console.warn('[newsletter] Discord notify failed:', (err as Error).message);
  } finally {
    clearTimeout(timer);
  }
}
