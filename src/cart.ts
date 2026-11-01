import { ApiError } from '@shoplab/ui-kit';
import { authFetch, emitCartUpdated } from 'host/ui';
import type { Cart } from './types.ts';

// The guest cart id lives in localStorage under `cartId`; the cart remote reads and the host merges it on login.
const GUEST_CART_KEY = 'cartId';

const readGuestId = () => {
  try { return localStorage.getItem(GUEST_CART_KEY); } catch { return null; }
};
const writeGuestId = (id: string) => {
  try { localStorage.setItem(GUEST_CART_KEY, id); } catch { /* private mode: the cart still works for this page view */ }
};

/** Adds one unit. Logged-in users go through the host's authFetch; guests send `x-cart-id` and remember the id the server returns. */
export async function addToCart(productId: string, loggedIn: boolean): Promise<Cart> {
  const body = JSON.stringify({ productId, quantity: 1 });
  let cart: Cart;
  if (loggedIn) {
    cart = await authFetch<Cart>('/cart/items', { method: 'POST', body });
  } else {
    const guestId = readGuestId();
    const res = await fetch('/cart/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(guestId ? { 'x-cart-id': guestId } : {}) },
      body,
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(res.status, err.error ?? 'request_failed');
    }
    cart = (await res.json()) as Cart;
    writeGuestId(cart.id);
  }
  emitCartUpdated({ count: cart.lines.reduce((n, l) => n + l.quantity, 0) });
  return cart;
}
