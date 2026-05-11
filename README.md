# RSC SSR Performance Benchmark

Comprehensive benchmark suite comparing React Server Components (RSC) performance across different frameworks and approaches.

## Project Structure

```
rsc-benchmark/
├── shared/                      # Framework-agnostic shared code
│   ├── types/index.ts           # TypeScript types (900+ lines)
│   ├── db/schema.sql            # PostgreSQL schema (40+ tables)
│   ├── seed/generator.ts        # Deterministic seed data (1K products, 500 users)
│   └── services/payment.ts      # Mock Stripe-like payment API
│
├── apps/
│   ├── simple-nextjs-rsc/       # Landing page with RSC (port 3001)
│   ├── simple-nextjs-no-rsc/    # Landing page without RSC (port 3004)
│   ├── complex-nextjs-rsc/      # E-commerce with RSC (port 3002)
│   └── complex-nextjs-no-rsc/   # E-commerce without RSC (port 3003)
│
├── scripts/
│   └── benchmark.js             # Lighthouse CLI benchmark runner
│
└── results/                     # Benchmark output (generated)
```

## Apps Overview

### Simple App (Marketing Landing Page)
- Hero section, Features grid, Pricing table, Testimonials, FAQ, Contact form
- **RSC version**: Server Components by default, only ContactForm is 'use client'
- **Non-RSC version**: Client Component with useEffect data fetching

### Complex App (E-commerce)
- 9+ pages: Home, Products, Product Detail, Category, Cart, Checkout, Account, Orders, Wishlist, Addresses, Search
- 6 API routes: cart operations, wishlist, reviews, checkout
- **RSC version**: Server Components fetch data, client components only at interactive boundaries (forms, filters, galleries)
- **Non-RSC version**: All pages are client components that fetch via API routes + Suspense boundaries

## RSC vs Non-RSC Patterns

### RSC Pattern (Server Components)
```tsx
// Server Component - fetches data directly on server
export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);  // Direct data call
  const reviews = await getReviews(product.id);
  
  return (
    <>
      <ProductDetail product={product} />
      <ProductReviews reviews={reviews} />
      <AddToCartButton productId={product.id} />  {/* Client Component */}
    </>
  );
}
```

### Non-RSC Pattern (Client Components)
```tsx
'use client';

export default function ProductPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/data/product/${slug}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;
  return <ProductDetail product={data.product} />;
}
```

## Running Benchmarks

```bash
# Install dependencies
npm install

# Benchmark all apps
node scripts/benchmark.js

# Benchmark specific app
node scripts/benchmark.js complex-nextjs-rsc

# Run individual apps for manual testing
cd apps/complex-nextjs-rsc && npm run dev
```

## Metrics Collected

- **TTFB**: Time to First Byte
- **FCP**: First Contentful Paint  
- **LCP**: Largest Contentful Paint
- **CLS**: Cumulative Layout Shift
- **Speed Index**: How quickly content is visually displayed
- **Performance Score**: Lighthouse overall score

## Key Differences to Observe

| Aspect | RSC | Non-RSC |
|--------|-----|---------|
| Initial HTML | Contains rendered content | Minimal HTML + loading states |
| JS Bundle | Smaller (server components excluded) | Larger (all components included) |
| Data Fetching | Server-side, single round-trip | Client-side, HTML + JS + API calls |
| Loading Experience | Streaming content progressively | Loading spinners, then content |
| Hydration | Only client components hydrate | Full page hydration |

## Benchmark Fairness

To ensure fair comparison:
- **Same business logic**: Identical features, validations, edge cases
- **Same data**: Deterministic seed with same seed value (42)
- **No caching**: All caching disabled
- **No framework magic**: PPR, ISR, static generation disabled
- **Production builds**: All apps built with `next build`

## Pending Variants

- [ ] Waku framework (lightweight RSC framework)
- [ ] React on Rails Pro (non-RSC)
- [ ] React on Rails Pro (RSC) - using upcoming-v16.3.0 branch

## Understanding Results

### RSC Should Win When:
- Large static content (no hydration needed)
- Deep component trees with independent async operations
- Client bundle size is critical
- Streaming benefits user-perceived performance

### RSC May Not Help When:
- Simple components with little data
- Everything needs hydration anyway (highly interactive)
- Sequential data fetching patterns

### Metrics to Focus On:
1. **FCP/LCP**: How fast users see content
2. **Bundle size**: How much JS shipped to client
3. **TTFB**: Server response time
4. **Waterfall**: Network request patterns
