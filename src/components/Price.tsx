import { PriceTag, type PriceTagProps } from '@shoplab/ui-kit';

/** Catalog styling on top of the shared PriceTag; every prop passes straight through. */
export const Price = (props: PriceTagProps) => <PriceTag className="catalog-price" {...props} />;
