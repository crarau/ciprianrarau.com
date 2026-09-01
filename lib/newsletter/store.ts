/**
 * The subscriber list, owned by us, in Azure Table Storage.
 *
 * One `subscribers` table, partitioned by list: `ciprianrarau` (this site)
 * and `ideaplaces` (ideaplaces.com signs its readers up into the same
 * table through its own /api/subscribe). RowKey is the lowercased email,
 * so a repeat signup is an idempotent upsert, and unsubscribing flips
 * `status` rather than deleting the row: the row doubles as a suppression
 * record so a later re-import can never resurrect someone who opted out.
 *
 * Without NEWSLETTER_STORAGE_CONNECTION_STRING (local dev, CI, tests) every
 * operation logs and succeeds, same pattern as TourCockpit's magic-link
 * email: the app stays fully usable with no cloud dependency.
 */

import { TableClient } from '@azure/data-tables';

export const LISTS = ['ciprianrarau', 'ideaplaces'] as const;
export type ListName = (typeof LISTS)[number];

export const SUBSCRIBERS_TABLE = 'subscribers';

export function subscribersClient(): TableClient | null {
  const conn = process.env.NEWSLETTER_STORAGE_CONNECTION_STRING;
  if (!conn) return null;
  return TableClient.fromConnectionString(conn, SUBSCRIBERS_TABLE);
}

export async function addSubscriber(
  list: ListName,
  email: string,
  source: string,
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const table = subscribersClient();
  if (!table) {
    console.log(
      `[newsletter] (no storage configured) would subscribe ${normalized} to ${list} (${source})`,
    );
    return;
  }
  await table.upsertEntity(
    {
      partitionKey: list,
      rowKey: normalized,
      email: normalized,
      status: 'active',
      source,
      subscribedAt: new Date().toISOString(),
    },
    'Merge',
  );
}

export async function markUnsubscribed(
  list: string,
  email: string,
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const table = subscribersClient();
  if (!table) {
    console.log(
      `[newsletter] (no storage configured) would unsubscribe ${normalized} from ${list}`,
    );
    return;
  }
  await table.upsertEntity(
    {
      partitionKey: list,
      rowKey: normalized,
      email: normalized,
      status: 'unsubscribed',
      unsubscribedAt: new Date().toISOString(),
    },
    'Merge',
  );
}
