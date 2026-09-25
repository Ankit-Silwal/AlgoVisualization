"use client";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Braces,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  Database,
  FlaskConical,
  FolderOpen,
  GitCompareArrows,
  Layers,
  LoaderCircle,
  Play,
  Plus,
  Save,
  Search,
  Settings2,
  Sparkles,
  Terminal,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import ComplexityChart from "./complexity-chart";
import TestCases from "./test-cases";
import Benchmarks from "./benchmarks";
import Account from "./account";
import StructureStudio from "./structure-studio";
import type { BenchmarkState } from "@/lib/benchmark";
import type { TestState } from "@/lib/experiment-state";
import {
  Algorithm,
  Analysis,
  Case,
  CASES,
  COLORS,
  Complexity,
  LABELS,
  PRESETS,
  compact,
  crossover,
  formatTime,
  runtime,
  maxInputWithinBudget,
} from "@/lib/algorithms";
import { codeFor, LANGUAGES, Language, STRUCTURES, structureAlgorithm } from "@/lib/library";
import { Experiment, experimentSchema } from "@/lib/schema";
type Modal = "add" | "library" | "saved" | "guide" | "save" | null;
type Saved = { id: string; name: string; createdAt: string; data: Experiment };
const caseNames = {
  best: "Best case",
  average: "Average case",
  worst: "Worst case",
  all: "All cases",
};
export default function Workspace() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>(() =>
    PRESETS.slice(0, 3).map((a) => structuredClone(a)),
  );
  const [selected, setSelected] = useState("insertion");
  const [n, setN] = useState(1000);
  const [mode, setMode] = useState<Case | "all">("all");
  const [rate, setRate] = useState(1e8);
  const [timeLimit, setTimeLimit] = useState(1);
  const [logScale, setLogScale] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [customCode, setCustomCode] = useState("");
  const [customName, setCustomName] = useState("");
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [libraryTab, setLibraryTab] = useState("algorithms");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [saveName, setSaveName] = useState("Sorting: small inputs, big differences");
  const [settings, setSettings] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkState>();
  const [testState, setTestState] = useState<TestState>();
  const [loadKey, setLoadKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const active = algorithms.find((a) => a.id === selected) || algorithms[0];
  const focusedCase = mode === "all" ? "average" : mode;
  const ranked = [...algorithms].sort(
    (a, b) => runtime(a, n, focusedCase, rate) - runtime(b, n, focusedCase, rate),
  );
  const crossing =
    algorithms.length > 1 ? crossover(algorithms[0], algorithms[1], focusedCase, rate) : null;
  const tleCount = algorithms.filter(
    (a) => runtime(a, n, focusedCase, rate) > timeLimit * 1000,
  ).length;
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setN((value) => {
          if (value >= 1e9) {
            setPlaying(false);
            return 1e9;
          }
          return Math.min(1e9, Math.max(value + 1, Math.round(value * 1.14)));
        }),
      140,
    );
    return () => clearInterval(t);
  }, [playing]);
  useEffect(() => {
    if (!modal) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", listener);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = prev;
    };
  }, [modal]);
  const open = (value: Modal) => {
    setError("");
    setAnalysis(null);
    setModal(value);
  };
  const update = (patch: Partial<Algorithm>) =>
    setAlgorithms((list) => list.map((a) => (a.id === active.id ? { ...a, ...patch } : a)));
  const snapshot = (): Experiment => ({
    name: saveName,
    algorithms,
    n,
    caseMode: mode,
    rate,
    timeLimit,
    tests: testState,
    benchmark,
  });
  const load = (data: Experiment) => {
    setAlgorithms(data.algorithms);
    setSelected(data.algorithms[0].id);
    setN(data.n);
    setMode(data.caseMode);
    setRate(data.rate);
    setTimeLimit(data.timeLimit);
    setSaveName(data.name);
    setTestState(data.tests);
    setBenchmark(data.benchmark);
    setLoadKey((k) => k + 1);
    setModal(null);
    setPlaying(false);
    setToast("Experiment loaded");
  };
  const add = (a: Algorithm) => {
    if (algorithms.length >= 6) {
      setError("You can compare up to 6 algorithms. Remove one to add another.");
      return;
    }
    const id = `${a.id}-${Date.now()}`;
    setAlgorithms((list) => [
      ...list,
      {
        ...a,
        id,
        color: COLORS.find((c) => !list.some((v) => v.color === c)) || COLORS[list.length % 6],
      },
    ]);
    setSelected(id);
    setModal(null);
    setAnalysis(null);
    setToast(`${a.name} added to comparison`);
  };
  const analyze = async (isNew = false) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: isNew ? customCode : active.code,
          name: isNew ? customName : active.name,
          language: isNew ? language : active.language,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAnalysis(result);
      if (!isNew) {
        update({ ...result.algorithm, id: active.id, color: active.color });
        setToast(
          result.confidence === "preset"
            ? "Library implementation recognized"
            : "Suggested models updated. Review the assumptions below.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const showSaved = async () => {
    open("saved");
    setBusy(true);
    try {
      const r = await fetch("/api/experiments");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setSaved(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot()),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setModal(null);
      setToast("Experiment saved to PostgreSQL");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "algovisual-experiment.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Experiment exported as JSON");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand">
          <span className="brand-icon">
            <Activity size={24} />
          </span>
          <span>
            algo<span className="brand-light">visual</span>
            <i />
          </span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav>
          <button
            className="nav-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <GitCompareArrows size={18} />
            Compare algorithms
            <span className="nav-dot" />
          </button>
          <button
            className="nav-item"
            onClick={() => {
              setLibraryTab("algorithms");
              open("library");
            }}
          >
            <Braces size={18} />
            Algorithm library<span className="nav-count">6</span>
          </button>
          <button
            className="nav-item"
            onClick={() => {
              setLibraryTab("structures");
              open("library");
            }}
          >
            <Layers size={18} />
            Data structures<span className="nav-count">{STRUCTURES.length}</span>
          </button>
          <button className="nav-item" onClick={showSaved}>
            <FolderOpen size={18} />
            Saved experiments
          </button>
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label">KEEP EXPLORING</div>
        <button className="nav-item" onClick={() => open("guide")}>
          <BookOpen size={18} />
          How it works
          <ArrowUpRight size={14} className="push-right" />
        </button>
        <div className="sidebar-bottom">
          <div className="learning-card">
            <span className="little-spark">
              <Sparkles size={17} />
            </span>
            <h3>
              Small inputs.
              <br />
              Big discoveries.
            </h3>
            <p>
              Big O tells part of the story.
              <br />
              Find out what happens in between.
            </p>
            <button
              onClick={() => {
                setN(20);
                setMode("average");
                setToast("Try moving n from 20 to 1,000 and watch the winner change.");
              }}
            >
              Try a small input <ArrowRight size={14} />
            </button>
          </div>
          <div className="local-profile">
            <span>AV</span>
            <div>
              <strong>Your playground</strong>
              <small>Built for curious minds</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>
            <strong>Compare algorithms</strong>
          </div>
          <div className="topbar-right">
            <span className="version-badge">DSA, made visible</span>
            <button className="icon-button" aria-label="Help" onClick={() => open("guide")}>
              <CircleHelp size={19} />
            </button>
            <Account />
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> THE ALGORITHM PLAYGROUND
              </div>
              <h1>
                See beyond <span>Big O.</span>
              </h1>
              <p>Compare your code. Explore every case. Get a feel for what scales.</p>
            </div>
            <button className="button secondary" onClick={() => open("save")}>
              <Save size={15} />
              Save experiment
            </button>
          </div>
          <div className="intro-note">
            <span className="note-icon">
              <FlaskConical size={17} />
            </span>
            <p>
              A little theory. A lot of discovery.{" "}
              <span>Add algorithms and move the slider to see how they compare.</span>
            </p>
            <button onClick={() => open("guide")}>
              A quick tour <ArrowRight size={14} />
            </button>
          </div>
          <section className="algorithm-section">
            <div className="section-title">
              <h2>
                Your comparison <span className="count-pill">{algorithms.length} / 6</span>
              </h2>
              <button
                className="text-button"
                onClick={() => {
                  setLibraryTab("algorithms");
                  open("library");
                }}
              >
                Browse library <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="algorithm-cards">
              {algorithms.map((a, i) => (
                <div
                  role="button"
                  tabIndex={0}
                  key={a.id}
                  className={`algorithm-card ${active.id === a.id ? "selected" : ""}`}
                  style={{ "--algo-color": a.color } as React.CSSProperties}
                  onClick={() => setSelected(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(a.id);
                    }
                  }}
                >
                  <div className="algorithm-card-top">
                    <span className="algo-symbol">
                      <Code2 size={18} />
                    </span>
                    <span className="algo-number">ALGORITHM {String(i + 1).padStart(2, "0")}</span>
                    {algorithms.length > 1 && (
                      <button
                        className="remove-button"
                        aria-label={`Remove ${a.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlgorithms((list) => list.filter((v) => v.id !== a.id));
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <h3>{a.name}</h3>
                  <div className="algo-card-bottom">
                    <span className="complexity-pill">{LABELS[a.model[focusedCase]]}</span>
                    <span>
                      {a.language}
                      <i style={{ background: a.color }} />
                    </span>
                  </div>
                </div>
              ))}
              {algorithms.length < 6 && (
                <button
                  className="add-card"
                  onClick={() => {
                    setCustomName("");
                    setCustomCode("");
                    open("add");
                  }}
                >
                  <span>
                    <Plus size={22} />
                  </span>
                  <strong>Add algorithm</strong>
                  <small>Paste code or pick a preset</small>
                </button>
              )}
            </div>
          </section>
          <section className="panel graph-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <BarChart3 size={18} />
                  Performance at a glance
                </h2>
                <p>Estimated execution time as your input grows</p>
              </div>
              <div className="graph-actions">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={logScale}
                    onChange={(e) => setLogScale(e.target.checked)}
                  />
                  <span className="toggle" />
                  Log time scale
                </label>
                <button className="icon-button" aria-label="Export experiment" onClick={download}>
                  <ArrowDownToLine size={17} />
                </button>
              </div>
            </div>
            <div className="graph-toolbar">
              <div className="segmented" role="group" aria-label="Case selection">
                {(["all", ...CASES] as const).map((c) => (
                  <button key={c} onClick={() => setMode(c)} className={mode === c ? "chosen" : ""}>
                    {c === "all" && <Layers size={13} />} {caseNames[c]}
                  </button>
                ))}
              </div>
              <span className="estimate-badge">
                <span /> MODEL ESTIMATES
              </span>
            </div>
            <div className="chart-axis-title">EXECUTION TIME</div>
            <ComplexityChart
              algorithms={algorithms}
              n={n}
              mode={mode}
              rate={rate}
              timeLimit={timeLimit}
              logScale={logScale}
            />
            <div className="chart-legend">
              <div>
                {algorithms.map((a) => (
                  <span key={a.id}>
                    <i style={{ background: a.color }} />
                    {a.name}
                  </span>
                ))}
              </div>
              {mode === "all" && (
                <div className="case-legend">
                  <span>
                    <b className="line-sample dotted" />
                    Best
                  </span>
                  <span>
                    <b className="line-sample" />
                    Average
                  </span>
                  <span>
                    <b className="line-sample dashed" />
                    Worst
                  </span>
                </div>
              )}
            </div>
            <div className="input-control">
              <div className="input-heading">
                <div>
                  <h3>
                    Make the input your own <span>n</span>
                  </h3>
                  <p>Small or huge. Watch the trade-offs change in real time.</p>
                </div>
                <div className="n-controls">
                  <button
                    className={`icon-button play-button ${playing ? "playing" : ""}`}
                    onClick={() => {
                      if (n >= 1e9) setN(1);
                      setPlaying(!playing);
                    }}
                    aria-label={playing ? "Pause animation" : "Animate input size"}
                  >
                    {playing ? <span>Ⅱ</span> : <Play size={15} />}
                  </button>
                  <label className="n-input">
                    <span>n =</span>
                    <input
                      aria-label="Input size"
                      type="number"
                      min={1}
                      max={1e9}
                      value={n}
                      onChange={(e) => {
                        setPlaying(false);
                        setN(Math.max(1, Math.min(1e9, Math.round(Number(e.target.value) || 1))));
                      }}
                    />
                  </label>
                </div>
              </div>
              <input
                aria-label="Input size slider"
                className="range-slider"
                type="range"
                min="0"
                max="9"
                step="0.005"
                value={Math.log10(n)}
                style={
                  { "--range-progress": `${(Math.log10(n) / 9) * 100}%` } as React.CSSProperties
                }
                onChange={(e) => {
                  setPlaying(false);
                  setN(Math.round(10 ** Number(e.target.value)));
                }}
              />
              <div className="range-labels">
                {[1, 100, 10000, 1000000, 1e9].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setN(v);
                      setPlaying(false);
                    }}
                  >
                    {compact(v)}
                    {v === 1e9 && " (10⁹)"}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <div className="insight-grid">
            <div className="insight-card">
              <span className="insight-icon green">
                <Zap size={19} />
              </span>
              <div>
                <span className="metric-label">FASTEST AT n = {compact(n)}</span>
                <h3>
                  {ranked[0].name}{" "}
                  <span className="green-text">
                    {formatTime(runtime(ranked[0], n, focusedCase, rate))}
                  </span>
                </h3>
                <p>
                  {caseNames[focusedCase]} estimate · {LABELS[ranked[0].model[focusedCase]]}
                </p>
              </div>
            </div>
            <div className="insight-card">
              <span className="insight-icon purple">
                <GitCompareArrows size={19} />
              </span>
              <div>
                <span className="metric-label">CROSSOVER POINT</span>
                <h3>
                  {crossing ? (
                    <>
                      Around n ≈ {compact(crossing)}
                      <span className="soft-tag">model-based</span>
                    </>
                  ) : (
                    "No crossover found"
                  )}
                </h3>
                <p>
                  {algorithms.length > 1
                    ? `${algorithms[0].name} vs. ${algorithms[1].name}`
                    : "Add another algorithm to compare"}
                </p>
              </div>
            </div>
            <div className="insight-card">
              <span className={`insight-icon ${tleCount ? "red" : "amber"}`}>
                <Clock3 size={19} />
              </span>
              <div>
                <span className="metric-label">
                  TIME LIMIT · {timeLimit} SECOND{timeLimit !== 1 ? "S" : ""}
                </span>
                <h3>
                  {tleCount ? `${tleCount} estimated TLE` : "All within the limit"}
                  <span className={`status-dot ${tleCount ? "danger" : ""}`} />
                </h3>
                <p>
                  {compact(rate * timeLimit)} operation budget ·{" "}
                  {caseNames[focusedCase].toLowerCase()}
                </p>
              </div>
            </div>
          </div>
          <section className="panel comparison-panel">
            <div className="panel-heading">
              <div>
                <h2>The whole picture</h2>
                <p>Every algorithm. Every case. At n = {n.toLocaleString()}.</p>
              </div>
              <button
                className={`button small ${settings ? "secondary" : "ghost"}`}
                onClick={() => setSettings(!settings)}
              >
                <Settings2 size={15} />
                Model settings
                <ChevronDown size={13} />
              </button>
            </div>
            {settings && (
              <div className="settings-row">
                <label>
                  Operations per second
                  <input
                    type="number"
                    value={rate}
                    min={1}
                    max={1e12}
                    onChange={(e) =>
                      setRate(Math.max(1, Math.min(1e12, Number(e.target.value) || 1)))
                    }
                  />
                </label>
                <label>
                  Time limit (seconds)
                  <input
                    type="number"
                    step="0.1"
                    min="0.001"
                    max={3600}
                    value={timeLimit}
                    onChange={(e) =>
                      setTimeLimit(Math.max(0.001, Math.min(3600, Number(e.target.value) || 1)))
                    }
                  />
                </label>
                <p>
                  Budget = speed × time limit. With 10⁸ ops/sec and 1 second, a cost-1 O(n²) model
                  fits up to n ≈ 10,000. Constants change that threshold.
                </p>
              </div>
            )}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ALGORITHM</th>
                    {CASES.map((c) => (
                      <th key={c}>{caseNames[c].toUpperCase()}</th>
                    ))}
                    <th>SPACE</th>
                    <th>MAX n IN BUDGET</th>
                    <th>EST. STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {algorithms.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="table-algo">
                          <i style={{ background: a.color }} />
                          {a.name}
                        </span>
                        <small className="table-language">
                          {a.language} ·{" "}
                          {a.origin === "preset"
                            ? "Library model"
                            : a.origin === "manual"
                              ? "Custom model"
                              : "Needs review"}
                        </small>
                      </td>
                      {CASES.map((c) => (
                        <td key={c} title={a.conditions[c]}>
                          <strong>{formatTime(runtime(a, n, c, rate))}</strong>
                          <span className="table-complexity">
                            {LABELS[a.model[c]]}
                            {runtime(a, n, c, rate) > timeLimit * 1000 && <em>TLE</em>}
                          </span>
                        </td>
                      ))}
                      <td>
                        <span className="space-badge">{a.space}</span>
                      </td>
                      <td>
                        <strong>
                          {maxInputWithinBudget(a, focusedCase, rate, timeLimit) === 1e9
                            ? "≥ 1B"
                            : compact(maxInputWithinBudget(a, focusedCase, rate, timeLimit))}
                        </strong>
                        <small className="status-caption">{focusedCase} case estimate</small>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${runtime(a, n, focusedCase, rate) > timeLimit * 1000 ? "tle" : "pass"}`}
                        >
                          {runtime(a, n, focusedCase, rate) > timeLimit * 1000 ? (
                            <Clock3 size={12} />
                          ) : (
                            <Check size={12} />
                          )}{" "}
                          {runtime(a, n, focusedCase, rate) > timeLimit * 1000
                            ? "Est. TLE"
                            : "Within limit"}
                        </span>
                        <small className="status-caption">{focusedCase} case</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footnote">
              <CircleHelp size={13} />
              Estimates illustrate growth, not hardware benchmarks. Run your actual test cases below
              to measure program execution.
            </div>
          </section>
          <section className="panel code-panel" ref={editorRef}>
            <div className="panel-heading">
              <div>
                <h2>
                  <Code2 size={18} />
                  Under the hood
                </h2>
                <p>Your code, your assumptions. Edit either to explore.</p>
              </div>
              <button className="button secondary small" onClick={() => analyze()} disabled={busy}>
                {busy ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />}Analyze
                code
              </button>
            </div>
            <div className="editor-tabs">
              {algorithms.map((a) => (
                <button
                  key={a.id}
                  className={a.id === active.id ? "selected" : ""}
                  onClick={() => {
                    setSelected(a.id);
                    setAnalysis(null);
                    setError("");
                  }}
                >
                  <i style={{ background: a.color }} />
                  {a.name}
                </button>
              ))}
            </div>
            <div className="editor-body">
              <div className="code-side">
                <div className="code-toolbar">
                  <span>
                    <Terminal size={13} />
                    {active.name.toLowerCase().replaceAll(" ", "_")}
                    {active.language === "Python"
                      ? ".py"
                      : active.language === "Java"
                        ? ".java"
                        : active.language === "C"
                          ? ".c"
                          : ".js"}
                  </span>
                  <select
                    aria-label="Code language"
                    value={active.language}
                    onChange={(e) => {
                      update({ language: e.target.value, origin: "manual" });
                      setToast("Language changed. Update the source code to match.");
                    }}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="code-input-wrap">
                  <div className="line-numbers" aria-hidden="true">
                    {active.code.split("\n").map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  <textarea
                    spellCheck={false}
                    aria-label={`${active.name} source code`}
                    value={active.code}
                    onChange={(e) => update({ code: e.target.value, origin: "manual" })}
                    maxLength={30000}
                  />
                </div>
              </div>
              <div className="model-side">
                <div className="model-caption">
                  <span className="soft-tag">
                    {active.origin === "preset" ? "LIBRARY MODEL" : "EDITABLE MODEL"}
                  </span>
                  <Braces size={15} />
                </div>
                <h3>What shapes this curve?</h3>
                <p>{active.explanation}</p>
                <div className="model-column-head">
                  <span>Case / growth</span>
                  <span>Cost factor</span>
                </div>
                {CASES.map((c) => (
                  <div className="model-row" key={c}>
                    <label>
                      {caseNames[c]}
                      <select
                        aria-label={`${caseNames[c]} complexity`}
                        value={active.model[c]}
                        onChange={(e) =>
                          update({
                            model: { ...active.model, [c]: e.target.value as Complexity },
                            origin: "manual",
                          })
                        }
                      >
                        {Object.entries(LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      aria-label={`${caseNames[c]} cost factor`}
                      type="number"
                      min="0.0001"
                      max="1000000"
                      step="0.1"
                      value={active.factors[c]}
                      onChange={(e) =>
                        update({
                          factors: {
                            ...active.factors,
                            [c]: Math.max(0.0001, Math.min(1e6, Number(e.target.value) || 1)),
                          },
                          origin: "manual",
                        })
                      }
                    />
                  </div>
                ))}
                <details>
                  <summary>Input conditions & overhead</summary>
                  {CASES.map((c) => (
                    <p key={c}>
                      <strong>{caseNames[c]}:</strong> {active.conditions[c]}
                    </p>
                  ))}
                  <label className="overhead-label">
                    Fixed overhead (operations)
                    <input
                      aria-label="Fixed overhead"
                      type="number"
                      value={active.overhead}
                      min={0}
                      max={1e9}
                      onChange={(e) =>
                        update({
                          overhead: Math.max(0, Math.min(1e9, Number(e.target.value) || 0)),
                          origin: "manual",
                        })
                      }
                    />
                  </label>
                </details>
              </div>
            </div>
            {analysis && !modal && (
              <div className="analysis-notes">
                <strong>
                  {analysis.confidence === "preset"
                    ? "Reviewed implementation"
                    : "Heuristic analysis — review required"}
                </strong>
                {analysis.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            )}
            {error && !modal && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
          </section>
          <TestCases
            key={`tests-${loadKey}`}
            algorithms={algorithms}
            initial={testState}
            onChange={setTestState}
          />
          <Benchmarks
            key={`bench-${loadKey}`}
            algorithms={algorithms}
            value={benchmark}
            onChange={setBenchmark}
          />
          <StructureStudio onAdd={add} />
          <footer>
            <span>
              <Activity size={14} />
              AlgoVisual <span className="footer-divider">/</span> A little more intuition, one
              algorithm at a time.
            </span>
            <button onClick={() => open("guide")}>
              About the estimates <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className={`modal ${modal === "library" ? "wide-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "library"
                ? "Library"
                : modal === "add"
                  ? "Add algorithm"
                  : modal === "saved"
                    ? "Saved experiments"
                    : modal === "save"
                      ? "Save experiment"
                      : "How it works"
            }
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              const nodes = e.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input, select, textarea, [tabindex="0"]',
              );
              const first = nodes[0],
                last = nodes[nodes.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }}
          >
            <button
              className="modal-close icon-button"
              autoFocus
              onClick={() => setModal(null)}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
            {modal === "library" && (
              <>
                <span className="eyebrow">YOUR DSA TOOLKIT</span>
                <h2>A good place to start.</h2>
                <p className="modal-description">
                  Reviewed models, runnable examples, and the structures behind them.
                </p>
                <div className="library-controls">
                  <div className="segmented">
                    <button
                      className={libraryTab === "algorithms" ? "chosen" : ""}
                      onClick={() => setLibraryTab("algorithms")}
                    >
                      Algorithms
                    </button>
                    <button
                      className={libraryTab === "structures" ? "chosen" : ""}
                      onClick={() => setLibraryTab("structures")}
                    >
                      Data structures
                    </button>
                  </div>
                  <select
                    aria-label="Library language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <label className="search-field">
                  <Search size={16} />
                  <input
                    placeholder="Find your next experiment…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <div className="library-grid">
                  {libraryTab === "algorithms"
                    ? PRESETS.filter((a) =>
                        a.name.toLowerCase().includes(search.toLowerCase()),
                      ).map((a) => (
                        <article className="library-card" key={a.id}>
                          <span className="library-icon" style={{ color: a.color }}>
                            <Code2 size={22} />
                          </span>
                          <h3>{a.name}</h3>
                          <p>{a.explanation}</p>
                          <div className="library-complexities">
                            {CASES.map((c) => (
                              <span key={c}>
                                {c}
                                <b>{LABELS[a.model[c]]}</b>
                              </span>
                            ))}
                          </div>
                          <button
                            className="button secondary small"
                            onClick={() => add({ ...a, language, code: codeFor(a, language) })}
                          >
                            <Plus size={14} />
                            Add to comparison
                          </button>
                        </article>
                      ))
                    : STRUCTURES.filter((s) =>
                        `${s.name} ${s.tag}`.toLowerCase().includes(search.toLowerCase()),
                      ).map((s) => (
                        <article className="library-card" key={s.name}>
                          <span className="soft-tag">{s.tag}</span>
                          <h3>{s.name}</h3>
                          <p>{s.description}</p>
                          <div className="structure-complexities">
                            {[
                              ["Access", s.access],
                              ["Search", s.search],
                              ["Insert", s.insert],
                              ["Delete", s.remove],
                            ].map(([k, v]) => (
                              <span key={k}>
                                {k}
                                <b>{v}</b>
                              </span>
                            ))}
                          </div>
                          <p className="structure-note">{s.notes}</p>
                          <button
                            className="button secondary small"
                            onClick={() => add(structureAlgorithm(s, language))}
                          >
                            <Plus size={14} />
                            Try {language} demo
                          </button>
                        </article>
                      ))}
                </div>
              </>
            )}
            {modal === "add" && (
              <>
                <span className="eyebrow">ANOTHER WAY TO SOLVE IT</span>
                <h2>Add your algorithm</h2>
                <p className="modal-description">
                  Paste a program, then review its suggested case models.
                </p>
                <div className="form-row">
                  <label>
                    Algorithm name
                    <input
                      maxLength={60}
                      value={customName}
                      placeholder="e.g. My optimized sort"
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </label>
                  <label>
                    Language
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="field-label">
                  Source code
                  <textarea
                    className="custom-code"
                    spellCheck={false}
                    maxLength={30000}
                    value={customCode}
                    onChange={(e) => {
                      setCustomCode(e.target.value);
                      setAnalysis(null);
                    }}
                    placeholder={
                      language === "JavaScript"
                        ? "function solve(arr, target) {\n  // Your solution here\n  return arr;\n}"
                        : "Paste a complete program that reads stdin…"
                    }
                  />
                </label>
                <p className="form-hint">
                  Java: use class Main. C / Python: complete stdin/stdout programs. JavaScript: a
                  named function or complete program.
                </p>
                {analysis && (
                  <div className="analysis-notes">
                    <strong>
                      {analysis.confidence === "preset"
                        ? "Library model recognized"
                        : "Suggested model — please review"}
                    </strong>
                    <p>{analysis.notes[0]}</p>
                    <div className="inline-models">
                      {CASES.map((c) => (
                        <label key={c}>
                          {caseNames[c]}
                          <select
                            value={analysis.algorithm.model[c]}
                            onChange={(e) =>
                              setAnalysis({
                                ...analysis,
                                algorithm: {
                                  ...analysis.algorithm,
                                  origin: "manual",
                                  model: {
                                    ...analysis.algorithm.model,
                                    [c]: e.target.value as Complexity,
                                  },
                                },
                              })
                            }
                          >
                            {Object.entries(LABELS).map(([v, label]) => (
                              <option key={v} value={v}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="modal-actions">
                  <button
                    className="text-button"
                    onClick={() => {
                      setLibraryTab("algorithms");
                      open("library");
                    }}
                  >
                    Choose from the library
                  </button>
                  {analysis ? (
                    <button className="button primary" onClick={() => add(analysis.algorithm)}>
                      <Plus size={16} />
                      Add to comparison
                    </button>
                  ) : (
                    <button
                      className="button primary"
                      disabled={!customCode.trim() || busy}
                      onClick={() => analyze(true)}
                    >
                      {busy ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
                      Analyze code
                    </button>
                  )}
                </div>
              </>
            )}
            {modal === "save" && (
              <>
                <span className="modal-hero-icon">
                  <Save size={24} />
                </span>
                <h2>Keep your discovery.</h2>
                <p className="modal-description">
                  Save your code, models, and input settings to PostgreSQL.
                </p>
                <label className="field-label">
                  Experiment name
                  <input
                    maxLength={100}
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                  />
                </label>
                <div className="save-summary">
                  <Code2 size={16} />
                  {algorithms.length} algorithms<span>n = {compact(n)}</span>
                  <span>{caseNames[mode]}</span>
                </div>
                <div className="modal-actions">
                  <button className="text-button" onClick={download}>
                    <ArrowDownToLine size={15} />
                    Export JSON
                  </button>
                  <button
                    className="button primary"
                    onClick={save}
                    disabled={busy || !saveName.trim()}
                  >
                    {busy ? <LoaderCircle size={16} className="spin" /> : <Database size={16} />}
                    Save experiment
                  </button>
                </div>
              </>
            )}
            {modal === "saved" && (
              <>
                <span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span>
                <h2>Saved experiments</h2>
                <p className="modal-description">
                  Your PostgreSQL workspace. Load a saved comparison or import a JSON export.
                </p>
                <input
                  hidden
                  type="file"
                  accept="application/json,.json"
                  ref={fileRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 5000000) throw new Error("File too large");
                      const data = experimentSchema.parse(JSON.parse(await file.text()));
                      load(data);
                    } catch {
                      setError("This is not a valid AlgoVisual experiment JSON file.");
                    }
                    e.target.value = "";
                  }}
                />
                <button className="button secondary small" onClick={() => fileRef.current?.click()}>
                  <FolderOpen size={15} />
                  Import experiment
                </button>
                {busy ? (
                  <div className="empty-state">
                    <LoaderCircle className="spin" />
                    Loading experiments…
                  </div>
                ) : saved.length ? (
                  <div className="saved-list">
                    {saved.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          const parsed = experimentSchema.safeParse(s.data);
                          if (parsed.success) load(parsed.data);
                          else setError("This saved experiment has an incompatible format.");
                        }}
                      >
                        <span className="saved-icon">
                          <FlaskConical size={18} />
                        </span>
                        <span>
                          <strong>{s.name}</strong>
                          <small>
                            {new Date(s.createdAt).toLocaleDateString()} ·{" "}
                            {s.data.algorithms.length} algorithms
                          </small>
                        </span>
                        <ArrowRight size={17} />
                      </button>
                    ))}
                  </div>
                ) : (
                  !error && (
                    <div className="empty-state">
                      <FolderOpen size={32} />
                      <strong>Your discoveries belong here.</strong>
                      <p>Save your first experiment from the workspace.</p>
                    </div>
                  )
                )}
              </>
            )}
            {modal === "guide" && (
              <>
                <span className="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</span>
                <h2>Build your algorithm intuition.</h2>
                <div className="guide-steps">
                  <article>
                    <span>01</span>
                    <div>
                      <h3>Start with a few solutions</h3>
                      <p>
                        Add up to six algorithms from the library or paste your own JavaScript,
                        Python, Java, or C program. Heuristic suggestions always need review.
                      </p>
                    </div>
                  </article>
                  <article>
                    <span>02</span>
                    <div>
                      <h3>Explore all three cases</h3>
                      <p>
                        Best is favorable input, average assumes a specified distribution, and worst
                        is adversarial input. Dashed and dotted curves show the range. Actual code
                        and input determine which case applies.
                      </p>
                    </div>
                  </article>
                  <article>
                    <span>03</span>
                    <div>
                      <h3>Make n bigger. Or smaller.</h3>
                      <p>
                        Estimated time = (cost factor × growth(n) + overhead) ÷ operations per
                        second. Cost factors are illustrative, editable assumptions—not universal
                        language benchmarks. Crossover points are model-dependent.
                      </p>
                    </div>
                  </article>
                  <article>
                    <span>04</span>
                    <div>
                      <h3>Test it with your own cases</h3>
                      <p>
                        Run actual programs with stdin and expected stdout. Each run uses an
                        isolated Docker container. Execution time includes process startup;
                        compilation and container startup are excluded. Tiny runs are noisy. A
                        test-case label is your description, not proof of its asymptotic case.
                      </p>
                    </div>
                  </article>
                  <article>
                    <span>05</span>
                    <div>
                      <h3>Know when you hit the limit</h3>
                      <p>
                        At 10⁸ operations per second and a 1-second limit, a cost-1 quadratic model
                        reaches the budget at n = 10⁴. A linear scan at n = 10⁹ takes an estimated
                        10 seconds. Change the assumptions in Model settings.
                      </p>
                    </div>
                  </article>
                </div>
              </>
            )}
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
