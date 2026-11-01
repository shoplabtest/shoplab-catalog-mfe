import type { Currency } from '@shoplab/ui-kit';

/** Response shapes from shoplab-contracts openapi/catalog-api.yaml and cart-api.yaml. */
export interface Product {
  id: string;
  name: string;
  price: { amount: number; currency: Currency };
  categoryId: string;
  imageUrl?: string;
}

export interface CategoryNode { id: string; name: string; children: CategoryNode[] }

export interface Cart { id: string; lines: { productId: string; quantity: number }[] }

export type Sort = 'relevance' | 'price_asc' | 'price_desc';
