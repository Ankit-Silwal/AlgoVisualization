import type { Complexity } from "./algorithms";
type Loop = { start: number; end: number; growth: Complexity; header: string };
export function inspectCode(source: string, language: string) {
  // Mask comments/literals while preserving offsets and indentation for nesting.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(language === "Python" ? /#[^\n]*/g : /\/\/[^\n]*/g, (m) => " ".repeat(m.length))
    .replace(
      /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g,
      (m) => m.replace(/[^\n]/g, " "),
    );
  const loops: Loop[] = [],
    notes: string[] = [];
  const matches = [...code.matchAll(/\b(for|while)\b/g)];
  for (const match of matches) {
    const start = match.index!;
    let end = code.length,
      header = "",
      body = "";
    if (language === "Python") {
      const lineStart = code.lastIndexOf("\n", start) + 1,
        indent = code.slice(lineStart, start).length;
      const colon = code.indexOf(":", start);
      if (colon < 0) continue;
      header = code.slice(start, colon);
      let next = code.indexOf("\n", colon);
      if (next < 0) next = code.length;
      const after = code.slice(colon + 1, next).trim();
      if (after) end = next;
      else {
        let cursor = next + 1;
        while (cursor < code.length) {
          const lineEnd = code.indexOf("\n", cursor),
            limit = lineEnd < 0 ? code.length : lineEnd,
            line = code.slice(cursor, limit);
          if (line.trim() && line.search(/\S/) <= indent) {
            end = cursor;
            break;
          }
          cursor = limit + 1;
        }
      }
      body = code.slice(colon + 1, end);
    } else {
      const open = code.indexOf("(", start);
      if (open < 0) continue;
      let close = open + 1,
        depth = 1;
      while (close < code.length && depth) {
        if (code[close] === "(") depth++;
        if (code[close] === ")") depth--;
        close++;
      }
      header = code.slice(start, close);
      let begin = close;
      while (/\s/.test(code[begin] || "x")) begin++;
      if (code[begin] === "{") {
        let depth = 1;
        end = begin + 1;
        while (end < code.length && depth) {
          if (code[end] === "{") depth++;
          if (code[end] === "}") depth--;
          end++;
        }
      } else {
        const semi = code.indexOf(";", begin);
        end = semi < 0 ? code.length : semi + 1;
      }
      body = code.slice(begin, end);
    }
    const constant =
      language === "Python"
        ? /\brange\(\s*\d+(?:\s*,\s*\d+){0,2}\s*\)/.test(header)
        : /;\s*\w+\s*(?:<|<=|>|>=)\s*\d+\s*;/.test(header);
    const logarithmic =
      /\b\w+\s*(?:\*=|\/\/?=|>>=|<<=)\s*[2-9]/.test(header + " " + body) ||
      /\b\w+\s*=\s*\w+\s*(?:\/\/|\/|>>|<<)\s*[2-9]/.test(body);
    loops.push({
      start,
      end,
      header,
      growth: constant ? "constant" : logarithmic ? "log" : "linear",
    });
  }
  let maxLinear = 0,
    maxLog = 0;
  for (const loop of loops) {
    const parents = loops.filter((p) => p.start <= loop.start && p.end >= loop.end);
    const lin = parents.filter((p) => p.growth === "linear").length,
      log = parents.filter((p) => p.growth === "log").length;
    if (lin > maxLinear || (lin === maxLinear && log > maxLog)) {
      maxLinear = lin;
      maxLog = log;
    }
  }
  let growth: Complexity =
    maxLinear >= 3
      ? "cubic"
      : maxLinear === 2
        ? "quadratic"
        : maxLinear === 1 && maxLog
          ? "nlogn"
          : maxLinear === 1
            ? "linear"
            : maxLog
              ? "log"
              : "constant";
  if (loops.length)
    notes.push(
      `${loops.length} loop(s); deepest detected nesting has ${maxLinear} input-scaled and ${maxLog} logarithmic loop(s). Sequential loops are added rather than multiplied.`,
    );
  if (loops.some((l) => l.growth === "constant"))
    notes.push("Literal fixed loop bounds contribute constant work relative to n.");
  if (maxLinear > 3 || maxLog > 1 || (maxLinear > 1 && maxLog))
    notes.push(
      "Growth exceeds or differs from the supported model vocabulary. The plotted class is a placeholder; review manually.",
    );
  const names = [...code.matchAll(/(?:function\s+|def\s+)(\w+)\s*\(/g)].map((m) => m[1]);
  if (!names.length)
    for (const m of code.matchAll(
      /\b(?:int|long|double|void|boolean|bool|[A-Z]\w*)(?:\[\])?\s+(\w+)\s*\([^;{}]*\)\s*\{/g,
    ))
      names.push(m[1]);
  let recursive = false;
  for (const name of names) {
    const calls = [...code.matchAll(new RegExp(`\\b${name}\\s*\\(`, "g"))];
    if (calls.length > 1) {
      recursive = true;
      const half = /\/\/?\s*2|>>\s*1|\bmid\b/.test(code),
        decrement = /\b\w+\s*-\s*1/.test(code);
      if (half) {
        growth = calls.length >= 3 ? "nlogn" : maxLinear ? "linear" : "log";
        notes.push(
          "Detected apparent halving recursion. This assumes balanced subproblems and the visible combine work; verify the recurrence.",
        );
      } else if (decrement) {
        growth = calls.length >= 3 ? "exponential" : maxLinear ? "quadratic" : "linear";
        notes.push(
          "Detected apparent size-minus-one recursion. Repeated calls may be memoized; verify whether subproblems repeat.",
        );
      } else
        notes.push(
          "Recursion detected but its size recurrence is unknown. The current model is a placeholder.",
        );
    }
  }
  const library =
    /\.(?:sort|sorted|map|filter|reduce|slice|splice|indexOf|includes|contains|copy|reverse)\s*\(|\b(?:sorted|sum|min|max|any|all)\s*\(/.test(
      code,
    );
  if (library)
    notes.push(
      "Library operations may add work or allocations. Their cost depends on language and receiver types.",
    );
  const earlyExit = loops.some((l) => /\b(?:return|break)\b/.test(code.slice(l.start, l.end)));
  const best: Complexity = earlyExit ? "constant" : growth;
  if (earlyExit)
    notes.push(
      "An early exit can reduce work on favorable inputs. O(1) best case is a suggestion only; preprocessing or outer loops may still run.",
    );
  if (!loops.length && !recursive)
    notes.push(
      "No explicit input-scaled loop or recursion found. Calls, comprehensions, operators, or dynamic dispatch may hide work; constant is only a provisional model.",
    );
  const allocation =
    /\bnew\s+\w+(?:\[\w+\]|\s*\(\s*\w+\s*\))|\[\s*[^\]]*\bfor\b|\.slice\(|\[\s*0\s*\]\s*\*\s*\w+/.test(
      code,
    );
  return {
    model: { best, average: growth, worst: growth },
    space: allocation ? "O(n) suggested" : recursive ? "Recursion-dependent" : "Not inferred",
    notes,
    requiresReview: true as const,
  };
}
