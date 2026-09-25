import { config } from "dotenv";
import assert from "node:assert/strict";
import { PRESETS } from "../lib/algorithms";
import { LANGUAGES, codeFor, STRUCTURES, structureCode } from "../lib/library";
import { runProgram } from "../lib/runner";
config({ path: ".env.local", quiet: true });
const norm = (s: string) => s.trim().replace(/\s+/g, " ");
async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const saved = await db.experiment.create({
    data: { name: "Integration test (temporary)", data: { n: 123, algorithms: [PRESETS[0]] } },
  });
  try {
    const found = await db.experiment.findUnique({ where: { id: saved.id } });
    assert.equal(found?.name, saved.name);
    console.log("PASS PostgreSQL save/read round trip");
  } finally {
    await db.experiment.delete({ where: { id: saved.id } });
    await db.$disconnect();
  }
  for (const language of LANGUAGES) {
    for (const a of PRESETS) {
      const source = codeFor(a, language);
      const result = await runProgram({
        language,
        code: source,
        stdin: a.id === "binary" ? "6\n1 2 3 4 5 6\n4" : "6\n4 1 6 2 5 3\n4",
        timeout: 2,
        entrypoint: language === "JavaScript" ? source.match(/function\s+(\w+)/)?.[1] : undefined,
      });
      assert.equal(result.status, "ok", `${language}/${a.name}: ${result.stderr}`);
      assert.equal(
        norm(result.stdout),
        a.id === "linear" ? "0" : a.id === "binary" ? "3" : "1 2 3 4 5 6",
        `${language}/${a.name} output`,
      );
      console.log(`PASS ${language} / ${a.name}`);
    }
  }
  for (const language of LANGUAGES) {
    for (const s of STRUCTURES) {
      const result = await runProgram({
        language,
        code: structureCode(s, language),
        stdin: "",
        timeout: 2,
      });
      assert.equal(result.status, "ok", `${language}/${s.name}: ${result.stderr}`);
      assert.ok(result.stdout.trim(), `${language}/${s.name} produced no output`);
      console.log(`PASS ${language} / ${s.name} demo`);
    }
  }
  const loop = await runProgram({
    language: "Python",
    code: "while True: pass",
    stdin: "",
    timeout: 0.2,
  });
  assert.equal(loop.status, "tle");
  console.log("PASS timeout termination");
  const bad = await runProgram({ language: "C", code: "not valid C", stdin: "", timeout: 2 });
  assert.equal(bad.status, "compile_error");
  console.log("PASS compilation error reporting");
  const network = await runProgram({
    language: "Python",
    code: "import socket\nsocket.create_connection(('1.1.1.1',80), timeout=1)",
    stdin: "",
    timeout: 2,
  });
  assert.equal(network.status, "error");
  console.log("PASS runner has no external network");
  const readonly = await runProgram({
    language: "Python",
    code: "open('/root-write-check', 'w').write('test')",
    stdin: "",
    timeout: 2,
  });
  assert.equal(readonly.status, "error");
  console.log("PASS runner root filesystem is read-only");
  console.log("All 69 integration checks passed.");
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
