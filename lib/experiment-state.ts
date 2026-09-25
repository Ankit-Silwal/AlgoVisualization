import { z } from "zod";
export const testCaseSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(60),
  kind: z.enum(["best", "average", "worst", "custom"]),
  stdin: z.string().max(200000),
  expected: z.string().max(16000),
});
export const resultSchema = z.object({
  status: z.enum(["ok", "error", "tle", "compile_error"]),
  durationMs: z.number().nonnegative().finite(),
  stdout: z.string().max(20000),
  stderr: z.string().max(20000),
  samplesMs: z.array(z.number().nonnegative().finite()).max(7).optional(),
  minMs: z.number().nonnegative().finite().optional(),
  maxMs: z.number().nonnegative().finite().optional(),
  algorithm: z.string().max(60),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  caseName: z.string().max(60),
  passed: z.boolean().nullable(),
});
export const testStateSchema = z.object({
  cases: z.array(testCaseSchema).min(1).max(8),
  results: z.array(resultSchema).max(48),
  timeout: z.number().min(0.1).max(5),
  entrypoints: z.record(z.string().max(80), z.string().max(100)),
  submissionModes: z.record(z.string().max(80), z.enum(["auto", "program", "function"])),
  signature: z.string().max(200000),
});
export type TestState = z.infer<typeof testStateSchema>;
export const benchmarkStateSchema = z.object({
  signature: z.string().max(200000),
  createdAt: z.string().datetime(),
  points: z
    .array(
      z.object({
        algorithmId: z.string().max(80),
        name: z.string().max(60),
        color: z.string().regex(/^#[0-9a-f]{6}$/i),
        n: z.number().int().min(1).max(20000),
        case: z.enum(["best", "average", "worst"]),
        medianMs: z.number().nonnegative().finite(),
        minMs: z.number().nonnegative().finite(),
        maxMs: z.number().nonnegative().finite(),
        samplesMs: z.array(z.number().nonnegative().finite()).max(7),
        status: z.enum(["ok", "error", "tle", "compile_error"]),
      }),
    )
    .max(144),
  sizes: z.array(z.number().int().min(1).max(20000)).min(1).max(8),
  repetitions: z.number().int().min(1).max(7),
  template: z.string().max(10000),
  seed: z.number().finite(),
});
