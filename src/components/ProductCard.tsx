import { Price } from './Price.tsx';
import type { Product } from '../types.ts';

export interface ProductCardProps {
  product: Product;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  busy?: boolean;
}

export function ProductCard({ product, onOpen, onAdd, busy }: ProductCardProps) {
  return (
    <article className="catalog-card">
      <h3><button type="button" onClick={() => onOpen(product.id)}>{product.name}</button></h3>
      <Price amount={product.price.amount} currency={product.price.currency} />
      <button type="button" disabled={busy} onClick={() => onAdd(product.id)}>Add to cart</button>
    </article>
  );
}
