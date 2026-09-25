"use client";
import { useRef, useState } from "react";
import { Activity, Download, LoaderCircle, Play } from "lucide-react";
import { Algorithm, CASES, Case, compact } from "@/lib/algorithms";
import {
  BenchmarkState,
  BenchmarkPoint,
  empiricalFit,
  generatedInput,
  parseSizes,
} from "@/lib/benchmark";
import { detectEntrypoint, isFunctionSubmission } from "@/lib/submissions";
export default function Benchmarks({
  algorithms,
  value,
  onChange,
}: {
  algorithms: Algorithm[];
  value?: BenchmarkState;
  onChange: (v: BenchmarkState) => void;
}) {
  const [sizes, setSizes] = useState("100, 1000, 5000"),
    [reps, setReps] = useState(3),
    [template, setTemplate] = useState("{{n}}\n{{values}}\n{{target}}"),
    [seed, setSeed] = useState(42),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [progress, setProgress] = useState(""),
    [mode, setMode] = useState<Case | "all">("all");
  const stop = useRef(false);
  const signature = JSON.stringify(
      algorithms.map((a) => ({ id: a.id, code: a.code, language: a.language })),
    ),
    stale = value && value.signature !== signature;
  const run = async () => {
    setBusy(true);
    setError("");
    stop.current = false;
    try {
      const ns = parseSizes(sizes);
      const state: BenchmarkState = {
        signature,
        createdAt: new Date().toISOString(),
        points: [],
        sizes: ns,
        repetitions: reps,
        template,
        seed,
      };
      onChange({ ...state });
      let done = 0;
      const count = algorithms.length * ns.length * 3;
      for (const a of algorithms) {
        for (const c of CASES) {
          for (const n of ns) {
            if (stop.current) break;
            setProgress(`${a.name} · ${c} · n=${n.toLocaleString()} (${++done}/${count})`);
            const stdin = generatedInput(n, c, seed, template);
            const entrypoint = isFunctionSubmission({ ...a, stdin })
              ? detectEntrypoint(a.code, a.language)
              : undefined;
            const response = await fetch("/api/run", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: a.code,
                language: a.language,
                stdin,
                entrypoint,
                repetitions: reps,
                timeout: 2,
              }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            state.points.push({
              algorithmId: a.id,
              name: a.name,
              color: a.color,
              n,
              case: c,
              medianMs: result.durationMs,
              minMs: result.minMs ?? result.durationMs,
              maxMs: result.maxMs ?? result.durationMs,
              samplesMs: result.samplesMs || [],
              status: result.status,
            });
            onChange({ ...state, points: [...state.points] });
            if (result.status !== "ok") break;
          }
          if (stop.current) break;
        }
        if (stop.current) break;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  };
  const points = value?.points || [],
    visible = points.filter((p) => mode === "all" || p.case === mode),
    ok = visible.filter((p) => p.status === "ok");
  const W = 900,
    H = 300,
    L = 65,
    R = 25,
    T = 20,
    B = 40;
  const maxN = Math.max(10, ...points.map((p) => p.n)),
    maxMs = Math.max(1, ...ok.map((p) => p.maxMs)) * 1.12;
  const x = (n: number) => L + (Math.log10(n) / Math.log10(maxN)) * (W - L - R),
    y = (ms: number) => T + (H - T - B) * (1 - ms / maxMs);
  const groups = [...new Set(points.map((p) => p.algorithmId))];
  const exportCsv = () => {
    const rows = [
      "algorithm,case,n,status,median_ms,min_ms,max_ms,samples_ms",
      ...points.map((p) =>
        [
          JSON.stringify(p.name),
          p.case,
          p.n,
          p.status,
          p.medianMs,
          p.minMs,
          p.maxMs,
          JSON.stringify(p.samplesMs.join(";")),
        ].join(","),
      ),
    ];
    const u = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = u;
    a.download = "algovisual-benchmarks.csv";
    a.click();
    URL.revokeObjectURL(u);
  };
  return (
    <section className="panel benchmark-panel">
      <div className="panel-heading">
        <div>
          <h2>
            <Activity size={18} />
            Measure how it grows
          </h2>
          <p>Real execution across input sizes · median and variation from repeated runs</p>
        </div>
        <button className="button primary small" disabled={busy} onClick={run}>
          {busy ? <LoaderCircle size={15} className="spin" /> : <Play size={14} />}Run benchmark
        </button>
      </div>
      <div className="benchmark-controls">
        <label>
          Input sizes
          <input
            aria-label="Benchmark input sizes"
            disabled={busy}
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
          />
        </label>
        <label>
          Runs per point
          <select
            aria-label="Benchmark repetitions"
            disabled={busy}
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
          >
            {[1, 3, 5, 7].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Seed
          <input
            type="number"
            aria-label="Benchmark seed"
            disabled={busy}
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
          />
        </label>
      </div>
      <details className="benchmark-template">
        <summary>Input generator and method arguments</summary>
        <p>
          Best: ascending values and first target. Average: seeded shuffle and a middle-position
          target. Worst: reverse order and missing target. These are distributions to test, not
          guaranteed cases for every algorithm. Binary search requires sorted input; use{" "}
          {"{{sorted}}"}.
        </p>
        <textarea
          aria-label="Benchmark input template"
          disabled={busy}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
        <p>
          Tokens: {"{{n}}, {{values}}, {{json}}, {{sorted}}, {{target}}"}. For method submissions
          use {"[{{json}},{{target}}]"}. For data-structure batch programs use the default array
          format.
        </p>
      </details>
      {busy && (
        <div className="run-progress">
          <LoaderCircle size={15} className="spin" />
          {progress}
          <button
            onClick={() => {
              stop.current = true;
            }}
          >
            Stop after this point
          </button>
        </div>
      )}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {stale && (
        <div className="analysis-notes">
          Code changed since this benchmark. Results below belong to the saved source snapshot;
          rerun to measure the current code.
        </div>
      )}
      {points.length > 0 ? (
        <>
          <div className="graph-toolbar">
            <div className="segmented">
              {(["all", ...CASES] as const).map((c) => (
                <button key={c} className={mode === c ? "chosen" : ""} onClick={() => setMode(c)}>
                  {c === "all" ? "All cases" : `${c} case`}
                </button>
              ))}
            </div>
            <button className="text-button" onClick={exportCsv}>
              <Download size={14} />
              Export CSV
            </button>
          </div>
          <div className="measured-chart-scroll">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Measured benchmark growth curves">
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <g key={f}>
                  <line
                    x1={L}
                    x2={W - R}
                    y1={y(maxMs * f)}
                    y2={y(maxMs * f)}
                    stroke="#ece7f2"
                    strokeDasharray="4 5"
                  />
                  <text x={L - 10} y={y(maxMs * f) + 4} textAnchor="end" className="axis-label">
                    {(maxMs * f).toFixed(1)} ms
                  </text>
                </g>
              ))}
              {(value?.sizes || []).map((n) => (
                <text key={n} x={x(n)} y={H - 15} textAnchor="middle" className="axis-label">
                  {compact(n)}
                </text>
              ))}
              {groups.flatMap((id) =>
                CASES.filter((c) => mode === "all" || mode === c).map((c) => {
                  const ps = ok
                    .filter((p) => p.algorithmId === id && p.case === c)
                    .sort((a, b) => a.n - b.n);
                  return (
                    <g key={id + c}>
                      <path
                        d={ps.map((p, i) => `${i ? "L" : "M"}${x(p.n)},${y(p.medianMs)}`).join(" ")}
                        fill="none"
                        stroke={ps[0]?.color}
                        strokeWidth={2}
                        strokeDasharray={c === "best" ? "3 5" : c === "worst" ? "8 4" : undefined}
                      />
                      {ps.map((p) => (
                        <g key={p.n}>
                          <line
                            x1={x(p.n)}
                            x2={x(p.n)}
                            y1={y(p.minMs)}
                            y2={y(p.maxMs)}
                            stroke={p.color}
                            strokeWidth={3}
                            opacity={0.25}
                          />
                          <circle cx={x(p.n)} cy={y(p.medianMs)} r={4} fill={p.color}>
                            <title>
                              {p.name} / {c} / n={p.n}: {p.medianMs.toFixed(3)} ms; range{" "}
                              {p.minMs.toFixed(3)}–{p.maxMs.toFixed(3)} ms
                            </title>
                          </circle>
                        </g>
                      ))}
                    </g>
                  );
                }),
              )}
            </svg>
          </div>
          <div className="chart-legend">
            {groups.map((id) => {
              const p = points.find((p) => p.algorithmId === id)!;
              return (
                <span key={id}>
                  <i style={{ background: p.color }} />
                  {p.name}
                </span>
              );
            })}
            <span>··· best　— average　– – worst</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ALGORITHM / CASE</th>
                  <th>POINTS</th>
                  <th>EMPIRICAL TREND</th>
                  <th>MEASURED TIME AT LARGEST n</th>
                </tr>
              </thead>
              <tbody>
                {groups.flatMap((id) =>
                  CASES.map((c) => {
                    const ps = points.filter((p) => p.algorithmId === id && p.case === c);
                    if (!ps.length) return null;
                    const fit = empiricalFit(ps),
                      last = ps[ps.length - 1];
                    return (
                      <tr key={id + c}>
                        <td>
                          {last.name}
                          <small className="table-language">{c}</small>
                        </td>
                        <td>{ps.length}</td>
                        <td title={fit.note}>
                          {fit.label}
                          <small className="status-caption">
                            {fit.r2 > 0 ? `R² = ${fit.r2.toFixed(3)}` : fit.note}
                          </small>
                        </td>
                        <td>
                          {last.status === "ok"
                            ? `${last.medianMs.toFixed(3)} ms at n=${compact(last.n)}`
                            : last.status.toUpperCase()}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="benchmark-empty">
          Your measured curves will appear here. Every algorithm receives identical generated inputs
          at each size.
        </div>
      )}
      <div className="table-footnote">
        Measured process time includes runtime startup. Error bars show min–max; lines connect
        medians, not predictions. Timeouts stop larger inputs for that algorithm/case. Measured n is
        capped at 20,000; theoretical exploration still supports 10⁹.
      </div>
    </section>
  );
}
