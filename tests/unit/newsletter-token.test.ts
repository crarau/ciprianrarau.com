import { describe, expect, it } from 'vitest';
import {
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from '../../lib/newsletter/token';
// The send script signs with its own copy (plain JS, no TS build step).
// This import keeps the two implementations provably in lockstep.
import { unsubscribeToken as scriptToken } from '../../scripts/newsletter/token.mjs';

const SECRET = 'test-secret';

describe('unsubscribe tokens', () => {
  it('round-trips list and email', () => {
    const token = signUnsubscribeToken('ciprianrarau', 'Reader@Example.com', SECRET);
    expect(verifyUnsubscribeToken(token, SECRET)).toEqual({
      list: 'ciprianrarau',
      email: 'reader@example.com',
    });
  });

  it('rejects a tampered token', () => {
    const token = signUnsubscribeToken('ideaplaces', 'a@b.com', SECRET);
    const [payload] = token.split('.');
    const forged = `${Buffer.from('ideaplaces\nother@b.com').toString('base64url')}.${token.split('.')[1]}`;
    expect(verifyUnsubscribeToken(forged, SECRET)).toBeNull();
    expect(verifyUnsubscribeToken(`${payload}.AAAA`, SECRET)).toBeNull();
  });

  it('rejects garbage and wrong secrets', () => {
    expect(verifyUnsubscribeToken('', SECRET)).toBeNull();
    expect(verifyUnsubscribeToken('not-a-token', SECRET)).toBeNull();
    const token = signUnsubscribeToken('ideaplaces', 'a@b.com', SECRET);
    expect(verifyUnsubscribeToken(token, 'other-secret')).toBeNull();
  });

  it('send script signs tokens the app verifies (implementations in lockstep)', () => {
    const fromScript = scriptToken('ideaplaces', ' Reader@Example.com ', SECRET);
    expect(fromScript).toBe(signUnsubscribeToken('ideaplaces', ' Reader@Example.com ', SECRET));
    expect(verifyUnsubscribeToken(fromScript, SECRET)).toEqual({
      list: 'ideaplaces',
      email: 'reader@example.com',
    });
  });
});
