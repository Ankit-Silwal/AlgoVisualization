"use client";
import { useEffect, useState } from "react";
import { Layers, Play, SkipForward, RotateCcw, ArrowUpRight } from "lucide-react";
import { STRUCTURES, LANGUAGES, Language, structureAlgorithm } from "@/lib/library";
import { Algorithm } from "@/lib/algorithms";
import {
  graphBFS,
  heapify,
  heapPop,
  prefixQuery,
  searchBST,
  segmentQuery,
  structureView,
} from "@/lib/structure-view";
export default function StructureStudio({ onAdd }: { onAdd: (a: Algorithm) => void }) {
  const [name, setName] = useState("Array"),
    [values, setValues] = useState([8, 3, 10, 1, 6, 14]),
    [words, setWords] = useState(["cat", "car", "dog"]),
    [edges, setEdges] = useState<[number, number][]>([
      [8, 3],
      [8, 10],
      [3, 1],
      [3, 6],
      [10, 14],
    ]),
    [input, setInput] = useState("8, 3, 10, 1, 6, 14"),
    [argument, setArgument] = useState("6"),
    [operation, setOperation] = useState("Find"),
    [message, setMessage] = useState("Choose an operation to see which elements it touches."),
    [trace, setTrace] = useState<string[]>([]),
    [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [language, setLanguage] = useState<Language>("JavaScript");
  const structure = STRUCTURES.find((s) => s.name === name)!,
    view = structureView(name, values, words, edges);
  const operations =
    name === "Trie"
      ? ["Insert word", "Find word", "Delete word"]
      : name === "Graph"
        ? ["Add edge", "Remove edge", "BFS"]
        : name === "Disjoint set"
          ? ["Union", "Connected"]
          : name === "Fenwick tree"
            ? ["Prefix sum", "Update"]
            : name === "Segment tree"
              ? ["Range sum", "Update"]
              : name === "Sparse table"
                ? ["Range minimum"]
                : name === "Binary heap"
                  ? ["Insert", "Extract min", "Find"]
                  : name === "Stack"
                    ? ["Push", "Pop", "Peek"]
                    : name === "Queue" || name === "Circular queue"
                      ? ["Enqueue", "Dequeue", "Peek"]
                      : name === "Deque"
                        ? ["Push front", "Push back", "Pop front", "Pop back", "Find"]
                        : name === "Matrix"
                          ? ["Read cell", "Update cell"]
                          : ["Insert", "Delete", "Find"];
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setStep((s) => {
          if (s >= trace.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      500,
    );
    return () => clearInterval(t);
  }, [playing, trace.length]);
  const resetTrace = () => {
    setTrace([]);
    setStep(0);
    setPlaying(false);
  };
  const select = (n: string) => {
    setName(n);
    setOperation("");
    resetTrace();
    setMessage("Structure changed. Choose an operation.");
    if (n === "Binary heap") setValues((v) => heapify(v));
    if (n === "Hash set" || n === "Graph" || n === "Disjoint set")
      setValues((v) => [...new Set(v)]);
    if (n === "Trie") setInput(words.join(", "));
    else setInput(values.join(", "));
  };
  const load = () => {
    resetTrace();
    if (name === "Trie") {
      const ws = input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ws.length > 12 || ws.some((s) => s.length > 10)) {
        setMessage("Use up to 12 words, each at most 10 characters.");
        return;
      }
      setWords([...new Set(ws)]);
      setMessage("Words loaded into the prefix tree.");
      return;
    }
    const ns = input
      .split(/[ ,\n]+/)
      .filter(Boolean)
      .map(Number);
    if (ns.length > 16 || ns.some((v) => !Number.isInteger(v) || Math.abs(v) > 9999)) {
      setMessage("Use at most 16 integers between −9,999 and 9,999.");
      return;
    }
    const unique = ["Hash set", "Graph", "Disjoint set"].includes(name) ? [...new Set(ns)] : ns;
    setValues(name === "Binary heap" ? heapify(unique) : unique);
    setEdges([]);
    setMessage("Values loaded. Graph edges / set unions have been reset.");
  };
  const execute = () => {
    resetTrace();
    const op = operations.includes(operation) ? operation : operations[0],
      args = argument.split(/[ ,]+/).map(Number),
      v = args[0];
    let visited: string[] = [],
      next = [...values];
    if (name === "Trie") {
      const word = argument.trim();
      if (!word || word.length > 10) {
        setMessage("Enter a word of 1–10 characters.");
        return;
      }
      visited = ["root", ...Array.from(word, (_, i) => word.slice(0, i + 1))];
      if (op === "Insert word") {
        if (words.length >= 12) {
          setMessage("Limit: 12 words.");
          return;
        }
        setWords([...new Set([...words, word])]);
        setMessage(`Inserted “${word}”, visiting one node per character: O(L).`);
      } else if (op === "Delete word") {
        setWords(words.filter((w) => w !== word));
        setMessage(`Removed “${word}”; shared prefixes are retained.`);
      } else
        setMessage(
          words.includes(word)
            ? `Found “${word}” at a word-ending node.`
            : `“${word}” is not a stored word.`,
        );
    } else if (name === "Graph" || name === "Disjoint set") {
      if (op === "BFS") {
        if (!values.includes(v)) {
          setMessage("Start vertex is not present.");
          return;
        }
        visited = graphBFS(values, edges, v);
        setMessage(`BFS visits ${visited.map((i) => values[Number(i)]).join(" → ")}. O(V + E).`);
      } else {
        const b = args[1];
        if (!values.includes(v) || !values.includes(b)) {
          setMessage("Enter two existing vertex values separated by a comma.");
          return;
        }
        visited = [String(values.indexOf(v)), String(values.indexOf(b))];
        if (op === "Connected") {
          const reachable = graphBFS(values, edges, v);
          setMessage(
            reachable.includes(String(values.indexOf(b)))
              ? "These vertices are in the same component."
              : "These vertices are in different components.",
          );
        } else if (op === "Remove edge") {
          setEdges(edges.filter(([x, y]) => !((x === v && y === b) || (x === b && y === v))));
          setMessage(`Removed undirected edge ${v} ↔ ${b}.`);
        } else {
          setEdges([
            ...edges.filter(([x, y]) => !((x === v && y === b) || (x === b && y === v))),
            [v, b],
          ]);
          setMessage(
            op === "Union"
              ? `Merged the components containing ${v} and ${b}.`
              : `Added undirected edge ${v} ↔ ${b}.`,
          );
        }
      }
    } else if (["Fenwick tree", "Segment tree", "Sparse table"].includes(name)) {
      if (!values.length) {
        setMessage("Load some values first.");
        return;
      }
      if (op === "Update") {
        const delta = args[1];
        if (!Number.isInteger(v) || v < 0 || v >= values.length || !Number.isFinite(delta)) {
          setMessage("Enter index, delta.");
          return;
        }
        next[v] += delta;
        setValues(next);
        visited =
          name === "Fenwick tree"
            ? Array.from({ length: values.length }, (_, i) => i + 1)
                .filter((i) => i > v && i - (i & -i) <= v)
                .map((i) => String(i - 1))
            : segmentQuery(next, v, v).visited;
        setMessage(`Added ${delta} at index ${v}. Only the covering aggregates change.`);
      } else {
        const r = op === "Prefix sum" ? v : args[1],
          l = op === "Prefix sum" ? 0 : v;
        if (!Number.isInteger(l) || !Number.isInteger(r) || l < 0 || r < l || r >= values.length) {
          setMessage(
            op === "Prefix sum"
              ? "Enter an inclusive end index."
              : "Enter an inclusive range: left, right.",
          );
          return;
        }
        if (op === "Prefix sum") {
          const q = prefixQuery(values, r);
          visited = q.visited;
          setMessage(`Prefix sum [0,${r}] = ${q.sum}; read ${visited.length} aggregate nodes.`);
        } else if (op === "Range sum") {
          const q = segmentQuery(values, l, r);
          visited = q.visited;
          setMessage(`Sum [${l},${r}] = ${q.sum}.`);
        } else {
          const k = Math.floor(Math.log2(r - l + 1));
          visited = [`${k}-${l}`, `${k}-${r - (1 << k) + 1}`];
          setMessage(
            `Minimum [${l},${r}] = ${Math.min(...values.slice(l, r + 1))}; combine two overlapping power-of-two intervals.`,
          );
        }
      }
    } else if (name === "Matrix") {
      const index = v * 4 + args[1];
      if (
        !Number.isInteger(v) ||
        !Number.isInteger(args[1]) ||
        v < 0 ||
        args[1] < 0 ||
        args[1] > 3 ||
        index >= values.length
      ) {
        setMessage("Enter row, column (four columns, zero-based).");
        return;
      }
      visited = [String(index)];
      if (op === "Update cell") {
        if (!Number.isFinite(args[2])) {
          setMessage("Enter row, column, value.");
          return;
        }
        next[index] = args[2];
        setValues(next);
        setMessage(`Updated [${v},${args[1]}] in O(1).`);
      } else setMessage(`Cell [${v},${args[1]}] = ${values[index]}. O(1) indexed access.`);
    } else if (op === "Find") {
      if (!Number.isFinite(v)) {
        setMessage("Enter a numeric value.");
        return;
      }
      if (name === "Binary search tree") {
        const result = searchBST(values, v);
        visited = result.visited;
        setMessage(
          `${result.found ? "Found" : "Did not find"} ${v} after ${visited.length} comparisons. O(h).`,
        );
      } else {
        const candidates =
          name === "Hash table" || name === "Hash set"
            ? values
                .map((x, i) => ({ x, i }))
                .filter(({ x }) => ((x % 7) + 7) % 7 === ((v % 7) + 7) % 7)
            : values.map((x, i) => ({ x, i }));
        for (const item of candidates) {
          visited.push(String(item.i));
          if (item.x === v) break;
        }
        setMessage(
          values.includes(v)
            ? `Found ${v}; visited ${visited.length} element(s).`
            : `${v} is absent; visited ${visited.length} element(s).`,
        );
      }
    } else if (
      ["Pop", "Pop back", "Pop front", "Dequeue", "Extract min", "Peek", "Delete"].includes(op)
    ) {
      if (!next.length) {
        setMessage("The structure is empty.");
        return;
      }
      const index =
        op === "Delete"
          ? next.indexOf(v)
          : ["Pop front", "Dequeue", "Extract min"].includes(op)
            ? 0
            : op === "Peek" && name !== "Stack"
              ? 0
              : next.length - 1;
      if (index < 0) {
        setMessage("Value not found.");
        return;
      }
      visited = [String(index)];
      setMessage(
        `${op === "Peek" ? "Peeked" : "Removed"} ${next[index]}. ${name === "Binary search tree" ? "This view rebuilds the BST from remaining insertion order." : ""}`,
      );
      if (op !== "Peek") {
        if (op === "Extract min") next = heapPop(next);
        else next.splice(index, 1);
        setValues(next);
      }
    } else {
      if (!Number.isFinite(v) || !Number.isInteger(v) || Math.abs(v) > 9999) {
        setMessage("Enter an integer between −9,999 and 9,999.");
        return;
      }
      if (next.length >= (name === "Circular queue" ? 12 : 16)) {
        setMessage("Visual capacity reached. Remove an element first.");
        return;
      }
      if (name === "Hash set" && next.includes(v)) {
        setMessage("The set already contains this key.");
        return;
      }
      if (op === "Push front") next.unshift(v);
      else next.push(v);
      if (name === "Binary heap") next = heapify(next);
      setValues(next);
      visited = [String(next.indexOf(v))];
      setMessage(
        `Inserted ${v}. ${name === "Binary heap" ? "Sifted upward to restore min-heap order." : ""}`,
      );
    }
    setTrace(visited);
    setStep(0);
    setPlaying(visited.length > 1);
  };
  const active = new Set(trace.slice(0, step + 1));
  return (
    <section className="panel structure-studio" id="data-structure-explorer">
      <div className="panel-heading">
        <div>
          <h2>
            <Layers size={18} />
            Data structures, in motion
          </h2>
          <p>Inspect storage, follow an operation, and see why its cost changes.</p>
        </div>
        <select
          aria-label="Explore data structure"
          value={name}
          onChange={(e) => select(e.target.value)}
        >
          {STRUCTURES.map((s) => (
            <option key={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="studio-intro">
        <p>
          {structure.description} <span>{structure.notes}</span>
        </p>
        <div>
          {[
            ["Access", structure.access],
            ["Search", structure.search],
            ["Insert", structure.insert],
            ["Delete", structure.remove],
          ].map(([k, v]) => (
            <span key={k}>
              {k}
              <b>{v}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="studio-controls">
        <label>
          {name === "Trie" ? "Words" : "Initial values"}
          <input
            aria-label="Structure initial values"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        <button className="button secondary small" onClick={load}>
          <RotateCcw size={13} />
          Load values
        </button>
        <select
          aria-label="Structure operation"
          value={operations.includes(operation) ? operation : operations[0]}
          onChange={(e) => setOperation(e.target.value)}
        >
          {operations.map((op) => (
            <option key={op}>{op}</option>
          ))}
        </select>
        <input
          aria-label="Operation arguments"
          value={argument}
          onChange={(e) => setArgument(e.target.value)}
          placeholder="value or index, value"
        />
        <button className="button primary small" onClick={execute}>
          <Play size={13} />
          Apply
        </button>
      </div>
      <div className="structure-canvas">
        <svg
          style={{ minWidth: Math.max(650, ...view.nodes.map((n) => n.x + 50)) }}
          viewBox={`0 0 ${Math.max(760, ...view.nodes.map((n) => n.x + 50))} ${view.height}`}
          role="img"
          aria-label={`${name} visualization`}
        >
          {view.edges.map((e, i) => {
            const a = view.nodes.find((n) => n.id === e.from),
              b = view.nodes.find((n) => n.id === e.to);
            return a && b ? (
              <g key={i}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={active.has(e.to) ? "#9d84d4" : "#dcd3e9"}
                  strokeWidth={2}
                />
                {e.label && (
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2 - 7}
                    textAnchor="middle"
                    fill="#9a80b8"
                    fontSize={13}
                  >
                    {e.label}
                  </text>
                )}
              </g>
            ) : null;
          })}
          {view.nodes.map((n) => (
            <g key={n.id}>
              <rect
                x={n.x - 24}
                y={n.y - 18}
                width={48}
                height={36}
                rx={name.includes("tree") || name === "Graph" ? 18 : 7}
                fill={active.has(n.id) ? "#7962ce" : "#f4effa"}
                stroke={active.has(n.id) ? "#7962ce" : "#d9cee9"}
              />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fontSize={12}
                fill={active.has(n.id) ? "white" : "#745c93"}
              >
                {n.label}
              </text>
              {n.detail && (
                <text x={n.x} y={n.y + 32} textAnchor="middle" fontSize={9} fill="#a08eaf">
                  {n.detail}
                </text>
              )}
            </g>
          ))}
        </svg>
        {!view.nodes.length && (
          <p className="benchmark-empty">Empty structure. Insert a value or load an example.</p>
        )}
      </div>
      <div className="studio-trace">
        <p role="status">{message}</p>
        {trace.length > 0 && (
          <>
            <button className="button secondary small" onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play trace"}
            </button>
            <button
              aria-label="Next operation step"
              className="icon-button"
              onClick={() => {
                setPlaying(false);
                setStep(Math.min(trace.length - 1, step + 1));
              }}
            >
              <SkipForward size={16} />
            </button>
            <span>
              {step + 1}/{trace.length}
            </span>
          </>
        )}
      </div>
      <div className="studio-footer">
        <span>
          Visual storage uses small inputs. Library complexity describes the data structure, not UI
          rendering.
        </span>
        <select
          aria-label="Structure code language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <button
          className="text-button"
          onClick={() => onAdd(structureAlgorithm(structure, language))}
        >
          Add {language} example
          <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}
