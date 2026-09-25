"use client";
import { useEffect, useRef, useState } from "react";
import { Algorithm, Case, CASES, compact, runtime, formatTime } from "@/lib/algorithms";
type Props = {
  algorithms: Algorithm[];
  n: number;
  mode: Case | "all";
  rate: number;
  timeLimit: number;
  logScale: boolean;
};
const dash: Record<Case, string | undefined> = { best: "3 5", average: undefined, worst: "9 5" };
export default function ComplexityChart({ algorithms, n, mode, rate, timeLimit, logScale }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const W = Math.max(280, width),
    H = width < 500 ? 270 : 340,
    L = width < 500 ? 58 : 80,
    R = 22,
    T = 22,
    B = 48;
  const PW = W - L - R,
    PH = H - T - B;
  const maxN = Math.min(1e9, Math.max(100, 10 ** Math.ceil(Math.log10(Math.max(10, n * 1.2)))));
  const cases = mode === "all" ? CASES : [mode];
  const maxTime = Math.max(
    0.001,
    ...algorithms.flatMap((a) => cases.map((c) => runtime(a, maxN, c, rate))),
  );
  // Cap the display range, not the estimate: explosive curves leave the viewport.
  const maxLog = Math.min(15, Math.ceil(Math.log10(maxTime)));
  const minTime = Math.min(...algorithms.flatMap((a) => cases.map((c) => runtime(a, 1, c, rate))));
  const minLog = Math.min(-3, maxLog - 3, Math.floor(Math.log10(Math.max(1e-15, minTime))));
  const maxY = logScale ? 10 ** maxLog : maxTime > 1e15 ? 1e15 : maxTime * 1.12;
  const x = (value: number) => L + (Math.log10(Math.max(1, value)) / Math.log10(maxN)) * PW;
  const y = (value: number) =>
    T +
    PH -
    (logScale
      ? (Math.log10(Math.max(10 ** minLog, value)) - minLog) / (maxLog - minLog)
      : value / maxY) *
      PH;
  const path = (a: Algorithm, c: Case) =>
    Array.from({ length: 180 }, (_, i) => {
      const value = 10 ** ((i / 179) * Math.log10(maxN));
      return `${i ? "L" : "M"}${x(value).toFixed(2)},${Math.max(-H, y(runtime(a, value, c, rate))).toFixed(2)}`;
    }).join(" ");
  const ticks = Array.from({ length: 6 }, (_, i) =>
    logScale ? 10 ** (minLog + ((maxLog - minLog) * i) / 5) : (maxY * i) / 5,
  );
  const cursorN = hover ?? n;
  const cursorX = x(cursorN);
  const thresholdY = y(timeLimit * 1000);
  return (
    <div className="chart-shell" ref={container}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Estimated runtime graph for ${algorithms.map((a) => a.name).join(", ")}, ${mode} cases`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const p = ((e.clientX - r.left) / r.width) * W;
          if (p >= L && p <= W - R) setHover(Math.round(10 ** (((p - L) / PW) * Math.log10(maxN))));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id="plot-clip">
            <rect x={L} y={T} width={PW} height={PH} />
          </clipPath>
        </defs>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#ecebf2" strokeDasharray="3 5" />
            <text x={L - 15} y={y(v) + 4} textAnchor="end" className="axis-label">
              {formatTime(v)}
            </text>
          </g>
        ))}
        {Array.from({ length: Math.log10(maxN) + 1 }, (_, i) => 10 ** i).map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={T} y2={H - B} stroke="#f0eff5" />
            <text x={x(v)} y={H - B + 25} textAnchor="middle" className="axis-label">
              {compact(v)}
            </text>
          </g>
        ))}
        <g clipPath="url(#plot-clip)">
          {thresholdY > T && thresholdY < H - B && (
            <>
              <rect x={L} y={T} width={PW} height={thresholdY - T} fill="#fef2f2" opacity="0.6" />
              <line
                x1={L}
                x2={W - R}
                y1={thresholdY}
                y2={thresholdY}
                stroke="#dc737a"
                strokeDasharray="6 6"
              />
              <text x={L + 10} y={thresholdY - 8} fill="#b85a63" fontSize="11">
                Estimated TLE above {timeLimit}s
              </text>
            </>
          )}
          {algorithms.map((a) =>
            cases.map((c) => (
              <path
                key={a.id + c}
                d={path(a, c)}
                fill="none"
                stroke={a.color}
                strokeWidth={c === "average" ? 2.8 : 2}
                strokeDasharray={mode === "all" ? dash[c] : undefined}
                opacity={c === "average" || mode !== "all" ? 1 : 0.6}
              />
            )),
          )}
          <line
            x1={cursorX}
            x2={cursorX}
            y1={T}
            y2={H - B}
            stroke="#9f94c5"
            strokeDasharray="4 5"
          />
          {algorithms.map((a) =>
            cases.map((c) => (
              <circle
                key={a.id + c}
                cx={cursorX}
                cy={y(runtime(a, cursorN, c, rate))}
                r={4}
                fill={a.color}
                stroke="white"
                strokeWidth={2}
              />
            )),
          )}
        </g>
        <rect
          x={Math.min(W - R - 66, Math.max(L, cursorX - 33))}
          y={H - B + 8}
          width={66}
          height={24}
          rx={6}
          fill="#7760cb"
        />
        <text
          x={Math.min(W - R - 33, Math.max(L + 33, cursorX))}
          y={H - B + 24}
          textAnchor="middle"
          fill="white"
          fontSize="11"
        >
          {compact(cursorN)}
        </text>
        <text x={W / 2} y={H - 2} textAnchor="middle" className="axis-label">
          Input size (n) · logarithmic scale
        </text>
      </svg>
      {hover !== null && (
        <div className="chart-tooltip">
          <strong>n = {hover.toLocaleString()}</strong>
          {algorithms.map((a) => (
            <div key={a.id}>
              <span>
                <i style={{ background: a.color }} />
                {a.name}
              </span>
              <b>{formatTime(runtime(a, hover, mode === "all" ? "average" : mode, rate))}</b>
            </div>
          ))}
          {mode === "all" && <small>Average-case estimates · dashed lines show best/worst</small>}
        </div>
      )}
    </div>
  );
}
