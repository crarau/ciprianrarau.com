import { ArrowUpRight } from 'lucide-react';
import type { ProductCatalog, ProductStatus } from '@/lib/catalog/schema';

const STATUS_LABEL: Record<ProductStatus, string> = {
  live: 'Live',
  beta: 'Beta',
  'coming-soon': 'Coming Soon',
  archived: 'Archived',
};

const STATUS_BG: Record<ProductStatus, string> = {
  live: 'bg-primary text-primary-foreground',
  beta: 'bg-accent text-accent-foreground',
  'coming-soon': 'bg-clay-300 text-foreground',
  archived: 'bg-clay-200 text-foreground-muted',
};

function formatPricingSummary(catalog: ProductCatalog): string | null {
  if (!catalog.pricing || catalog.pricing.tiers.length === 0) return null;
  const { currency, tiers } = catalog.pricing;
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'CA$';
  const parts = tiers.slice(0, 3).map((tier) => {
    if (tier.price === 0) return `${tier.name} $0`;
    const periodSuffix =
      tier.period === 'month' ? '/mo' : tier.period === 'year' ? '/yr' : '';
    return `${tier.name} ${symbol}${tier.price}${periodSuffix}`;
  });
  return parts.join(' · ');
}

export function CatalogProductCard({ catalog }: { catalog: ProductCatalog }) {
  const pricingSummary = formatPricingSummary(catalog);

  return (
    <a
      href={catalog.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col p-6 bg-surface border border-border-light rounded-xl transition-all hover:border-primary hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 text-[10px] uppercase tracking-widest font-mono font-semibold rounded ${STATUS_BG[catalog.status]}`}
        >
          {STATUS_LABEL[catalog.status]}
        </span>
        <ArrowUpRight
          size={18}
          className="text-foreground-muted group-hover:text-primary transition-colors"
          strokeWidth={2}
        />
      </div>

      <h3 className="font-heading font-bold tracking-tight text-xl mb-1.5">
        {catalog.name}
      </h3>
      <div className="text-sm font-medium text-secondary mb-4">
        {catalog.tagline}
      </div>

      <div className="mt-auto pt-4 border-t border-border-light flex items-center justify-between text-xs">
        <span className="text-foreground-muted">
          {pricingSummary ?? 'Free'}
        </span>
        <span className="font-semibold text-primary group-hover:text-primary-dark">
          Visit →
        </span>
      </div>
    </a>
  );
}
