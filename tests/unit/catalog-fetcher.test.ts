import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We test the shape-check and fetch logic by importing the module after
// mocking global fetch.

const VALID_ENTRY_WITH_URL = {
  slug: 'styleguide',
  catalogUrl: 'https://styleguide.ideaplaces.com/api/catalog',
  fallback: { name: 'Style Guide', url: 'https://styleguide.ideaplaces.com' },
};

const VALID_ENTRY_WITHOUT_URL = {
  slug: 'impactpulse',
  fallback: {
    name: 'Impact Pulse',
    url: 'https://impactpulse.catalyzeupdev.com',
    tagline: 'Measure program outcomes for nonprofits.',
    status: 'coming-soon',
  },
};

const CATALOG_RESPONSE = {
  $schema: 1,
  name: 'Style Guide',
  slug: 'styleguide',
  status: 'live',
  url: 'https://styleguide.ideaplaces.com',
  tagline: 'Describe your brand, get a complete design system.',
  description: 'Generate a full design system from a text prompt.',
  features: [],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('catalog fetcher', () => {
  let fetchAllCatalogs: typeof import('../../lib/catalog/fetcher').fetchAllCatalogs;

  beforeEach(async () => {
    vi.stubGlobal('fetch', vi.fn());
    // Re-import each time so the module picks up the fresh fetch mock
    const mod = await import('../../lib/catalog/fetcher');
    fetchAllCatalogs = mod.fetchAllCatalogs;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('accepts manifest entries with catalogUrl omitted', async () => {
    const manifest = [VALID_ENTRY_WITH_URL, VALID_ENTRY_WITHOUT_URL];

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/manifest')) {
        return jsonResponse(manifest);
      }
      if (url.includes('styleguide.ideaplaces.com/api/catalog')) {
        return jsonResponse(CATALOG_RESPONSE);
      }
      return jsonResponse({ error: 'not found' }, 404);
    });

    const catalogs = await fetchAllCatalogs();

    // Should return catalogs for both entries (not fall back to offline manifest)
    expect(catalogs).toHaveLength(2);
    expect(catalogs[0].slug).toBe('styleguide');
    expect(catalogs[0].name).toBe('Style Guide');
    // The entry without catalogUrl should use fallback data
    expect(catalogs[1].slug).toBe('impactpulse');
    expect(catalogs[1].name).toBe('Impact Pulse');
  });

  it('rejects manifest entries with non-string catalogUrl', async () => {
    const manifest = [{ slug: 'bad', catalogUrl: 123, fallback: { name: 'Bad', url: 'https://x.com' } }];

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockImplementation(async () => jsonResponse(manifest));

    // Should fall back to offline manifest (4 entries)
    const catalogs = await fetchAllCatalogs();
    expect(catalogs.length).toBe(4);
    expect(catalogs.map((c) => c.slug)).toContain('styleguide');
  });
});
