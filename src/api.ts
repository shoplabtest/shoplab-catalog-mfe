import { ApiError } from '@shoplab/ui-kit';
import type { CategoryNode, Product, Sort } from './types.ts';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? 'request_failed');
  }
  return (await res.json()) as T;
}

export const listProducts = (category: string | null, page: number) => {
  const q = new URLSearchParams({ page: String(page) });
  if (category) q.set('category', category);
  return getJson<Product[]>(`/products?${q}`);
};

export const searchProducts = (query: string, sort: Sort) => getJson<Product[]>(`/search?${new URLSearchParams({ q: query, sort })}`);

/** The product id goes straight into the path: GET /products/:id */
export const getProduct = (id: string) => getJson<Product>(`/products/${encodeURIComponent(id)}`);

export const listCategories = () => getJson<CategoryNode[]>('/categories');
