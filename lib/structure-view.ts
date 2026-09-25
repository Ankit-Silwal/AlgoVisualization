export type VisualNode = { id: string; label: string; x: number; y: number; detail?: string };
export type VisualEdge = { from: string; to: string; label?: string };
export type StructureView = { nodes: VisualNode[]; edges: VisualEdge[]; height: number };
export function heapify(values: number[]) {
  const a = [...values];
  for (let i = 1; i < a.length; i++) {
    let k = i;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (a[p] <= a[k]) break;
      [a[p], a[k]] = [a[k], a[p]];
      k = p;
    }
  }
  return a;
}
export function heapPop(values: number[]) {
  const a = [...values];
  if (!a.length) return a;
  const last = a.pop()!;
  if (a.length) {
    a[0] = last;
    let i = 0;
    while (i * 2 + 1 < a.length) {
      let c = i * 2 + 1;
      if (c + 1 < a.length && a[c + 1] < a[c]) c++;
      if (a[i] <= a[c]) break;
      [a[i], a[c]] = [a[c], a[i]];
      i = c;
    }
  }
  return a;
}
export function fenwick(values: number[]) {
  const t = Array(values.length + 1).fill(0) as number[];
  values.forEach((v, k) => {
    for (let i = k + 1; i < t.length; i += i & -i) t[i] += v;
  });
  return t;
}
export function prefixQuery(values: number[], end: number) {
  const t = fenwick(values),
    visited: string[] = [];
  let sum = 0;
  for (let i = end + 1; i > 0; i -= i & -i) {
    sum += t[i];
    visited.push(String(i - 1));
  }
  return { sum, visited };
}
export function segmentQuery(values: number[], l: number, r: number) {
  const visited: string[] = [];
  function query(a: number, b: number, id: string): number {
    visited.push(id);
    if (b < l || a > r) return 0;
    if (l <= a && b <= r) return values.slice(a, b + 1).reduce((x, y) => x + y, 0);
    const m = (a + b) >> 1;
    return query(a, m, id + "l") + query(m + 1, b, id + "r");
  }
  return { sum: values.length ? query(0, values.length - 1, "root") : 0, visited };
}
type Node = { value: number; index: number; left: Node | null; right: Node | null };
export function bst(values: number[]): Node | null {
  let root: Node | null = null;
  values.forEach((v, index) => {
    const n: Node = { value: v, index, left: null, right: null };
    if (!root) {
      root = n;
      return;
    }
    let p = root;
    while (true) {
      const side = v < p.value ? "left" : "right";
      if (!p[side]) {
        p[side] = n;
        break;
      }
      p = p[side]!;
    }
  });
  return root;
}
export function searchBST(values: number[], target: number) {
  let p = bst(values);
  const visited: string[] = [];
  while (p) {
    visited.push(String(p.index));
    if (p.value === target) return { visited, found: true };
    p = target < p.value ? p.left : p.right;
  }
  return { visited, found: false };
}
export function graphBFS(values: number[], edges: [number, number][], start: number) {
  const q = [start],
    seen = new Set(q),
    visited: string[] = [];
  for (let i = 0; i < q.length; i++) {
    const v = q[i];
    visited.push(String(values.indexOf(v)));
    for (const [a, b] of edges) {
      const next = a === v ? b : b === v ? a : null;
      if (next !== null && !seen.has(next)) {
        seen.add(next);
        q.push(next);
      }
    }
  }
  return visited;
}
export function structureView(
  name: string,
  values: number[],
  words: string[],
  connections: [number, number][],
): StructureView {
  const nodes: VisualNode[] = [],
    edges: VisualEdge[] = [];
  let height = 230;
  const add = (id: string, label: string, x: number, y: number, detail?: string) => {
    nodes.push({ id, label, x, y, detail });
    height = Math.max(height, y + 65);
  };
  if (name === "Binary search tree") {
    function walk(
      p: ReturnType<typeof bst>,
      left: number,
      right: number,
      depth: number,
      parent?: string,
    ) {
      if (!p) return;
      const id = String(p.index),
        x = (left + right) / 2;
      add(id, String(p.value), x, 35 + depth * 65);
      if (parent) edges.push({ from: parent, to: id });
      walk(p.left, left, x, depth + 1, id);
      walk(p.right, x, right, depth + 1, id);
    }
    walk(bst(values), 20, 740, 0);
  } else if (name === "Binary heap") {
    values.forEach((v, i) => {
      const depth = Math.floor(Math.log2(i + 1)),
        offset = i - (2 ** depth - 1);
      add(
        String(i),
        String(v),
        ((offset + 0.5) * 740) / 2 ** depth + 10,
        35 + depth * 65,
        `index ${i}`,
      );
      if (i) edges.push({ from: String((i - 1) >> 1), to: String(i) });
    });
  } else if (name === "Segment tree") {
    function visit(l: number, r: number, id: string, x: number, span: number, depth: number) {
      add(
        id,
        String(values.slice(l, r + 1).reduce((a, b) => a + b, 0)),
        x,
        35 + depth * 65,
        `[${l},${r}]`,
      );
      if (l < r) {
        const m = (l + r) >> 1;
        edges.push({ from: id, to: id + "l" }, { from: id, to: id + "r" });
        visit(l, m, id + "l", x - span / 2, span / 2, depth + 1);
        visit(m + 1, r, id + "r", x + span / 2, span / 2, depth + 1);
      }
    }
    if (values.length) visit(0, values.length - 1, "root", 380, 350, 0);
  } else if (name === "Trie") {
    const keys = new Map<string, string>();
    keys.set("", "root");
    for (const word of words) {
      let prefix = "";
      for (const ch of word) {
        const next = prefix + ch;
        if (!keys.has(next)) {
          keys.set(next, next);
          edges.push({ from: keys.get(prefix)!, to: next });
        }
        prefix = next;
      }
    }
    const max = Math.max(0, ...[...keys.keys()].map((k) => k.length));
    for (let d = 0; d <= max; d++) {
      const level = [...keys.keys()].filter((k) => k.length === d);
      level.forEach((k, i) =>
        add(
          keys.get(k)!,
          k ? k.slice(-1) : "∅",
          ((i + 1) * 760) / (level.length + 1),
          35 + d * 65,
          words.includes(k) ? "word end" : k,
        ),
      );
    }
  } else if (name === "Graph" || name === "Disjoint set") {
    const parent = new Map(values.map((v) => [v, v]));
    const find = (v: number): number => {
      while (parent.get(v) !== v) v = parent.get(v)!;
      return v;
    };
    if (name === "Disjoint set")
      for (const [a, b] of connections)
        if (parent.has(a) && parent.has(b)) parent.set(find(b), find(a));
    values.forEach((v, i) => {
      const angle = (i / Math.max(values.length, 1)) * Math.PI * 2 - Math.PI / 2;
      add(
        String(i),
        String(v),
        380 + Math.cos(angle) * 230,
        155 + Math.sin(angle) * 115,
        name === "Disjoint set" ? `root ${find(v)}` : undefined,
      );
    });
    for (const [a, b] of connections)
      edges.push({ from: String(values.indexOf(a)), to: String(values.indexOf(b)) });
  } else if (name === "Hash table" || name === "Hash set") {
    for (let b = 0; b < 7; b++) {
      add(`bucket-${b}`, String(b), 50, 35 + b * 55, "bucket");
      const items = values.map((v, i) => ({ v, i })).filter(({ v }) => ((v % 7) + 7) % 7 === b);
      items.forEach(({ v, i }, j) => {
        add(String(i), String(v), 160 + j * 95, 35 + b * 55);
        edges.push({ from: j ? String(items[j - 1].i) : `bucket-${b}`, to: String(i) });
      });
    }
  } else if (name === "Sparse table") {
    for (let k = 0; 1 << k <= values.length; k++) {
      for (let i = 0; i + (1 << k) <= values.length; i++)
        add(
          `${k}-${i}`,
          String(Math.min(...values.slice(i, i + (1 << k)))),
          45 + i * 65,
          35 + k * 65,
          `[${i},${i + (1 << k) - 1}]`,
        );
    }
  } else if (name === "Matrix") {
    values.forEach((v, i) =>
      add(
        String(i),
        String(v),
        190 + (i % 4) * 95,
        35 + Math.floor(i / 4) * 65,
        `${Math.floor(i / 4)},${i % 4}`,
      ),
    );
  } else if (name === "Circular queue") {
    values.forEach((v, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      add(
        String(i),
        String(v),
        380 + Math.cos(angle) * 230,
        155 + Math.sin(angle) * 115,
        i === 0 ? "head" : i === values.length - 1 ? "tail" : `slot ${i}`,
      );
    });
  } else if (name === "Stack") {
    values.forEach((v, i) =>
      add(
        String(i),
        String(v),
        380,
        35 + (values.length - i - 1) * 55,
        i === values.length - 1 ? "top" : String(i),
      ),
    );
  } else {
    const vals = name === "Fenwick tree" ? fenwick(values).slice(1) : values;
    vals.forEach((v, i) => {
      const x = 45 + (i % 8) * 92,
        y = 45 + Math.floor(i / 8) * 85;
      add(
        String(i),
        String(v),
        x,
        y,
        name === "Fenwick tree" ? `[${i + 1 - ((i + 1) & -(i + 1))},${i}]` : String(i),
      );
      if (i && name.toLowerCase().includes("linked"))
        edges.push({
          from: String(i - 1),
          to: String(i),
          label: name === "Doubly linked list" ? "↔" : "→",
        });
    });
  }
  return { nodes, edges, height };
}
