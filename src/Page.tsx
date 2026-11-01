import type { Currency } from '@shoplab/ui-kit';
import { useAuth } from 'host/ui';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listCategories, listProducts, searchProducts } from './api.ts';
import { addToCart } from './cart.ts';
import { CategoryNav, ProductCard, SearchBar } from './components/index.ts';
import { ProductDetail } from './ProductDetail.tsx';
import type { Sort } from './types.ts';
import { useAsync } from './useAsync.ts';

export interface CatalogPageProps {
  /** Called after a product was added to the cart. */
  onAddToCart: (productId: string) => void;
  /** Shop currency, shown as a hint above the listing. */
  currency: Currency;
}

const SORTS: Sort[] = ['relevance', 'price_asc', 'price_desc'];

export default function Page({ onAddToCart, currency }: CatalogPageProps) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = params.get('category');
  const query = params.get('q') ?? '';
  const sortParam = params.get('sort') as Sort | null;
  const sort: Sort = sortParam && SORTS.includes(sortParam) ? sortParam : 'relevance';
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const productId = params.get('product');

  const update = useCallback((changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) (v === null || v === '' ? next.delete(k) : next.set(k, v));
    setParams(next);
  }, [params, setParams]);

  const categories = useAsync(listCategories, 'categories');
  const products = useAsync(
    () => (query ? searchProducts(query, sort) : listProducts(category, page)),
    `${query}|${sort}|${category}|${page}`,
  );

  const add = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await addToCart(id, !!user);
      onAddToCart(id);
    } catch {
      setError('Could not add that item to your cart.');
    } finally {
      setBusy(false);
    }
  };

  if (productId) return <ProductDetail id={productId} onBack={() => update({ product: null })} onAdd={add} busy={busy} />;

  return (
    <section>
      <p>Prices in {currency}</p>
      <SearchBar key={`${query}|${sort}`} query={query} sort={sort} onSearch={(q, s) => update({ q, sort: q ? s : null, category: null, page: null })} />
      {categories.status === 'ready' && (
        <CategoryNav tree={categories.data} selected={category} onSelect={(id) => update({ category: id, q: null, sort: null, page: null })} />
      )}
      {error && <p role="alert">{error}</p>}
      {products.status === 'loading' && <p>Loading…</p>}
      {products.status === 'error' && <p role="alert">Could not load products.</p>}
      {products.status === 'ready' && (
        products.data.length === 0
          ? <p>No products found.</p>
          : <div>{products.data.map((p) => <ProductCard key={p.id} product={p} busy={busy} onOpen={(id) => update({ product: id })} onAdd={add} />)}</div>
      )}
      {!query && (
        <div>
          <button type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</button>
          <span> Page {page} </span>
          <button type="button" disabled={products.status !== 'ready' || products.data.length === 0} onClick={() => update({ page: String(page + 1) })}>Next</button>
        </div>
      )}
    </section>
  );
}
