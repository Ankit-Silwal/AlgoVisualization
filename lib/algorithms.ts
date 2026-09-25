export type Case = "best" | "average" | "worst";
export type Complexity =
  "constant" | "log" | "linear" | "nlogn" | "quadratic" | "cubic" | "exponential";
export type Algorithm = {
  id: string;
  name: string;
  code: string;
  language: string;
  color: string;
  model: Record<Case, Complexity>;
  factors: Record<Case, number>;
  overhead: number;
  space: string;
  explanation: string;
  conditions: Record<Case, string>;
  origin: "preset" | "heuristic" | "manual";
};
export const COLORS = ["#7461d5", "#25a792", "#e7a347", "#dc7796", "#4e91d7", "#bd7b41"];
export const CASES: Case[] = ["best", "average", "worst"];
export const LABELS: Record<Complexity, string> = {
  constant: "O(1)",
  log: "O(log n)",
  linear: "O(n)",
  nlogn: "O(n log n)",
  quadratic: "O(n²)",
  cubic: "O(n³)",
  exponential: "O(2ⁿ)",
};
const all = (value: Complexity): Record<Case, Complexity> => ({
  best: value,
  average: value,
  worst: value,
});
export const PRESETS: Algorithm[] = [
  {
    id: "insertion",
    name: "Insertion sort",
    language: "JavaScript",
    color: COLORS[0],
    model: { best: "linear", average: "quadratic", worst: "quadratic" },
    factors: { best: 1, average: 0.25, worst: 0.5 },
    overhead: 0,
    space: "O(1)",
    origin: "preset",
    explanation:
      "A low constant cost makes insertion sort competitive on small arrays. Shifting elements becomes expensive as the input grows.",
    conditions: {
      best: "Already sorted input; one comparison per element.",
      average: "Randomly ordered distinct values; about n²/4 comparisons and shifts.",
      worst: "Reverse-sorted input; about n²/2 comparisons and shifts.",
    },
    code: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
  },
  {
    id: "merge",
    name: "Merge sort",
    language: "JavaScript",
    color: COLORS[1],
    model: all("nlogn"),
    factors: { best: 3, average: 4, worst: 5 },
    overhead: 30,
    space: "O(n)",
    origin: "preset",
    explanation:
      "Splitting and merging adds overhead, but n log n growth scales well. This model includes allocation and recursion costs.",
    conditions: {
      best: "Merges exhaust one half early; all levels still run.",
      average: "Random input; each merge interleaves the two halves.",
      worst: "Values interleave until the final comparison in each merge.",
    },
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    result.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  return result.concat(left.slice(i), right.slice(j));
}`,
  },
  {
    id: "selection",
    name: "Selection sort",
    language: "JavaScript",
    color: COLORS[2],
    model: all("quadratic"),
    factors: { best: 0.5, average: 0.5, worst: 0.5 },
    overhead: 0,
    space: "O(1)",
    origin: "preset",
    explanation:
      "Selection sort scans the remaining array for every position, regardless of the input order. Its case curves overlap in this model.",
    conditions: {
      best: "Already sorted; scanning for each minimum is still necessary.",
      average: "Random input; scans every remaining element.",
      worst: "Any order; the same quadratic number of comparisons.",
    },
    code: `function selectionSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[min]) min = j;
    }
    [arr[i], arr[min]] = [arr[min], arr[i]];
  }
  return arr;
}`,
  },
  {
    id: "linear",
    name: "Linear search",
    language: "JavaScript",
    color: COLORS[3],
    model: { best: "constant", average: "linear", worst: "linear" },
    factors: { best: 1, average: 0.5, worst: 1 },
    overhead: 0,
    space: "O(1)",
    origin: "preset",
    explanation:
      "Search checks one element at a time. The first position is the best case; an absent target requires a full scan.",
    conditions: {
      best: "Target is the first element.",
      average: "Target is present at a uniformly random position.",
      worst: "Target is absent or is the final element.",
    },
    code: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`,
  },
  {
    id: "binary",
    name: "Binary search",
    language: "JavaScript",
    color: COLORS[4],
    model: { best: "constant", average: "log", worst: "log" },
    factors: { best: 1, average: 1, worst: 1 },
    overhead: 0,
    space: "O(1)",
    origin: "preset",
    explanation:
      "Binary search halves the search space at every step. Input must already be sorted; sorting cost is excluded.",
    conditions: {
      best: "Target is at the first midpoint.",
      average: "Target position is uniformly distributed in sorted input.",
      worst: "Target is absent or found at the deepest search level.",
    },
    code: `function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
  },
  {
    id: "bubble",
    name: "Bubble sort",
    language: "JavaScript",
    color: COLORS[5],
    model: { best: "linear", average: "quadratic", worst: "quadratic" },
    factors: { best: 1, average: 0.5, worst: 0.75 },
    overhead: 0,
    space: "O(1)",
    origin: "preset",
    explanation:
      "An early-exit flag gives this version linear best-case behavior. Repeated adjacent swaps make average and worst cases quadratic.",
    conditions: {
      best: "Sorted input triggers the early-exit flag.",
      average: "Random input needs repeated passes and swaps.",
      worst: "Reverse order requires the maximum number of swaps.",
    },
    code: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}`,
  },
];
export function operations(complexity: Complexity, n: number): number {
  n = Math.max(1, Math.min(1e9, n));
  switch (complexity) {
    case "constant":
      return 1;
    case "log":
      return Math.max(1, Math.log2(n));
    case "linear":
      return n;
    case "nlogn":
      return n * Math.max(1, Math.log2(n));
    case "quadratic":
      return n * n;
    case "cubic":
      return n ** 3;
    case "exponential":
      return 2 ** Math.min(n, 1023);
  }
}
export function runtime(a: Algorithm, n: number, c: Case, opsPerSecond: number): number {
  return Math.min(
    Number.MAX_VALUE,
    ((a.overhead + a.factors[c] * operations(a.model[c], n)) / Math.max(1, opsPerSecond)) * 1000,
  );
}
export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms > 3.154e13) return "> 1,000 years";
  if (ms < 0.001) return `${(ms * 1e6).toFixed(0)} ns`;
  if (ms < 1) return `${(ms * 1000).toFixed(1)} μs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms < 3.6e6) return `${(ms / 60000).toFixed(1)} min`;
  if (ms < 8.64e7) return `${(ms / 3.6e6).toFixed(1)} h`;
  return `${(ms / 8.64e7).toLocaleString(undefined, { maximumFractionDigits: 1 })} days`;
}
export function compact(n: number): string {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
export function crossover(a: Algorithm, b: Algorithm, c: Case, rate: number): number | null {
  let prev = runtime(a, 1, c, rate) - runtime(b, 1, c, rate);
  if (prev === 0) prev = runtime(a, 2, c, rate) - runtime(b, 2, c, rate);
  for (let i = 1; i <= 600; i++) {
    const n = Math.max(2, Math.round(10 ** ((i * 9) / 600)));
    const diff = runtime(a, n, c, rate) - runtime(b, n, c, rate);
    if (diff && prev && Math.sign(diff) !== Math.sign(prev)) return n;
    if (diff) prev = diff;
  }
  return null;
}
export type Analysis = { algorithm: Algorithm; confidence: "preset" | "low"; notes: string[] };
export function maxInputWithinBudget(a: Algorithm, c: Case, rate: number, seconds: number): number {
  if (runtime(a, 1, c, rate) > seconds * 1000) return 0;
  let low = 1,
    high = 1e9;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (runtime(a, mid, c, rate) <= seconds * 1000) low = mid;
    else high = mid - 1;
  }
  return low;
}
export function analyzeCode(code: string, name: string, language: string): Analysis {
  const exact = PRESETS.find((p) => p.code.replace(/\s/g, "") === code.replace(/\s/g, ""));
  if (exact)
    return {
      algorithm: { ...exact, name: name || exact.name, language },
      confidence: "preset",
      notes: ["Exact match to a reviewed library implementation.", exact.explanation],
    };
  // Deliberately conservative: names alone never establish algorithmic complexity.
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/#[^\n]*/g, "")
    .replace(/(["'`])(?:\\.|(?!\1)[^\\])*?\1/g, '""');
  const loopCount = (stripped.match(/\b(for|while)\s*\(?/g) || []).length;
  const model: Complexity = loopCount > 1 ? "quadratic" : loopCount === 1 ? "linear" : "constant";
  const notes = [
    "Heuristic suggestion only. Arbitrary code cannot be reliably analyzed from syntax; review all three case models before using this estimate.",
    loopCount > 1
      ? "Multiple loops found. Quadratic growth is a placeholder: sequential loops may be linear, while nesting can be more expensive."
      : loopCount === 1
        ? "A loop was found. Linear growth assumes the loop visits n elements; halving, fixed bounds, or early exits change the model."
        : "No explicit loops found. Constant growth is a placeholder; recursion, library calls, and comprehensions can have substantial hidden cost.",
    "Input distributions, recursion, language performance, and hidden library costs are not inferred. No submitted code is executed.",
  ];
  return {
    algorithm: {
      id: `custom-${Date.now()}`,
      name: name || "Custom algorithm",
      code,
      language,
      color: COLORS[0],
      model: all(model),
      factors: { best: 1, average: 1, worst: 1 },
      overhead: 0,
      space: "Not inferred",
      origin: "heuristic",
      explanation: notes[1],
      conditions: {
        best: "User-defined favorable input; set the best-case model.",
        average: "User-defined input distribution; set the average-case model.",
        worst: "User-defined adversarial input; set the worst-case model.",
      },
    },
    confidence: "low",
    notes,
  };
}
