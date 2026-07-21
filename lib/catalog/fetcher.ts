/**
 * Federated product catalog fetcher.
 *
 * Source of truth for "what products exist" lives on ideaplaces.com at
 * `/api/manifest`. This file used to mirror the full PRODUCT_MANIFEST inline
 * (with a comment begging future-me to keep both copies in sync); that was
 * a duplication-prone foot-gun. Now we fetch the manifest at build time
 * and fall back to a tiny hardcoded slug/url list only if ideaplaces.com is
 * unreachable AND it's a brand-new build with nothing in the Next cache.
 *
 * Add a product → edit `ideaplaces-website/src/lib/catalog.ts` once.
 */

import {
  Cta,
  Feature,
  ProductCatalog,
  ProductStatus,
  fallbackCatalog,
  parseCatalog,
} from './schema';

const MANIFEST_URL = 'https://ideaplaces.com/api/manifest';

export interface ProductManifestEntry {
  slug: string;
  catalogUrl?: string;
  fallback: {
    name: string;
    url: string;
    tagline?: string;
    status?: ProductStatus;
    description?: string;
    category?: string;
    features?: Feature[];
    cta?: Cta;
  };
}

// Last-resort fallback if BOTH ideaplaces.com is unreachable AND there's no
// build cache. Just slugs + names + URLs — enough to render a card stub.
// Real content (descriptions, features, status badges) comes from each
// product's /api/catalog, which the per-entry fallback in fetchCatalog
// handles independently.
const OFFLINE_FALLBACK_MANIFEST: ProductManifestEntry[] = [
  {
    slug: 'styleguide',
    catalogUrl: 'https://styleguide.ideaplaces.com/api/catalog',
    fallback: { name: 'Style Guide', url: 'https://styleguide.ideaplaces.com' },
  },
  {
    slug: 'c3',
    catalogUrl: 'https://c3.ideaplaces.com/api/catalog',
    fallback: { name: 'C3', url: 'https://c3.ideaplaces.com' },
  },
  {
    slug: 'monday2github',
    catalogUrl: 'https://monday2github.ideaplaces.com/api/catalog',
    fallback: { name: 'monday2github', url: 'https://monday2github.ideaplaces.com' },
  },
  {
    slug: 'digitizer',
    catalogUrl: 'https://digitizer.ideaplaces.com/api/catalog',
    fallback: { name: 'Digitizer', url: 'https://digitizer.ideaplaces.com' },
  },
];

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 },
      headers: { accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}

function isManifestEntry(v: unknown): v is ProductManifestEntry {
  if (!v || typeof v !== 'object') return false;
  const e = v as Record<string, unknown>;
  if (typeof e.slug !== 'string') return false;
  if (e.catalogUrl !== undefined && typeof e.catalogUrl !== 'string') return false;
  if (!e.fallback || typeof e.fallback !== 'object') return false;
  const fb = e.fallback as Record<string, unknown>;
  return typeof fb.name === 'string' && typeof fb.url === 'string';
}

async function fetchManifest(): Promise<ProductManifestEntry[]> {
  try {
    const res = await fetchWithTimeout(MANIFEST_URL);
    if (!res.ok) {
      console.warn(`[manifest] ${MANIFEST_URL} returned ${res.status}, using offline fallback`);
      return OFFLINE_FALLBACK_MANIFEST;
    }
    const json = await res.json();
    if (!Array.isArray(json) || !json.every(isManifestEntry)) {
      console.warn('[manifest] response failed shape check, using offline fallback');
      return OFFLINE_FALLBACK_MANIFEST;
    }
    return json;
  } catch (err) {
    console.warn('[manifest] fetch failed, using offline fallback:', (err as Error).message);
    return OFFLINE_FALLBACK_MANIFEST;
  }
}

async function fetchCatalogFromEntry(entry: ProductManifestEntry): Promise<ProductCatalog> {
  if (!entry.catalogUrl) {
    return fallbackCatalog({ slug: entry.slug, ...entry.fallback });
  }
  try {
    const res = await fetchWithTimeout(entry.catalogUrl);
    if (!res.ok) {
      console.warn(`[catalog] ${entry.catalogUrl} returned ${res.status}, using fallback`);
      return fallbackCatalog({ slug: entry.slug, ...entry.fallback });
    }
    const json = await res.json();
    const parsed = parseCatalog(json);
    if (!parsed) {
      console.warn(`[catalog] Invalid catalog from ${entry.catalogUrl}`);
      return fallbackCatalog({ slug: entry.slug, ...entry.fallback });
    }
    if (parsed.slug !== entry.slug) {
      console.warn(
        `[catalog] Slug mismatch from ${entry.catalogUrl}: got "${parsed.slug}", expected "${entry.slug}"`,
      );
      return { ...parsed, slug: entry.slug };
    }
    return parsed;
  } catch (err) {
    console.warn(`[catalog] Falling back for ${entry.slug}:`, (err as Error).message);
    return fallbackCatalog({ slug: entry.slug, ...entry.fallback });
  }
}

export async function fetchCatalog(slug: string): Promise<ProductCatalog> {
  const manifest = await fetchManifest();
  const entry = manifest.find((p) => p.slug === slug);
  if (!entry) {
    throw new Error(`Unknown product slug: ${slug}`);
  }
  return fetchCatalogFromEntry(entry);
}

export async function fetchAllCatalogs(): Promise<ProductCatalog[]> {
  const manifest = await fetchManifest();
  return Promise.all(manifest.map(fetchCatalogFromEntry));
}
