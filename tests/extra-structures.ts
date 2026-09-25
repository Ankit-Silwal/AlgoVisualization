import assert from "node:assert/strict";
import { EXTRA_STRUCTURES } from "../lib/structures-extra";
import { LANGUAGES, structureCode } from "../lib/library";
import { runProgram } from "../lib/runner";
async function main() {
  for (const s of EXTRA_STRUCTURES)
    for (const language of LANGUAGES) {
      const r = await runProgram({
        language,
        code: structureCode(s, language),
        stdin: "",
        timeout: 2,
        mode: "program",
      });
      assert.equal(r.status, "ok", `${s.name}/${language}: ${r.stderr}`);
      assert.ok(r.stdout.trim());
      console.log(`PASS ${s.name} / ${language}`);
    }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
