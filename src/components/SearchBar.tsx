import { FormField } from '@shoplab/ui-kit';
import { useState, type FormEvent } from 'react';
import type { Sort } from '../types.ts';

export interface SearchBarProps {
  query: string;
  sort: Sort;
  onSearch: (query: string, sort: Sort) => void;
}

export function SearchBar({ query, sort, onSearch }: SearchBarProps) {
  const [text, setText] = useState(query);
  const [order, setOrder] = useState<Sort>(sort);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(text.trim(), order);
  };
  return (
    <form role="search" onSubmit={submit}>
      <FormField label="Search" name="q">
        <input id="q" value={text} onChange={(e) => setText(e.target.value)} />
      </FormField>
      <FormField label="Sort by" name="sort">
        <select id="sort" value={order} onChange={(e) => setOrder(e.target.value as Sort)}>
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </FormField>
      <button type="submit">Search</button>
    </form>
  );
}
