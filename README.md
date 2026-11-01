# shoplab-catalog-mfe

Catalog remote: listing, category filter, search and sort, product page, add to cart. React + Vite.

**Exposes** `./CatalogPage` with props `onAddToCart(productId)` and `currency`.
**Consumes** `host/ui` (`useAuth`, `authFetch`, `emitCartUpdated`), `@shoplab/ui-kit` (`PriceTag`, `FormField`, `ApiError`, shared singleton).
**HTTP:** `GET /products?category&page`, `GET /products/:id`, `GET /search?q&sort`, `GET /categories`, `POST /cart/items`.
**Browser state:** URL query params `category`, `q`, `sort`, `page`, `product`; `localStorage.cartId` (guest cart id, written here and by the cart remote, merged by the host after login).
**Events:** emits `cart:updated` through `host/ui` after every add.

```
npm install
npm test
npm run build     # emits dist/assets/remoteEntry.js
npm start         # build + serve on port 5001 (the host loads it from there)
```
