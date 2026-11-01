import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authFetch, emitCartUpdated, hostState } from './stubs/host-ui.ts';
import { product, stubFetch, TREE } from './helpers.ts';
import Page from '../src/Page.tsx';

const speaker = product('p-1', 'Studio Speaker', 4500);
const cable = product('p-2', 'Everyday Cable', 1200);

const renderPage = (path = '/', onAddToCart = vi.fn()) => {
  render(<MemoryRouter initialEntries={[path]}><Page onAddToCart={onAddToCart} currency="USD" /></MemoryRouter>);
  return onAddToCart;
};

beforeEach(() => {
  hostState.user = null;
  vi.mocked(authFetch).mockReset();
  vi.mocked(emitCartUpdated).mockReset();
});

describe('listing', () => {
  it('shows products with formatted prices, the category tree and the currency hint', async () => {
    stubFetch({ 'GET /categories': () => ({ body: TREE }), 'GET /products?*': () => ({ body: [speaker, cable] }) });
    renderPage();
    expect(await screen.findByText('Studio Speaker')).toBeTruthy();
    expect(screen.getByText('$45.00')).toBeTruthy();
    expect(screen.getByText('$12.00')).toBeTruthy();
    expect(screen.getByText('Audio')).toBeTruthy();
    expect(screen.getByText('Prices in USD')).toBeTruthy();
  });

  it('filters by category through the query string', async () => {
    const calls = stubFetch({ 'GET /categories': () => ({ body: TREE }), 'GET /products?*': () => ({ body: [speaker] }) });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Audio' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/products?page=1&category=audio')).toBe(true));
  });

  it('paginates', async () => {
    const calls = stubFetch({ 'GET /categories': () => ({ body: [] }), 'GET /products?*': () => ({ body: [speaker] }) });
    renderPage();
    await screen.findByText('Studio Speaker');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/products?page=2')).toBe(true));
    expect(screen.getByText(/Page 2/)).toBeTruthy();
  });

  it('shows an empty state and an error state', async () => {
    stubFetch({ 'GET /categories': () => ({ body: [] }), 'GET /products?*': () => ({ body: [] }) });
    renderPage();
    expect(await screen.findByText('No products found.')).toBeTruthy();
  });

  it('reports a failed load', async () => {
    stubFetch({ 'GET /categories': () => ({ body: [] }), 'GET /products?*': () => ({ status: 500, body: {} }) });
    renderPage();
    expect((await screen.findByRole('alert')).textContent).toBe('Could not load products.');
  });
});

describe('search', () => {
  it('uses /search with the chosen sort', async () => {
    const calls = stubFetch({
      'GET /categories': () => ({ body: [] }),
      'GET /products?*': () => ({ body: [speaker] }),
      'GET /search?*': () => ({ body: [cable, speaker] }),
    });
    renderPage();
    await screen.findByText('Studio Speaker');
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'cable' } });
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'price_asc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/search?q=cable&sort=price_asc')).toBe(true));
  });
});

describe('product page', () => {
  it('loads /products/:id from the product query param', async () => {
    const calls = stubFetch({ 'GET /categories': () => ({ body: [] }), 'GET /products/p-1': () => ({ body: speaker }) });
    renderPage('/?product=p-1');
    expect(await screen.findByRole('heading', { name: 'Studio Speaker' })).toBeTruthy();
    expect(calls.some((c) => c.url === '/products/p-1')).toBe(true);
  });

  it('shows a "no longer exists" message for 404 (ApiError instanceof)', async () => {
    stubFetch({ 'GET /categories': () => ({ body: [] }), 'GET /products/gone': () => ({ status: 404, body: { error: 'not_found' } }) });
    renderPage('/?product=gone');
    expect((await screen.findByRole('alert')).textContent).toBe('This product no longer exists.');
  });

  it('shows a generic error for other failures', async () => {
    stubFetch({ 'GET /categories': () => ({ body: [] }), 'GET /products/p-1': () => ({ status: 500, body: {} }) });
    renderPage('/?product=p-1');
    expect((await screen.findByRole('alert')).textContent).toBe('Could not load the product.');
  });
});

describe('add to cart', () => {
  const cartBody = (id: string, qty: number) => ({ id, lines: [{ productId: 'p-1', quantity: qty }] });

  it('guest: creates a cart, remembers localStorage.cartId, announces the count and notifies the host', async () => {
    const calls = stubFetch({
      'GET /categories': () => ({ body: [] }),
      'GET /products?*': () => ({ body: [speaker] }),
      'POST /cart/items': () => ({ body: cartBody('guest-1', 1) }),
    });
    const onAdd = renderPage();
    await screen.findByText('Studio Speaker');
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('p-1'));
    const post = calls.find((c) => c.url === '/cart/items')!;
    expect(JSON.parse(post.init.body as string)).toEqual({ productId: 'p-1', quantity: 1 });
    expect((post.init.headers as Record<string, string>)['x-cart-id']).toBeUndefined();
    expect(localStorage.getItem('cartId')).toBe('guest-1');
    expect(emitCartUpdated).toHaveBeenCalledWith({ count: 1 });
  });

  it('guest: a second add sends the saved x-cart-id', async () => {
    localStorage.setItem('cartId', 'guest-1');
    const calls = stubFetch({
      'GET /categories': () => ({ body: [] }),
      'GET /products?*': () => ({ body: [speaker] }),
      'POST /cart/items': () => ({ body: cartBody('guest-1', 2) }),
    });
    renderPage();
    await screen.findByText('Studio Speaker');
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(emitCartUpdated).toHaveBeenCalledWith({ count: 2 }));
    expect((calls.find((c) => c.url === '/cart/items')!.init.headers as Record<string, string>)['x-cart-id']).toBe('guest-1');
  });

  it('logged in: goes through the host authFetch and leaves localStorage.cartId alone', async () => {
    hostState.user = { id: 'u-1', role: 'customer' };
    vi.mocked(authFetch).mockResolvedValue(cartBody('user-cart', 3));
    stubFetch({ 'GET /categories': () => ({ body: [] }), 'GET /products?*': () => ({ body: [speaker] }) });
    const onAdd = renderPage();
    await screen.findByText('Studio Speaker');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Add to cart' })));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('p-1'));
    expect(authFetch).toHaveBeenCalledWith('/cart/items', { method: 'POST', body: JSON.stringify({ productId: 'p-1', quantity: 1 }) });
    expect(localStorage.getItem('cartId')).toBeNull();
    expect(emitCartUpdated).toHaveBeenCalledWith({ count: 3 });
  });

  it('shows an error and does not notify the host when the cart call fails', async () => {
    stubFetch({
      'GET /categories': () => ({ body: [] }),
      'GET /products?*': () => ({ body: [speaker] }),
      'POST /cart/items': () => ({ status: 404, body: { error: 'product_not_found' } }),
    });
    const onAdd = renderPage();
    await screen.findByText('Studio Speaker');
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Could not add that item to your cart.');
    expect(onAdd).not.toHaveBeenCalled();
    expect(emitCartUpdated).not.toHaveBeenCalled();
  });
});
