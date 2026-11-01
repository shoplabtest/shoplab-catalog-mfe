import { ApiError } from '@shoplab/ui-kit';
import { getProduct } from './api.ts';
import { Price } from './components/index.ts';
import { useAsync } from './useAsync.ts';

export interface ProductDetailProps {
  id: string;
  onBack: () => void;
  onAdd: (id: string) => void;
  busy: boolean;
}

export function ProductDetail({ id, onBack, onAdd, busy }: ProductDetailProps) {
  const state = useAsync(() => getProduct(id), id);
  return (
    <section>
      <button type="button" onClick={onBack}>Back to products</button>
      {state.status === 'loading' && <p>Loading…</p>}
      {state.status === 'error' &&
        (state.error instanceof ApiError && state.error.status === 404
          ? <p role="alert">This product no longer exists.</p>
          : <p role="alert">Could not load the product.</p>)}
      {state.status === 'ready' && (
        <article>
          <h2>{state.data.name}</h2>
          <Price amount={state.data.price.amount} currency={state.data.price.currency} />
          <button type="button" disabled={busy} onClick={() => onAdd(state.data.id)}>Add to cart</button>
        </article>
      )}
    </section>
  );
}
