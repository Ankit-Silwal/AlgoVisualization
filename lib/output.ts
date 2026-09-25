function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
      .join(",")}}`;
  return JSON.stringify(value);
}
export function outputsEqual(actual: string, expected: string) {
  try {
    return canonical(JSON.parse(actual)) === canonical(JSON.parse(expected));
  } catch {
    return actual.trim().replace(/\s+/g, " ") === expected.trim().replace(/\s+/g, " ");
  }
}
