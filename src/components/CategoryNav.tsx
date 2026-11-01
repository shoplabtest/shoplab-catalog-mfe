import type { CategoryNode } from '../types.ts';

export interface CategoryNavProps {
  tree: CategoryNode[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

function Node({ node, selected, onSelect }: { node: CategoryNode } & Omit<CategoryNavProps, 'tree'>) {
  return (
    <li>
      <button type="button" aria-pressed={node.id === selected} onClick={() => onSelect(node.id)}>{node.name}</button>
      {node.children.length > 0 && (
        <ul>{node.children.map((c) => <Node key={c.id} node={c} selected={selected} onSelect={onSelect} />)}</ul>
      )}
    </li>
  );
}

export function CategoryNav({ tree, selected, onSelect }: CategoryNavProps) {
  return (
    <nav aria-label="Categories">
      <button type="button" aria-pressed={selected === null} onClick={() => onSelect(null)}>All</button>
      <ul>{tree.map((n) => <Node key={n.id} node={n} selected={selected} onSelect={onSelect} />)}</ul>
    </nav>
  );
}
